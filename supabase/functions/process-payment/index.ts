import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { session_id } = await req.json();
    if (!session_id) throw new Error("Session ID is required");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Create Supabase client using service role
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Stripe session retrieved", { sessionId: session_id, status: session.payment_status });

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    // Find the order in our database
    const { data: order, error: orderError } = await supabaseService
      .from("orders")
      .select("*")
      .eq("stripe_session_id", session_id)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }
    logStep("Order found", { orderId: order.id });

    // Get order items
    const { data: orderItems, error: orderItemsError } = await supabaseService
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);

    if (orderItemsError || !orderItems) {
      throw new Error("Order items not found");
    }
    const courseIds = orderItems.map((item) => item.course_id);
    logStep("Order items retrieved", { itemCount: orderItems.length });

    // Update order status
    const { error: updateOrderError } = await supabaseService
      .from("orders")
      .update({ status: "completed" })
      .eq("id", order.id);

    if (updateOrderError) {
      logStep("Failed to update order status", { error: updateOrderError });
    }

    // Create course purchases
    const coursePurchases = orderItems.map((item) => ({
      user_id: order.user_id,
      course_id: item.course_id,
      order_id: order.id,
    }));

    const { error: purchasesError } = await supabaseService
      .from("course_purchases")
      .insert(coursePurchases);

    if (purchasesError) {
      logStep("Failed to create course purchases", { error: purchasesError });
      throw new Error("Failed to create course purchases");
    }
    logStep("Course purchases created", { purchaseCount: coursePurchases.length });

    // Enroll user in courses
    const enrollments = orderItems.map((item) => ({
      student_id: order.user_id,
      course_id: item.course_id,
    }));

    const { error: enrollmentError } = await supabaseService
      .from("enrollments")
      .insert(enrollments);

    if (enrollmentError) {
      logStep("Failed to create enrollments", { error: enrollmentError });
      // Don't throw error here as purchases are already created
    } else {
      logStep("Enrollments created", { enrollmentCount: enrollments.length });
    }

    // Clear user's cart
    const { error: cartClearError } = await supabaseService
      .from("cart_items")
      .delete()
      .eq("user_id", order.user_id);

    if (cartClearError) {
      logStep("Failed to clear cart", { error: cartClearError });
    } else {
      logStep("Cart cleared successfully");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Payment processed successfully",
      order_id: order.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in process-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
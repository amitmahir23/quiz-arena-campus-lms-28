import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Service role client to bypass RLS for controlled writes
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    const user = userData.user;

    // Fetch cart items joined with courses to find free courses
    const { data: cartItems, error: cartError } = await supabase
      .from("cart_items")
      .select("course_id, courses!inner(id, price)")
      .eq("user_id", user.id);

    if (cartError) throw cartError;

    const freeCourseIds = (cartItems || [])
      .filter((c: any) => (c.courses?.price ?? 0) === 0)
      .map((c: any) => c.course_id);

    if (freeCourseIds.length === 0) {
      return new Response(JSON.stringify({ error: "No free courses in cart" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Avoid duplicate purchases by checking existing ones
    const { data: existingPurchases, error: existingErr } = await supabase
      .from("course_purchases")
      .select("course_id")
      .eq("user_id", user.id)
      .in("course_id", freeCourseIds);
    if (existingErr) throw existingErr;
    const alreadyOwned = new Set((existingPurchases || []).map((p: any) => p.course_id));
    const newCourseIds = freeCourseIds.filter((id) => !alreadyOwned.has(id));

    if (newCourseIds.length === 0) {
      // Clear free items from cart anyway
      await supabase.from("cart_items").delete().eq("user_id", user.id).in("course_id", freeCourseIds);
      return new Response(JSON.stringify({ enrolled_course_ids: [], message: "Already enrolled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create an order with total_amount 0 and status 'paid'
    const { data: orderInsert, error: orderErr } = await supabase
      .from("orders")
      .insert({ user_id: user.id, total_amount: 0, status: "paid" })
      .select("id")
      .single();
    if (orderErr) throw orderErr;

    const orderId = orderInsert.id;

    // Insert course_purchases for free courses
    const purchasesPayload = newCourseIds.map((courseId) => ({
      user_id: user.id,
      course_id: courseId,
      order_id: orderId,
    }));
    const { error: purchasesErr } = await supabase
      .from("course_purchases")
      .insert(purchasesPayload);
    if (purchasesErr) throw purchasesErr;

    // Insert enrollments
    const enrollmentsPayload = newCourseIds.map((courseId) => ({
      student_id: user.id,
      course_id: courseId,
    }));
    const { error: enrollErr } = await supabase
      .from("enrollments")
      .insert(enrollmentsPayload);
    if (enrollErr) throw enrollErr;

    // Clear those items from cart
    const { error: clearErr } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id)
      .in("course_id", freeCourseIds);
    if (clearErr) throw clearErr;

    return new Response(
      JSON.stringify({ enrolled_course_ids: newCourseIds }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
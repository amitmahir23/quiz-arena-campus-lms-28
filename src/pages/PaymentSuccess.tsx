import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [processed, setProcessed] = useState(false);
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (sessionId && !processed) {
      processPayment();
    }
  }, [sessionId, processed]);

  const processPayment = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: { session_id: sessionId }
      });

      if (error) throw error;

      setProcessed(true);
      toast.success("Payment processed successfully! You now have access to your courses.");
    } catch (error: any) {
      console.error("Payment processing error:", error);
      toast.error("There was an issue processing your payment. Please contact support.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container py-10">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl">
                {isProcessing ? "Processing Payment..." : "Payment Successful!"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {isProcessing ? (
                <div>
                  <p className="text-muted-foreground">
                    Please wait while we process your payment and set up your course access...
                  </p>
                  <div className="mt-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-muted-foreground mb-6">
                    Thank you for your purchase! You now have access to your courses.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button onClick={() => window.location.href = '/courses'}>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      View My Courses
                    </Button>
                    <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
                      Go to Dashboard
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentSuccess;
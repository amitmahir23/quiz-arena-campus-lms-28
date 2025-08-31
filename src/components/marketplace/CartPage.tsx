import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

export const CartPage = () => {
  const { cartItems, total, removeFromCart, clearCart, isRemovingFromCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsProcessing(true);
    try {
      // Check if all courses are free
      if (total === 0) {
        // Ensure user is logged in
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('Please log in to enroll in courses');
          window.location.href = '/auth';
          return;
        }

        // Enroll via secure edge function (handles RLS bypass safely)
        const { data, error } = await supabase.functions.invoke('enroll-free-courses');
        if (error) throw error;

        clearCart();
        toast.success('Successfully enrolled in free courses!');
        
        // Redirect to courses page
        window.location.href = '/courses';
      } else {
        // Handle paid courses through Stripe
        const { data, error } = await supabase.functions.invoke('create-checkout');
        
        if (error) throw error;
        
        if (data?.url) {
          // Open Stripe checkout in new tab
          window.open(data.url, '_blank');
        } else {
          throw new Error('No checkout URL received');
        }
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to process checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Browse our courses and add some to your cart!
          </p>
          <Button onClick={() => window.location.href = '/courses'}>
            Browse Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">
                      {item.courses.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      By {item.courses.profiles?.full_name || 'Unknown Instructor'}
                    </p>
                    <p className="text-lg font-bold text-primary">
                      ${item.courses.price?.toFixed(2)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFromCart(item.course_id)}
                    disabled={isRemovingFromCart}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
              
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : total === 0 ? 'Enroll in Free Courses' : `Checkout - $${total.toFixed(2)}`}
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => clearCart()}
                >
                  Clear Cart
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
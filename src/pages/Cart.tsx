import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { CartPage } from "@/components/marketplace/CartPage";

const Cart = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <CartPage />
      <Footer />
    </div>
  );
};

export default Cart;
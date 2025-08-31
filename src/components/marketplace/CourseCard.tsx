import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, User } from 'lucide-react';
import { useCart } from '@/hooks/useCart';

interface Course {
  id: string;
  title: string;
  price: number;
  preview_description?: string;
  instructor_id: string;
  profiles?: {
    full_name: string;
  };
}

interface CourseCardProps {
  course: Course;
  isPurchased?: boolean;
}

export const CourseCard = ({ course, isPurchased = false }: CourseCardProps) => {
  const { addToCart, cartItems, isAddingToCart } = useCart();

  const isInCart = cartItems.some(item => item.course_id === course.id);

  const handleAddToCart = () => {
    if (!isInCart && !isPurchased) {
      addToCart(course.id);
    }
  };

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
          <Badge variant="secondary" className="ml-2">
            ${course.price.toFixed(2)}
          </Badge>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <User className="h-4 w-4 mr-1" />
          {course.profiles?.full_name || 'Unknown Instructor'}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {course.preview_description || 'No description available'}
        </p>
        
        {isPurchased ? (
          <Button className="w-full" onClick={() => (window.location.href = `/courses/${course.id}`)}>
            Go to Course
          </Button>
        ) : (
          <Button 
            className="w-full" 
            onClick={handleAddToCart}
            disabled={isInCart || isAddingToCart}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {isInCart ? 'In Cart' : 'Add to Cart'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
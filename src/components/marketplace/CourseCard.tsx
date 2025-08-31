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

// Function to get hardcoded image based on course title
const getCourseImage = (title: string): string => {
  const normalizedTitle = title.toLowerCase().trim();
  
  // Map course titles to image filenames
  const imageMap: { [key: string]: string } = {
    'theory of computation': '/images/theory-computation.png',
    'full-stack web development': '/images/fullstack-web.png',
    'javascript mastery 2024': '/images/javascript-mastery.png',
    'software engineering': '/images/software-engineering.png',
    'machine learning fundamentals': '/images/machine-learning.png',
  };

  // Return specific image if found, otherwise return a default image
  return imageMap[normalizedTitle] || '/images/default-course.png';
};

export const CourseCard = ({ course, isPurchased = false }: CourseCardProps) => {
  const { addToCart, cartItems, isAddingToCart } = useCart();

  const isInCart = cartItems.some(item => item.course_id === course.id);
  const courseImage = getCourseImage(course.title);

  const handleAddToCart = () => {
    if (!isInCart && !isPurchased) {
      addToCart(course.id);
    }
  };

  return (
    <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden">
      {/* Course Image */}
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={courseImage}
          alt={course.title}
          className="w-full h-full object-cover transition-transform hover:scale-105"
          onError={(e) => {
            // Fallback to a placeholder if image fails to load
            e.currentTarget.src = 'https://via.placeholder.com/400x200/6366f1/ffffff?text=Course+Image';
          }}
        />
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="bg-white/90 text-gray-900">
            ${course.price.toFixed(2)}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
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
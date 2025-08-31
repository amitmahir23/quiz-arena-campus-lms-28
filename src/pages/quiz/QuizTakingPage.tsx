import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import EmbeddedQuiz from '@/components/course/EmbeddedQuiz';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

const QuizTakingPage = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // Fetch quiz details to get course info for navigation back
  const { data: quiz, isLoading } = useQuery({
    queryKey: ['quiz_details', quizId],
    queryFn: async () => {
      if (!quizId) throw new Error('Quiz ID is required');
      
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          courses (
            id,
            title,
            instructor_id
          )
        `)
        .eq('id', quizId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Quiz not found');
      
      return data;
    },
    enabled: !!quizId
  });

  // Check if user has access to this quiz (enrolled in course or is instructor)
  const { data: hasAccess } = useQuery({
    queryKey: ['quiz_access', quizId, user?.id],
    queryFn: async () => {
      if (!user || !quiz) return false;
      
      // Instructors can always access their own quizzes
      if (quiz.courses.instructor_id === user.id) return true;
      
      // Check if student is enrolled in the course
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('course_id', quiz.courses.id)
        .eq('student_id', user.id)
        .maybeSingle();
        
      return !!enrollment;
    },
    enabled: !!user && !!quiz
  });

  useEffect(() => {
    if (hasAccess === false) {
      toast.error('You do not have access to this quiz');
      navigate('/courses');
    }
  }, [hasAccess, navigate]);

  const handleQuizComplete = () => {
    toast.success('Quiz completed successfully!');
    // Navigate back to the course
    // navigate(`/courses/${quiz?.courses.id}`);
  };

  const handleGoBack = () => {
    if (quiz?.courses.id) {
      navigate(`/courses/${quiz.courses.id}?tab=quizzes`);
    } else {
      navigate('/courses');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg">Loading quiz...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!quiz || hasAccess === false) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Quiz Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The quiz you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate('/courses')}>
              Back to Courses
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={handleGoBack}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {quiz.courses.title}
          </Button>
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{quiz.title}</h1>
            {quiz.description && (
              <p className="text-muted-foreground mt-2">{quiz.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Course: {quiz.courses.title} • {quiz.question_count} questions • {quiz.time_limit} minutes
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <EmbeddedQuiz 
            quizId={quizId!} 
            onComplete={handleQuizComplete}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default QuizTakingPage;
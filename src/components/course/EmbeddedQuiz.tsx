import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';

interface EmbeddedQuizProps {
  quizId: string;
  onComplete?: () => void;
  isCompleted?: boolean;
}

interface QuizQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
  order_position: number;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  time_limit: number;
  question_count: number;
}

const EmbeddedQuiz = ({ quizId, onComplete, isCompleted }: EmbeddedQuizProps) => {
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuizData();
  }, [quizId]);

  const fetchQuizData = async () => {
    try {
      // Fetch quiz details
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (quizError) throw quizError;
      setQuiz(quizData);

      // Fetch quiz questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('order_position');

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);
    } catch (error: any) {
      console.error('Error fetching quiz:', error);
      toast.error('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(selectedAnswers).length !== questions.length) {
      toast.error('Please answer all questions before submitting');
      return;
    }

    setSubmitting(true);
    try {
      // Calculate score
      let correctAnswers = 0;
      questions.forEach((question, index) => {
        if (selectedAnswers[index] === question.correct_answer) {
          correctAnswers++;
        }
      });

      const finalScore = correctAnswers;
      const totalQuestions = questions.length;
      const percentage = Math.round((finalScore / totalQuestions) * 100);

      setScore(finalScore);
      setShowResults(true);

      // Save quiz result to database
      await supabase
        .from('quiz_results')
        .insert({
          quiz_category: quiz?.title || 'embedded-quiz',
          score: finalScore,
          time_taken: 0, // Could track time if needed
          user_id: user?.id
        });

      // If passing grade (e.g., 70% or higher), mark as complete
      if (percentage >= 70 && onComplete) {
        onComplete();
        toast.success(`Quiz completed! Score: ${finalScore}/${totalQuestions} (${percentage}%)`);
      } else if (percentage < 70) {
        toast.error(`Quiz failed. Score: ${finalScore}/${totalQuestions} (${percentage}%). Need 70% to pass.`);
      }
    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading quiz...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Quiz not available</p>
        </CardContent>
      </Card>
    );
  }

  if (isCompleted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            {quiz.title} - Completed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700">You have successfully completed this quiz.</p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={resetQuiz}
          >
            Retake Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= 70;

    return (
      <Card className={passed ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${passed ? 'text-green-800' : 'text-red-800'}`}>
            {passed ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            Quiz Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{score} / {questions.length}</p>
              <p className="text-lg">{percentage}%</p>
              <p className={passed ? 'text-green-700' : 'text-red-700'}>
                {passed ? 'Passed! Well done!' : 'Failed. Need 70% to pass.'}
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Review:</h4>
              {questions.map((question, index) => {
                const userAnswer = selectedAnswers[index];
                const isCorrect = userAnswer === question.correct_answer;
                
                return (
                  <div key={question.id} className={`p-3 rounded-md ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                    <p className="font-medium">{index + 1}. {question.question_text}</p>
                    <p className={`text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                      Your answer: {question.options[userAnswer]} {isCorrect ? '✓' : '✗'}
                    </p>
                    {!isCorrect && (
                      <p className="text-sm text-green-700">
                        Correct answer: {question.options[question.correct_answer]}
                      </p>
                    )}
                    {question.explanation && (
                      <p className="text-xs text-muted-foreground mt-1">{question.explanation}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              {!passed && (
                <Button onClick={resetQuiz} variant="outline">
                  Retake Quiz
                </Button>
              )}
              {passed && onComplete && (
                <Button onClick={onComplete}>
                  Continue to Next Material
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-between">
          <span>{quiz.title}</span>
          <span className="text-sm font-normal text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        </CardTitle>
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">{currentQuestion.question_text}</h3>
          <div className="space-y-2">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                variant={selectedAnswers[currentQuestionIndex] === index ? "default" : "outline"}
                className="w-full text-left justify-start h-auto p-4"
                onClick={() => handleAnswerSelect(currentQuestionIndex, index)}
              >
                <span className="mr-2 font-bold">{String.fromCharCode(65 + index)}.</span>
                {option}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          
          <div className="flex gap-2">
            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={handleSubmitQuiz}
                disabled={submitting || selectedAnswers[currentQuestionIndex] === undefined}
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </Button>
            ) : (
              <Button
                onClick={handleNextQuestion}
                disabled={selectedAnswers[currentQuestionIndex] === undefined}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmbeddedQuiz;
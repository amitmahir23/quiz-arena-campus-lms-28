import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

interface QuizCreationFormProps {
  courseId: string;
  onQuizCreated: (quizId: string) => void;
  onCancel: () => void;
}

const QuizCreationForm = ({ courseId, onQuizCreated, onCancel }: QuizCreationFormProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState(15);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: '1',
      question_text: '',
      options: ['', '', '', ''],
      correct_answer: 0,
      explanation: ''
    }
  ]);
  const [loading, setLoading] = useState(false);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      question_text: '',
      options: ['', '', '', ''],
      correct_answer: 0,
      explanation: ''
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, options: q.options.map((opt, idx) => idx === optionIndex ? value : opt) }
        : q
    ));
  };

  const validateQuiz = () => {
    if (!title.trim()) {
      toast.error('Quiz title is required');
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        toast.error(`Question ${i + 1} text is required`);
        return false;
      }
      
      const filledOptions = q.options.filter(opt => opt.trim() !== '');
      if (filledOptions.length < 2) {
        toast.error(`Question ${i + 1} must have at least 2 options`);
        return false;
      }

      if (!q.options[q.correct_answer] || q.options[q.correct_answer].trim() === '') {
        toast.error(`Question ${i + 1} must have a valid correct answer`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateQuiz()) return;

    setLoading(true);
    try {
      // Create quiz
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          course_id: courseId,
          title,
          description,
          time_limit: timeLimit,
          difficulty,
          question_count: questions.length,
          created_by: user?.id,
          is_published: true
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // Create questions
      const questionsToInsert = questions.map((q, index) => ({
        quiz_id: quizData.id,
        question_text: q.question_text,
        options: q.options.filter(opt => opt.trim() !== ''),
        correct_answer: q.correct_answer,
        explanation: q.explanation || null,
        order_position: index + 1
      }));

      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      toast.success('Quiz created successfully!');
      onQuizCreated(quizData.id);
    } catch (error: any) {
      console.error('Error creating quiz:', error);
      toast.error('Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Quiz</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quiz Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter quiz title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Limit (minutes)</label>
              <Input
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                min={1}
                max={120}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter quiz description"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Difficulty</label>
            <Select value={difficulty} onValueChange={(value) => setDifficulty(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Questions</h3>
              <Button type="button" onClick={addQuestion} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>

            {questions.map((question, questionIndex) => (
              <Card key={question.id} className="border-2">
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <label className="text-sm font-medium">
                          Question {questionIndex + 1}
                        </label>
                        <Textarea
                          value={question.question_text}
                          onChange={(e) => updateQuestion(question.id, 'question_text', e.target.value)}
                          placeholder="Enter your question"
                          required
                        />
                      </div>
                      {questions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(question.id)}
                          className="ml-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Options</label>
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name={`correct-${question.id}`}
                            checked={question.correct_answer === optionIndex}
                            onChange={() => updateQuestion(question.id, 'correct_answer', optionIndex)}
                            className="h-4 w-4"
                          />
                          <Input
                            value={option}
                            onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                            placeholder={`Option ${optionIndex + 1}`}
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Explanation (Optional)</label>
                      <Textarea
                        value={question.explanation || ''}
                        onChange={(e) => updateQuestion(question.id, 'explanation', e.target.value)}
                        placeholder="Explain why this answer is correct"
                        rows={2}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Quiz'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default QuizCreationForm;

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, PencilIcon, Trash2, Globe, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Course {
  id: string;
  title: string;
  description: string;
  code: string;
  is_published: boolean;
  price: number;
}

interface CourseListProps {
  courses: Course[];
  onDelete: () => void;
}

export const CourseList = ({ courses, onDelete }: CourseListProps) => {
  const navigate = useNavigate();

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      toast.success('Course deleted successfully');
      onDelete();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleTogglePublish = async (courseId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_published: !currentStatus })
        .eq('id', courseId);

      if (error) throw error;

      toast.success(`Course ${!currentStatus ? 'published' : 'unpublished'} successfully`);
      onDelete(); // Refetch courses
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <Card key={course.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-xl">{course.title}</span>
              <div className="flex gap-2">
                <Badge variant={course.is_published ? "default" : "secondary"}>
                  {course.is_published ? (
                    <>
                      <Globe className="h-3 w-3 mr-1" />
                      Published
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3 mr-1" />
                      Draft
                    </>
                  )}
                </Badge>
                <Badge variant="outline">${course.price}</Badge>
              </div>
            </CardTitle>
            <CardDescription>
              <div className="text-sm text-muted-foreground mb-2">
                Code: {course.code}
              </div>
              <div className="line-clamp-2">{course.description}</div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center gap-2"
                onClick={() => navigate(`/courses/${course.id}/manage`)}
              >
                <PencilIcon className="h-4 w-4" />
                Manage Course
              </Button>

              <Button 
                variant={course.is_published ? "secondary" : "default"}
                className="w-full flex items-center justify-center gap-2"
                onClick={() => handleTogglePublish(course.id, course.is_published)}
              >
                {course.is_published ? (
                  <>
                    <Lock className="h-4 w-4" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4" />
                    Publish
                  </>
                )}
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 flex items-center justify-center gap-2"
                  onClick={() => navigate(`/courses/${course.id}`)}
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the course and all its associated content.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteCourse(course.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Users, Eye, Trash2, UserCircle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const AdminCoursesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  // Fetch all courses with additional details
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['admin_all_courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:profiles(full_name, avatar_url),
          enrollments(count),
          chapters(count)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch course details for modal
  const { data: courseDetails } = useQuery({
    queryKey: ['admin_course_details', selectedCourse?.id],
    queryFn: async () => {
      if (!selectedCourse?.id) return null;
      
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:profiles(full_name, avatar_url, role),
          enrollments(
            id,
            enrolled_at,
            student:profiles(full_name, avatar_url)
          ),
          chapters(
            id,
            title,
            description,
            order_number,
            chapter_materials(count)
          )
        `)
        .eq('id', selectedCourse.id)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCourse?.id
  });

  // Delete course mutation
  const deleteCourse = useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_all_courses'] });
      toast.success('Course deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete course: ${error.message}`);
    }
  });

  // Delete course content (chapters and materials)
  const deleteCourseContent = useMutation({
    mutationFn: async (courseId: string) => {
      // First get all chapter IDs for this course
      const { data: chapters, error: chaptersError } = await supabase
        .from('chapters')
        .select('id')
        .eq('course_id', courseId);
      
      if (chaptersError) throw chaptersError;
      
      if (chapters && chapters.length > 0) {
        // Delete chapter materials first
        const chapterIds = chapters.map(ch => ch.id);
        const { error: materialError } = await supabase
          .from('chapter_materials')
          .delete()
          .in('chapter_id', chapterIds);
        
        if (materialError) throw materialError;

        // Then delete chapters
        const { error: chapterError } = await supabase
          .from('chapters')
          .delete()
          .eq('course_id', courseId);
          
        if (chapterError) throw chapterError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_all_courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin_course_details'] });
      toast.success('Course content deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete course content: ${error.message}`);
    }
  });

  const handleDeleteCourse = (courseId: string) => {
    deleteCourse.mutate(courseId);
  };

  const handleDeleteContent = (courseId: string) => {
    deleteCourseContent.mutate(courseId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Course Administration</h1>
            <p className="text-muted-foreground">
              Monitor and manage all courses in the system
            </p>
          </div>
        </div>

        {/* Course Statistics */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{courses.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {courses.reduce((sum, course) => sum + (course.enrollments?.[0]?.count || 0), 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Instructors</CardTitle>
              <UserCircle className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(courses.map(course => course.instructor_id)).size}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Chapters</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {courses.reduce((sum, course) => sum + (course.chapters?.[0]?.count || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses List */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">All Courses</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-7 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded mt-2 w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded mt-2 w-5/6"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No courses found</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  No courses have been created in the system yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg">{course.title}</span>
                      <span className="text-sm text-muted-foreground">#{course.code}</span>
                    </CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-2 mt-2">
                        {course.instructor?.avatar_url ? (
                          <img 
                            src={course.instructor.avatar_url} 
                            alt={course.instructor.full_name}
                            className="h-5 w-5 rounded-full"
                          />
                        ) : (
                          <UserCircle className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span>{course.instructor?.full_name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Created: {formatDate(course.created_at)}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Enrollments:</span>
                        <span className="font-medium">{course.enrollments?.[0]?.count || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Chapters:</span>
                        <span className="font-medium">{course.chapters?.[0]?.count || 0}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => setSelectedCourse(course)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{selectedCourse?.title}</DialogTitle>
                            <DialogDescription>
                              Complete course information and management
                            </DialogDescription>
                          </DialogHeader>
                          {courseDetails && (
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">Course Info</h4>
                                <div className="text-sm space-y-1">
                                  <p><strong>Code:</strong> {courseDetails.code}</p>  
                                  <p><strong>Created:</strong> {formatDate(courseDetails.created_at)}</p>
                                  <p><strong>Description:</strong> {courseDetails.description || 'No description'}</p>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Instructor</h4>
                                <div className="flex items-center gap-2">
                                  {courseDetails.instructor?.avatar_url ? (
                                    <img 
                                      src={courseDetails.instructor.avatar_url} 
                                      alt={courseDetails.instructor.full_name}
                                      className="h-8 w-8 rounded-full"
                                    />
                                  ) : (
                                    <UserCircle className="h-8 w-8 text-muted-foreground" />
                                  )}
                                  <span>{courseDetails.instructor?.full_name}</span>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-medium mb-2">Enrolled Students ({courseDetails.enrollments?.length || 0})</h4>
                                <div className="max-h-32 overflow-y-auto space-y-1">
                                  {courseDetails.enrollments?.map((enrollment: any) => (
                                    <div key={enrollment.id} className="flex items-center gap-2 text-sm">
                                      {enrollment.student.avatar_url ? (
                                        <img 
                                          src={enrollment.student.avatar_url} 
                                          alt={enrollment.student.full_name}
                                          className="h-5 w-5 rounded-full"
                                        />
                                      ) : (
                                        <UserCircle className="h-5 w-5 text-muted-foreground" />
                                      )}
                                      <span>{enrollment.student.full_name}</span>
                                    </div>
                                  )) || <p className="text-sm text-muted-foreground">No students enrolled</p>}
                                </div>
                              </div>

                              <div>
                                <h4 className="font-medium mb-2">Chapters ({courseDetails.chapters?.length || 0})</h4>
                                <div className="max-h-32 overflow-y-auto space-y-1">
                                  {courseDetails.chapters?.map((chapter: any) => (
                                    <div key={chapter.id} className="text-sm">
                                      <span className="font-medium">{chapter.order_number}. {chapter.title}</span>
                                      <span className="text-muted-foreground ml-2">
                                        ({chapter.chapter_materials?.[0]?.count || 0} materials)
                                      </span>
                                    </div>
                                  )) || <p className="text-sm text-muted-foreground">No chapters created</p>}
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      <div className="flex gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete Content
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Course Content</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete all chapters and materials for "{course.title}". 
                                The course itself will remain but will be empty.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteContent(course.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete Content
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="flex-1">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete Course
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Entire Course</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{course.title}" and ALL associated data including 
                                chapters, materials, enrollments, and assignments. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCourse(course.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete Course
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
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminCoursesPage;
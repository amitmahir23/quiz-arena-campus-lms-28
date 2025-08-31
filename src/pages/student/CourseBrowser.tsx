import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CourseCard } from "@/components/marketplace/CourseCard";

interface Course {
  id: string;
  title: string;
  price: number;
  preview_description?: string;
  instructor_id: string;
  is_published: boolean;
  profiles?: {
    full_name: string;
  };
}

const CourseBrowser = () => {
  const { user, profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [purchasedCourseIds, setPurchasedCourseIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
    if (user) {
      fetchPurchasedCourses();
    }
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('course_purchases_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'course_purchases', filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          const newCourseId = payload?.new?.course_id;
          if (newCourseId) {
            setPurchasedCourseIds((prev) => (prev.includes(newCourseId) ? prev : [...prev, newCourseId]));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          price,
          preview_description,
          instructor_id,
          is_published,
          profiles!instructor_id(full_name)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error: any) {
      toast.error("Error loading courses: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPurchasedCourses = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('course_purchases')
        .select('course_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setPurchasedCourseIds(data?.map(p => p.course_id) || []);
    } catch (error: any) {
      console.error("Error fetching purchased courses:", error);
    }
  };

  // Redirect if not a student
  if (profile && profile.role !== 'student') {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 container py-10">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground">
              Only students can browse and purchase courses.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Course Marketplace</h1>
          <p className="text-muted-foreground">
            Browse and purchase courses from expert instructors
          </p>
        </div>

        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading courses...</p>
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                isPurchased={purchasedCourseIds.includes(course.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No courses found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Try searching with different keywords' : 'No published courses available yet'}
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CourseBrowser;

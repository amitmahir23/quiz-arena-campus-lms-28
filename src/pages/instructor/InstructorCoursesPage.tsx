import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useUserCourses } from "@/hooks/useUserCourses";
import { useScheduledMeetings } from "@/hooks/useScheduledMeetings";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus } from "lucide-react";
import { CreateMeetingButton } from "@/components/video/CreateMeetingButton";
import { CreateCourseForm } from "@/components/dashboard/instructor/CreateCourseForm";
import { CourseList } from "@/components/dashboard/instructor/CourseList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const InstructorCoursesPage = () => {
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: courses = [], refetch: refetchCourses } = useUserCourses();

  const statsCards = [
    {
      title: "Total Courses",
      value: courses.length,
      icon: BookOpen,
      color: "text-blue-600"
    }
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Courses</h1>
            <p className="text-muted-foreground">
              Manage and organize your courses
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Course
            </Button>
            <CreateMeetingButton />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Course Form */}
        {showCreateForm && (
          <div className="mb-8">
            <CreateCourseForm
              userId={user?.id || ""}
              onSuccess={() => {
                setShowCreateForm(false);
                refetchCourses();
              }}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        )}

        {/* Courses List */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Your Courses</h2>
          {courses.length === 0 && !showCreateForm ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No courses yet</h3>
                <p className="text-muted-foreground mb-4 text-center max-w-md">
                  Start by creating your first course. You can add content, assignments, and manage students.
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Course
                </Button>
              </CardContent>
            </Card>
          ) : (
            <CourseList courses={courses} onDelete={refetchCourses} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default InstructorCoursesPage;
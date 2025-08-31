import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useUserCourses } from "@/hooks/useUserCourses";
import { useScheduledMeetings } from "@/hooks/useScheduledMeetings";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Users, TrendingUp, Activity, BarChart3 } from "lucide-react";
import { CreateMeetingButton } from "@/components/video/CreateMeetingButton";
import { StatsCards } from "@/components/dashboard/instructor/StatsCards";
import { UpcomingMeetings } from "@/components/dashboard/instructor/UpcomingMeetings";
import { CreateCourseForm } from "@/components/dashboard/instructor/CreateCourseForm";
import { CourseList } from "@/components/dashboard/instructor/CourseList";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';

const InstructorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: courses = [], refetch: refetchCourses } = useUserCourses();
  const { meetings: upcomingMeetings, isLoading: isLoadingMeetings } =
    useScheduledMeetings();

  // Fetch instructor analytics
  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['instructor_analytics', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');

      // Get course enrollments with details
      const { data: courseEnrollments, error: enrollmentsError } = await supabase
        .from('courses')
        .select(`
          id, title, created_at, price,
          enrollments(id, enrolled_at),
          chapters(id),
          quizzes(id)
        `)
        .eq('instructor_id', user.id);

      if (enrollmentsError) throw enrollmentsError;

      // Get quiz results for instructor's courses
      const { data: quizResults, error: quizError } = await supabase
        .from('quiz_results')
        .select('score, completed_at, quiz_category');

      if (quizError) throw quizError;

      // Get content created by instructor
      const { data: content, error: contentError } = await supabase
        .from('content')
        .select('views, downloads, created_at, type')
        .eq('author_id', user.id);

      if (contentError) throw contentError;

      // Process enrollment data for charts
      const enrollmentTrend = courseEnrollments?.map(course => ({
        id: course.title,
        enrollments: course.enrollments?.length || 0,
        chapters: course.chapters?.length || 0,
        quizzes: course.quizzes?.length || 0,
        revenue: (course.enrollments?.length || 0) * (course.price || 0)
      })) || [];

      // Monthly enrollment trend
      const monthlyEnrollments = courseEnrollments?.reduce((acc: any, course) => {
        course.enrollments?.forEach((enrollment: any) => {
          const month = new Date(enrollment.enrolled_at).toLocaleDateString('en', { month: 'short', year: 'numeric' });
          if (!acc[month]) acc[month] = 0;
          acc[month]++;
        });
        return acc;
      }, {}) || {};

      const enrollmentTimeData = [{
        id: 'enrollments',
        data: Object.entries(monthlyEnrollments).map(([month, count]) => ({
          x: month,
          y: count as number
        }))
      }];

      const totalEnrollments = courseEnrollments?.reduce((sum, course) => sum + (course.enrollments?.length || 0), 0) || 0;
      const totalRevenue = courseEnrollments?.reduce((sum, course) => sum + ((course.enrollments?.length || 0) * (course.price || 0)), 0) || 0;
      const totalContent = content?.length || 0;
      const totalViews = content?.reduce((sum, item) => sum + (item.views || 0), 0) || 0;

      return {
        courseEnrollments: enrollmentTrend,
        enrollmentTimeData,
        totalEnrollments,
        totalRevenue,
        totalContent,
        totalViews,
        totalCourses: courses.length
      };
    },
    enabled: !!user?.id
  });

  // Filter upcoming meetings (today or future)
  const isUpcomingMeeting = (meeting: any) => {
    const meetingDate = new Date(meeting.scheduled_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return meetingDate >= today;
  };

  const filteredMeetings = upcomingMeetings.filter(isUpcomingMeeting);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your courses and content
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowCreateForm(true)}>
              Create Course
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/instructor/course-quizzes")}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Manage Quizzes
            </Button>
            <CreateMeetingButton />
          </div>
        </div>

        {/* Enhanced Stats Cards with Analytics */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{courses.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-green-600" />
                <div className="text-2xl font-bold text-green-600">{analytics?.totalEnrollments || 0}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <div className="text-2xl font-bold text-purple-600">${analytics?.totalRevenue?.toFixed(2) || '0.00'}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-200 dark:border-orange-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Content Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-orange-600" />
                <div className="text-2xl font-bold text-orange-600">{analytics?.totalViews || 0}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Course Performance</CardTitle>
              <CardDescription>Enrollments and content per course</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {analytics?.courseEnrollments && analytics.courseEnrollments.length > 0 ? (
                  <ResponsiveBar
                    data={analytics.courseEnrollments}
                    keys={['enrollments', 'chapters', 'quizzes']}
                    indexBy="id"
                    margin={{ top: 20, right: 130, bottom: 60, left: 60 }}
                    padding={0.3}
                    valueScale={{ type: 'linear' }}
                    indexScale={{ type: 'band', round: true }}
                    colors={{ scheme: 'nivo' }}
                    borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -45
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0
                    }}
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                    labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                    legends={[
                      {
                        dataFrom: 'keys',
                        anchor: 'bottom-right',
                        direction: 'column',
                        justify: false,
                        translateX: 120,
                        translateY: 0,
                        itemsSpacing: 2,
                        itemWidth: 100,
                        itemHeight: 20,
                        itemDirection: 'left-to-right',
                        itemOpacity: 0.85,
                        symbolSize: 20,
                        effects: [
                          {
                            on: 'hover',
                            style: {
                              itemOpacity: 1
                            }
                          }
                        ]
                      }
                    ]}
                    animate={true}
                    motionConfig="wobbly"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    {isLoadingAnalytics ? 'Loading analytics...' : 'No course data available'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enrollment Trend</CardTitle>
              <CardDescription>Monthly student enrollments over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {analytics?.enrollmentTimeData && analytics.enrollmentTimeData[0]?.data?.length > 0 ? (
                  <ResponsiveLine
                    data={analytics.enrollmentTimeData}
                    margin={{ top: 20, right: 110, bottom: 60, left: 60 }}
                    xScale={{ type: 'point' }}
                    yScale={{
                      type: 'linear',
                      min: 'auto',
                      max: 'auto',
                      stacked: true,
                      reverse: false
                    }}
                    yFormat=" >-.2f"
                    curve="cardinal"
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -45
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0
                    }}
                    pointSize={10}
                    pointColor={{ theme: 'background' }}
                    pointBorderWidth={2}
                    pointBorderColor={{ from: 'serieColor' }}
                    pointLabelYOffset={-12}
                    useMesh={true}
                    legends={[
                      {
                        anchor: 'bottom-right',
                        direction: 'column',
                        justify: false,
                        translateX: 100,
                        translateY: 0,
                        itemsSpacing: 0,
                        itemDirection: 'left-to-right',
                        itemWidth: 80,
                        itemHeight: 20,
                        itemOpacity: 0.75,
                        symbolSize: 12,
                        symbolShape: 'circle',
                        symbolBorderColor: 'rgba(0, 0, 0, .5)',
                        effects: [
                          {
                            on: 'hover',
                            style: {
                              itemBackground: 'rgba(0, 0, 0, .03)',
                              itemOpacity: 1
                            }
                          }
                        ]
                      }
                    ]}
                    animate={true}
                    motionConfig="wobbly"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    {isLoadingAnalytics ? 'Loading trend data...' : 'No enrollment trend data available'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <UpcomingMeetings
          meetings={filteredMeetings}
          isLoading={isLoadingMeetings}
        />

        {showCreateForm && (
          <CreateCourseForm
            userId={user?.id || ""}
            onSuccess={() => {
              setShowCreateForm(false);
              refetchCourses();
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        <CourseList courses={courses} onDelete={refetchCourses} />
      </main>
      <Footer />
    </div>
  );
};

export default InstructorDashboard;

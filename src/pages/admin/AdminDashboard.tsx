
import { useState } from "react";
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users, BookOpen, Trash2, BarChart3, TrendingUp, Activity, Database } from 'lucide-react';
import { toast } from 'sonner';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';

const AdminDashboard = () => {
  const { user } = useAuth();

  // Fetch comprehensive statistics
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin_stats'],
    queryFn: async () => {
      // Get courses with enrollments and instructor info
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:profiles!courses_instructor_id_fkey(full_name),
          enrollments(id),
          chapters(id)
        `);
      
      if (coursesError) throw coursesError;

      // Get total users by role
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('role');
      
      if (profilesError) throw profilesError;

      // Get quiz results for engagement metrics
      const { data: quizResults, error: quizError } = await supabase
        .from('quiz_results')
        .select('*');
      
      if (quizError) throw quizError;

      // Get content statistics
      const { data: content, error: contentError } = await supabase
        .from('content')
        .select('type, views, downloads');
      
      if (contentError) throw contentError;

      // Process data
      const totalCourses = courses?.length || 0;
      const totalEnrollments = courses?.reduce((sum, course) => sum + (course.enrollments?.length || 0), 0) || 0;
      const totalChapters = courses?.reduce((sum, course) => sum + (course.chapters?.length || 0), 0) || 0;
      
      const roleStats = profiles?.reduce((acc: any, profile) => {
        acc[profile.role || 'unknown'] = (acc[profile.role || 'unknown'] || 0) + 1;
        return acc;
      }, {}) || {};

      const avgEnrollments = totalCourses > 0 ? Math.round(totalEnrollments / totalCourses) : 0;
      
      // Course enrollment distribution
      const enrollmentDistribution = courses?.map(course => ({
        id: course.title.substring(0, 20) + (course.title.length > 20 ? '...' : ''),
        value: course.enrollments?.length || 0,
        label: course.title
      })) || [];

      // Content type distribution
      const contentTypeStats = content?.reduce((acc: any, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      }, {}) || {};

      const contentDistribution = Object.entries(contentTypeStats).map(([type, count]) => ({
        id: type,
        label: type.charAt(0).toUpperCase() + type.slice(1),
        value: count
      }));

      return {
        totalCourses,
        totalEnrollments,
        totalChapters,
        totalUsers: profiles?.length || 0,
        totalStudents: roleStats.student || 0,
        totalInstructors: roleStats.instructor || 0,
        totalAdmins: roleStats.admin || 0,
        avgEnrollments,
        totalQuizzes: quizResults?.length || 0,
        totalContent: content?.length || 0,
        totalViews: content?.reduce((sum, item) => sum + (item.views || 0), 0) || 0,
        totalDownloads: content?.reduce((sum, item) => sum + (item.downloads || 0), 0) || 0,
        enrollmentDistribution,
        contentDistribution,
        courses: courses || []
      };
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">System overview and analytics</p>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium">Admin View</span>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats?.totalCourses || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Avg {stats?.avgEnrollments || 0} enrollments per course
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.totalStudents || 0} students, {stats?.totalInstructors || 0} instructors
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border-purple-200 dark:border-purple-800">  
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats?.totalEnrollments || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all courses
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Content & Activity</CardTitle>
              <Activity className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats?.totalContent || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.totalViews || 0} views, {stats?.totalDownloads || 0} downloads
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Course Enrollment Distribution</CardTitle>
              <CardDescription>Number of students enrolled per course</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {stats?.enrollmentDistribution && stats.enrollmentDistribution.length > 0 ? (
                  <ResponsiveBar
                    data={stats.enrollmentDistribution.slice(0, 10)} // Top 10 courses
                    keys={['value']}
                    indexBy="id"
                    margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
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
                    animate={true}
                    motionConfig="wobbly"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No enrollment data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content Type Distribution</CardTitle>
              <CardDescription>Types of content in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {stats?.contentDistribution && stats.contentDistribution.length > 0 ? (
                  <ResponsivePie
                    data={stats.contentDistribution}
                    margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
                    innerRadius={0.5}
                    padAngle={0.7}
                    cornerRadius={3}
                    activeOuterRadiusOffset={8}
                    colors={{ scheme: 'nivo' }}
                    borderWidth={1}
                    borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor="hsl(var(--foreground))"
                    arcLinkLabelsThickness={2}
                    arcLinkLabelsColor={{ from: 'color' }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                    animate={true}
                    motionConfig="wobbly"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No content data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Overview */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Total Chapters</span>
                <span className="font-medium">{stats?.totalChapters || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Quiz Attempts</span>
                <span className="font-medium">{stats?.totalQuizzes || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Admin Users</span>
                <span className="font-medium">{stats?.totalAdmins || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                User Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Students</span>
                  <span className="font-medium">{stats?.totalStudents || 0}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ 
                      width: `${stats?.totalUsers ? (stats.totalStudents / stats.totalUsers) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Instructors</span>
                  <span className="font-medium">{stats?.totalInstructors || 0}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ 
                      width: `${stats?.totalUsers ? (stats.totalInstructors / stats.totalUsers) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/courses">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Manage Courses
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/content-hub">
                  <Database className="h-4 w-4 mr-2" />
                  Content Hub
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/settings">
                  <Shield className="h-4 w-4 mr-2" />
                  System Settings
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Courses</CardTitle>
            <CardDescription>Latest courses added to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.courses?.slice(0, 5).map((course: any) => (
                <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{course.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Code: {course.code} • Instructor: {course.instructor?.full_name || 'Unknown'} • 
                      {course.enrollments?.length || 0} enrollments
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(course.created_at).toLocaleDateString()}
                  </div>
                </div>
              )) || (
                <p className="text-muted-foreground text-center py-8">No courses available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;

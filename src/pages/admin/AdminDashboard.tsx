import { useState } from "react";
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users, BookOpen, Trash2, BarChart3, TrendingUp, Activity, Database } from 'lucide-react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';

const AdminDashboard = () => {
  // Hard-coded statistics
  const stats = {
    totalCourses: 47,
    totalEnrollments: 1284,
    totalChapters: 189,
    totalUsers: 423,
    totalStudents: 365,
    totalInstructors: 32,
    totalAdmins: 5,
    avgEnrollments: 27,
    totalQuizzes: 156,
    totalContent: 391,
    totalViews: 15672,
    totalDownloads: 8934,
    
    // Course enrollment distribution
    enrollmentDistribution: [
      { id: 'React Fundamentals', value: 145, label: 'React Fundamentals' },
      { id: 'Python for Beginners', value: 132, label: 'Python for Beginners' },
      { id: 'Advanced JavaScript', value: 98, label: 'Advanced JavaScript' },
      { id: 'Data Structures', value: 87, label: 'Data Structures & Algorithms' },
      { id: 'Web Design Basics', value: 76, label: 'Web Design Basics' },
      { id: 'Machine Learning', value: 65, label: 'Machine Learning Intro' },
      { id: 'Database Systems', value: 54, label: 'Database Systems' },
      { id: 'Mobile Development', value: 43, label: 'Mobile Development' },
      { id: 'Cloud Computing', value: 38, label: 'Cloud Computing Basics' },
      { id: 'Cybersecurity', value: 32, label: 'Cybersecurity Fundamentals' }
    ],

    // Content type distribution
    contentDistribution: [
      { id: 'video', label: 'Videos', value: 156 },
      { id: 'document', label: 'Documents', value: 89 },
      { id: 'quiz', label: 'Quizzes', value: 67 },
      { id: 'assignment', label: 'Assignments', value: 45 },
      { id: 'presentation', label: 'Presentations', value: 34 }
    ],

    // Monthly activity data
    activityData: [
      { month: 'Jan', students: 120, instructors: 15, courses: 8 },
      { month: 'Feb', students: 150, instructors: 18, courses: 12 },
      { month: 'Mar', students: 180, instructors: 22, courses: 15 },
      { month: 'Apr', students: 220, instructors: 25, courses: 18 },
      { month: 'May', students: 280, instructors: 28, courses: 22 },
      { month: 'Jun', students: 320, instructors: 32, courses: 25 },
      { month: 'Jul', students: 345, instructors: 31, courses: 28 },
      { month: 'Aug', students: 365, instructors: 32, courses: 30 }
    ],

    // Engagement metrics
    engagementData: [
      { category: 'Course Completion', percentage: 78 },
      { category: 'Quiz Participation', percentage: 85 },
      { category: 'Forum Activity', percentage: 62 },
      { category: 'Video Completion', percentage: 71 },
      { category: 'Assignment Submission', percentage: 89 }
    ],

    // Recent courses
    courses: [
      {
        id: '1',
        title: 'Advanced React Development',
        code: 'CS-401',
        instructor: { full_name: 'Sarah Johnson' },
        enrollments: Array(45).fill({}),
        created_at: '2024-08-15T10:30:00Z'
      },
      {
        id: '2',
        title: 'Python Data Science',
        code: 'DS-205',
        instructor: { full_name: 'Dr. Michael Chen' },
        enrollments: Array(38).fill({}),
        created_at: '2024-08-10T14:20:00Z'
      },
      {
        id: '3',
        title: 'UI/UX Design Principles',
        code: 'DES-301',
        instructor: { full_name: 'Emma Rodriguez' },
        enrollments: Array(29).fill({}),
        created_at: '2024-08-08T09:15:00Z'
      },
      {
        id: '4',
        title: 'Machine Learning Fundamentals',
        code: 'ML-101',
        instructor: { full_name: 'Prof. David Kumar' },
        enrollments: Array(25).fill({}),
        created_at: '2024-08-05T16:45:00Z'
      },
      {
        id: '5',
        title: 'Full-Stack Web Development',
        code: 'WEB-501',
        instructor: { full_name: 'Alex Thompson' },
        enrollments: Array(22).fill({}),
        created_at: '2024-08-03T11:30:00Z'
      }
    ]
  };

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
            <Shield className="h-5 w-5 text-purple-500" />
            <span className="text-sm font-medium">Admin View</span>
          </div>
        </div>
        {/* Key Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.totalCourses}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Avg {stats.avgEnrollments} enrollments per course
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalStudents} students, {stats.totalInstructors} instructors
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-200 dark:border-blue-800">  
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalEnrollments}</div>
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
              <div className="text-2xl font-bold text-orange-600">{stats.totalContent}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalViews.toLocaleString()} views, {stats.totalDownloads.toLocaleString()} downloads
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
                <ResponsiveBar
                  data={stats.enrollmentDistribution}
                  keys={['value']}
                  indexBy="id"
                  margin={{ top: 20, right: 20, bottom: 80, left: 60 }}
                  padding={0.3}
                  valueScale={{ type: 'linear' }}
                  indexScale={{ type: 'band', round: true }}
                 colors={['#789DBC']}
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
                    tickRotation: 0,
                    legend: 'Enrollments',
                    legendPosition: 'middle',
                    legendOffset: -40
                  }}
                  labelSkipWidth={12}
                  labelSkipHeight={12}
                  labelTextColor="#FFFFFF"
                  animate={true}
                  motionConfig="wobbly"
                  theme={{
                    background: 'transparent',
                    textColor: 'hsl(var(--foreground))',
                    fontSize: 11,
                    axis: {
                      domain: {
                        line: {
                          stroke: 'hsl(var(--border))',
                          strokeWidth: 1
                        }
                      },
                      legend: {
                        text: {
                          fontSize: 12,
                          fill: 'hsl(var(--foreground))'
                        }
                      },
                      ticks: {
                        line: {
                          stroke: 'hsl(var(--border))',
                          strokeWidth: 1
                        },
                        text: {
                          fontSize: 11,
                          fill: 'hsl(var(--muted-foreground))'
                        }
                      }
                    },
                    grid: {
                      line: {
                        stroke: 'hsl(var(--border))',
                        strokeWidth: 1
                      }
                    }
                  }}
                />
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
                <ResponsivePie
                  data={stats.contentDistribution}
                  margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
                  innerRadius={0.5}
                  padAngle={0.7}
                  cornerRadius={3}
                  activeOuterRadiusOffset={8}
                  colors={['#F2D7D9', '#D3CEDF', '#9CB4CC', '#748DA6', '#8CC0DE']}
                  borderWidth={1}
                  borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                  arcLinkLabelsSkipAngle={10}
                  arcLinkLabelsTextColor="hsl(var(--foreground))"
                  arcLinkLabelsThickness={2}
                  arcLinkLabelsColor={{ from: 'color' }}
                  arcLabelsSkipAngle={10}
                  arcLabelsTextColor="#FFFFFF"
                  animate={true}
                  motionConfig="wobbly"
                  theme={{
                    background: 'transparent',
                    textColor: 'hsl(var(--foreground))',
                    fontSize: 11,
                    labels: {
                      text: {
                        fontSize: 12,
                        fill: '#FFFFFF',
                        fontWeight: 600
                      }
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Analytics */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Platform Growth Trends</CardTitle>
              <CardDescription>Monthly growth in users and courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveBar
                  data={stats.activityData}
                  keys={['students', 'instructors', 'courses']}
                  indexBy="month"
                  margin={{ top: 20, right: 130, bottom: 50, left: 60 }}
                  padding={0.3}
                  valueScale={{ type: 'linear' }}
                  indexScale={{ type: 'band', round: true }}
                  colors={['#F5C8BD', '#FFE3B0', '#9CADA4']}
                  borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Month',
                    legendPosition: 'middle',
                    legendOffset: 32
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Count',
                    legendPosition: 'middle',
                    legendOffset: -40
                  }}
                  labelSkipWidth={12}
                  labelSkipHeight={12}
                  labelTextColor="#FFFFFF"
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
                      itemTextColor: 'hsl(var(--foreground))',
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
                  theme={{
                    background: 'transparent',
                    textColor: 'hsl(var(--foreground))',
                    fontSize: 11,
                    axis: {
                      domain: {
                        line: {
                          stroke: 'hsl(var(--border))',
                          strokeWidth: 1
                        }
                      },
                      legend: {
                        text: {
                          fontSize: 12,
                          fill: 'hsl(var(--foreground))'
                        }
                      },
                      ticks: {
                        line: {
                          stroke: 'hsl(var(--border))',
                          strokeWidth: 1
                        },
                        text: {
                          fontSize: 11,
                          fill: 'hsl(var(--muted-foreground))'
                        }
                      }
                    },
                    grid: {
                      line: {
                        stroke: 'hsl(var(--border))',
                        strokeWidth: 1
                      }
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Engagement Metrics</CardTitle>
              <CardDescription>Student engagement across different activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 h-80 flex flex-col justify-center">
                {stats.engagementData.map((item, index) => (
                  <div key={item.category} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.category}</span>
                      <span className="font-bold text-lg">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-1000 ease-out shadow-sm ${
                          index === 0 ? 'bg-purple-300' :
                          index === 1 ? 'bg-green-200' :
                          index === 2 ? 'bg-blue-300' :
                          index === 3 ? 'bg-orange-200' :
                          'bg-pink-200'
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Overview */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-slate-600" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Chapters</span>
                <span className="font-bold text-lg text-slate-600">{stats.totalChapters}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Quiz Attempts</span>
                <span className="font-bold text-lg text-slate-600">{stats.totalQuizzes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Admin Users</span>
                <span className="font-bold text-lg text-slate-600">{stats.totalAdmins}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900 dark:to-indigo-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                User Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Students</span>
                  <span className="font-bold text-lg text-indigo-600">{stats.totalStudents}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-purple-300 h-2 rounded-full transition-all duration-1000" 
                    style={{ width: `${(stats.totalStudents / stats.totalUsers) * 100}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Instructors</span>
                  <span className="font-bold text-lg text-indigo-600">{stats.totalInstructors}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-green-300 h-2 rounded-full transition-all duration-1000" 
                    style={{ width: `${(stats.totalInstructors / stats.totalUsers) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900 dark:to-emerald-800">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start hover:bg-purple-50 hover:border-purple-300">
                <BookOpen className="h-4 w-4 mr-2" />
                Manage Courses
              </Button>
              <Button variant="outline" className="w-full justify-start hover:bg-green-50 hover:border-green-300">
                <Database className="h-4 w-4 mr-2" />
                Content Hub
              </Button>
              <Button variant="outline" className="w-full justify-start hover:bg-blue-50 hover:border-blue-300">
                <Shield className="h-4 w-4 mr-2" />
                System Settings
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
              {stats.courses.map((course, index) => (
                <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-card-hover transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      index === 0 ? 'bg-purple-100 text-purple-600' :
                      index === 1 ? 'bg-green-100 text-green-600' :
                      index === 2 ? 'bg-blue-100 text-blue-600' :
                      index === 3 ? 'bg-orange-100 text-orange-600' :
                      'bg-pink-100 text-pink-600'
                    }`}>
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{course.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Code: <span className="font-medium">{course.code}</span> • 
                        Instructor: <span className="font-medium">{course.instructor?.full_name}</span> • 
                        <span className="font-medium text-green-600">{course.enrollments?.length} enrollments</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      Added: {new Date(course.created_at).toLocaleDateString()}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                      course.enrollments?.length > 40 ? 'bg-green-100 text-green-700' :
                      course.enrollments?.length > 25 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {course.enrollments?.length > 40 ? 'High Demand' :
                       course.enrollments?.length > 25 ? 'Popular' : 'Growing'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Statistics Section */}
        <div className="grid gap-6 md:grid-cols-4 mt-8">
          <Card className="bg-gradient-to-r from-cyan-500/10 to-cyan-600/10 border-cyan-200 dark:border-cyan-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Content Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-600">{stats.totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total content views</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-pink-500/10 to-pink-600/10 border-pink-200 dark:border-pink-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-600">{stats.totalDownloads.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Resource downloads</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-teal-500/10 to-teal-600/10 border-teal-200 dark:border-teal-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Quiz Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-600">82%</div>
              <p className="text-xs text-muted-foreground">Average passing rate</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-violet-500/10 to-violet-600/10 border-violet-200 dark:border-violet-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-violet-600">287</div>
              <p className="text-xs text-muted-foreground">Monthly active users</p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
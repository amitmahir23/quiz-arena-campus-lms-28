import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChatbotButton } from "@/components/chat/ChatbotButton";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ProfileSettings from "./pages/ProfileSettings";
import SettingsPage from "./pages/settings/SettingsPage";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/auth/AuthPage";
import CourseManagement from "./pages/instructor/CourseManagement";
import CourseView from "./pages/student/CourseView";
import CoursesPage from "./pages/CoursesPage";
import CourseQuizzes from "./pages/instructor/CourseQuizzes";
import QuizBattles from "./pages/quiz/QuizBattles";
import QuizBattlePage from "./pages/quiz/QuizBattlePage";
import QuizTakingPage from "./pages/quiz/QuizTakingPage";
import Cart from "./pages/Cart";
import PaymentSuccess from "./pages/PaymentSuccess";
import { AuthProvider } from "./components/auth/AuthProvider";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import HelpCenter from "./pages/HelpCenter";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ContactUs from "./pages/ContactUs";
import TermsOfService from "./pages/TermsOfService";
import NotificationsPage from "./pages/NotificationsPage";
import SearchResults from "./pages/SearchResults";
import HeroSection from "./components/home/HeroSection";
import VideoMeetingPage from "./pages/video/VideoMeetingPage";

const queryClient = new QueryClient();

const App = () => {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <TooltipProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
                <Route path="/courses" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
                <Route path="/courses/:courseId" element={<ProtectedRoute><CourseView /></ProtectedRoute>} />
                <Route path="/courses/:courseId/manage" element={<ProtectedRoute><CourseManagement /></ProtectedRoute>} />
                <Route path="/courses/:courseId/quizzes" element={<ProtectedRoute><CourseQuizzes /></ProtectedRoute>} />
                <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
                <Route path="/quizzes" element={<ProtectedRoute><QuizBattles /></ProtectedRoute>} />
                <Route path="/quiz-battles" element={<QuizBattles />} />
                <Route path="/quiz-battle/:roomId" element={<QuizBattlePage />} />
                <Route path="/quiz/:quizId" element={<ProtectedRoute><QuizTakingPage /></ProtectedRoute>} />
                
                <Route path="/help" element={<HelpCenter />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/contact" element={<ContactUs />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/meeting/:roomId" element={<ProtectedRoute><VideoMeetingPage /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <ChatbotButton />
              <Toaster />
              <Sonner />
            </TooltipProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;

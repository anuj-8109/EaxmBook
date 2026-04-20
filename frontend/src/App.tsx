import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SystemSettingsProvider } from "@/contexts/SystemSettingsContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Tests from "./pages/Tests";
import TestAttempt from "./pages/TestAttempt";
import TestResult from "./pages/TestResult";
import History from "./pages/History";
import CustomPractice from "./pages/CustomPractice";
import CustomPracticeSession from "./pages/CustomPracticeSession";
import CustomPracticeResult from "./pages/CustomPracticeResult";
import MyProgress from "./pages/MyProgress";
import Jobs from "./pages/Jobs";
import Bookmarks from "./pages/Bookmarks";
import UserMaterials from "./pages/Materials";
import Contact from "./pages/Contact";
import BasicToAdvance from "./pages/BasicToAdvance";
import LevelSelection from "./pages/LevelSelection";
import LevelContent from "./pages/LevelContent";
import LevelPractice from "./pages/LevelPractice";
import SkipTest from "./pages/SkipTest";
import Feedback from "./pages/Feedback";
import Donate from "./pages/Donate";
import Subscriptions from "./pages/Subscriptions";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Categories from "./pages/admin/Categories";
import AdminTests from "./pages/admin/Tests";
import AdminLiveTests from "./pages/admin/LiveTests";
import Questions from "./pages/admin/Questions";
import Subjects from "./pages/admin/Subjects";
import Topics from "./pages/admin/Topics";
import AdminJobs from "./pages/admin/Jobs";
import Materials from "./pages/admin/Materials";
import Users from "./pages/admin/Users";
import AdminFeedback from "./pages/admin/Feedback";
import AdminSettings from "./pages/admin/Settings";
import PaymentSettings from "./pages/admin/PaymentSettings";
import System from "./pages/admin/System";
import AdminProfile from "./pages/admin/AdminProfile";
import AssignQuestions from "./pages/admin/AssignQuestions";
import ExamHierarchy from "./pages/admin/ExamHierarchy";
import UserExamHierarchy from "./pages/UserExamHierarchy";
import NotFound from "./pages/NotFound";
import ExternalRedirect from "./components/ExternalRedirect";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SystemSettingsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/tests" element={<ProtectedRoute><Tests /></ProtectedRoute>} />
            <Route path="/test/:testId" element={<ProtectedRoute><TestAttempt /></ProtectedRoute>} />
            <Route path="/result/:attemptId" element={<ProtectedRoute><TestResult /></ProtectedRoute>} />
            <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
            <Route path="/donate" element={<ProtectedRoute><Donate /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
            <Route path="/practice" element={<ProtectedRoute><CustomPractice /></ProtectedRoute>} />
            <Route path="/practice/session" element={<ProtectedRoute><CustomPracticeSession /></ProtectedRoute>} />
            <Route path="/practice/result" element={<ProtectedRoute><CustomPracticeResult /></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute><MyProgress /></ProtectedRoute>} />
            <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
            <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
            <Route path="/materials" element={<ProtectedRoute><UserMaterials /></ProtectedRoute>} />
            <Route path="/exams" element={<ProtectedRoute><UserExamHierarchy /></ProtectedRoute>} />
            <Route path="/basic-to-advance" element={<ProtectedRoute><BasicToAdvance /></ProtectedRoute>} />
            <Route path="/basic-to-advance/levels" element={<ProtectedRoute><LevelSelection /></ProtectedRoute>} />
            <Route path="/basic-to-advance/level-content" element={<ProtectedRoute><LevelContent /></ProtectedRoute>} />
            <Route path="/basic-to-advance/practice" element={<ProtectedRoute><LevelPractice /></ProtectedRoute>} />
            <Route path="/basic-to-advance/skip-test" element={<ProtectedRoute><SkipTest /></ProtectedRoute>} />
            
            <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/categories" element={<ProtectedRoute adminOnly={true}><Categories /></ProtectedRoute>} />
            <Route path="/admin/exam-hierarchy" element={<ProtectedRoute adminOnly={true}><ExamHierarchy /></ProtectedRoute>} />
            <Route path="/admin/subjects" element={<ProtectedRoute adminOnly={true}><Subjects /></ProtectedRoute>} />
            <Route path="/admin/topics" element={<ProtectedRoute adminOnly={true}><Topics /></ProtectedRoute>} />
            <Route path="/admin/tests" element={<ProtectedRoute adminOnly={true}><AdminTests /></ProtectedRoute>} />
            <Route path="/admin/live-tests" element={<ProtectedRoute adminOnly={true}><AdminLiveTests /></ProtectedRoute>} />
            <Route path="/admin/tests/:testId/assign" element={<ProtectedRoute adminOnly={true}><AssignQuestions /></ProtectedRoute>} />
            <Route path="/admin/questions" element={<ProtectedRoute adminOnly={true}><Questions /></ProtectedRoute>} />
            <Route path="/admin/jobs" element={<ProtectedRoute adminOnly={true}><AdminJobs /></ProtectedRoute>} />
            <Route path="/admin/materials" element={<ProtectedRoute adminOnly={true}><Materials /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute adminOnly={true}><Users /></ProtectedRoute>} />
            <Route path="/admin/feedback" element={<ProtectedRoute adminOnly={true}><AdminFeedback /></ProtectedRoute>} />
            <Route path="/admin/profile" element={<ProtectedRoute adminOnly={true}><AdminProfile /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute adminOnly={true}><AdminSettings /></ProtectedRoute>} />
            <Route path="/admin/settings/payments" element={<ProtectedRoute adminOnly={true}><PaymentSettings /></ProtectedRoute>} />
            <Route path="/admin/system" element={<ProtectedRoute adminOnly={true}><System /></ProtectedRoute>} />
            
            {/* External redirects */}
            <Route path="/Qconnect.com" element={<ExternalRedirect url="Qconnect.com" />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </SystemSettingsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

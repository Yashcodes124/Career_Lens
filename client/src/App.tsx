import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AuthProvider } from "./features/auth/AuthContext";
import { ProtectedRoute } from "./features/auth/ProtectedRoute";
import { LoginForm } from "./features/auth/LoginForm";
import { RegisterForm } from "./features/auth/RegisterForm";
import { UserProfileCard } from "./features/auth/UserProfileCard";
import { ProfileSetupForm } from "./features/auth/ProfileSetupForm";
import { OnboardingWizard } from "./features/auth/OnboardingWizard";
import { JobsPage } from "./features/jobs/JobsPage";
import { SavedJobsPage } from "./features/jobs/SavedJobsPage";
import { TrackerPage } from "./features/tracker/TrackerPage";
import MatchPage from "./features/matching/MatchPage";
import { InterviewPreparationPage } from "./features/interview/InterviewPreparationPage";
import { LiveInterviewPage } from "./features/interview/LiveInterviewPage";
import { InterviewEvaluationPage } from "./features/interview/InterviewEvaluationPage";
import { SkillGapPage } from "./features/matching/SkillGapPage";
import { ResumePage } from "./features/resume/ResumePage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { TailoringPage } from "./features/tailoring/TailoringPage";
import { LandingPage } from "./features/landing/LandingPage";

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          {/* Protected Routes */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingWizard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tailor/:jobId"
            element={
              <ProtectedRoute>
                <TailoringPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/skill-gaps/:jobId"
            element={
              <ProtectedRoute>
                <SkillGapPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfileCard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile-setup"
            element={
              <ProtectedRoute>
                <ProfileSetupPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume"
            element={
              <ProtectedRoute>
                <ResumePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <JobsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications"
            element={
              <ProtectedRoute>
                <TrackerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saved-jobs"
            element={
              <ProtectedRoute>
                <SavedJobsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/matches/:jobId"
            element={
              <ProtectedRoute>
                <MatchPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interviews/:interviewId/prep"
            element={
              <ProtectedRoute>
                <InterviewPreparationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interviews/:interviewId/live"
            element={
              <ProtectedRoute>
                <LiveInterviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interviews/:interviewId/evaluation"
            element={
              <ProtectedRoute>
                <InterviewEvaluationPage />
              </ProtectedRoute>
            }
          />
          {/* Default route */}
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

const AuthShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">{children}</div>
);

// After sign-in, return the user to the page they asked for. Default: the dashboard.
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";
  return (
    <AuthShell>
      <LoginForm
        onSuccess={() => navigate(from, { replace: true })}
        onSwitchToRegister={() => navigate("/register")}
      />
    </AuthShell>
  );
};

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <AuthShell>
      <RegisterForm
        onSuccess={() => navigate("/onboarding", { replace: true })}
        onSwitchToLogin={() => navigate("/login")}
      />
    </AuthShell>
  );
};

const ProfileSetupPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <AuthShell>
      <ProfileSetupForm
        onSuccess={() => navigate("/profile", { replace: true })}
        onSkip={() => navigate("/profile", { replace: true })}
      />
    </AuthShell>
  );
};

const NotFound: React.FC = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-slate-100 mb-4">404</h1>
      <p className="text-slate-400 mb-6">Page not found</p>
      <a href="/" className="text-teal-400 hover:text-teal-300 font-medium">
        Go home
      </a>
    </div>
  </div>
);

export default App;

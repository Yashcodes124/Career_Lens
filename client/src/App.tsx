import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { PageTransition } from "./components/ui/AceternityPrimitives";
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
import { InterviewsPage } from "./features/interview/InterviewsPage";
import { InterviewEvaluationPage } from "./features/interview/InterviewEvaluationPage";
import { SkillGapPage } from "./features/matching/SkillGapPage";
import { ResumePage } from "./features/resume/ResumePage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { ReadinessPage } from "./features/readiness/ReadinessPage";
import { TailoringPage } from "./features/tailoring/TailoringPage";
import { LandingPage } from "./features/landing/LandingPage";

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <PageTransition>
          <Routes>
            {/* Public Landing & Auth Routes */}
            <Route path="/" element={<LandingPage />} />
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
              path="/readiness"
              element={
                <ProtectedRoute>
                  <ReadinessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/skills"
              element={
                <ProtectedRoute>
                  <ReadinessPage />
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
              path="/skill-gap/:jobId"
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
                  <ProfileSetupForm />
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
              path="/interviews"
              element={
                <ProtectedRoute>
                  <InterviewsPage />
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

            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </Router>
    </AuthProvider>
  );
};

const AuthShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex min-h-screen flex-col bg-[#f8fafc] text-slate-900">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-slate-900"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
            TH
          </span>
          <span>TrueHire</span>
        </Link>
        <Link
          to="/"
          className="text-xs font-medium text-slate-600 hover:text-slate-900"
        >
          Back to home
        </Link>
      </div>
    </header>
    <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
      {children}
    </div>
  </div>
);

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from ?? "/dashboard";
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

const NotFound: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4">
    <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
        404 Not Found
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        The page you are looking for does not exist or may have moved.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
      >
        Back to Dashboard
      </Link>
    </div>
  </div>
);

export default App;

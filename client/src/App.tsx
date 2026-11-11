import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  AuthProvider,
  LoginForm,
  RegisterForm,
  ProfileSetupForm,
  UserProfileCard,
  ProtectedRoute,
  OnboardingWizard,
} from "./features/auth";
import { LandingPage } from "./features/landing/LandingPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { JobsPage } from "./features/jobs/JobsPage";
import { SavedJobsPage } from "./features/jobs/SavedJobsPage";
import { ResumePage } from "./features/resume/ResumePage";
import MatchPage from "./features/matching/MatchPage";
import { SkillGapPage } from "./features/matching/SkillGapPage";
import { TailoringPage } from "./features/tailoring/TailoringPage";
import { TrackerPage } from "./features/tracker/TrackerPage";
import { ReadinessPage } from "./features/readiness/ReadinessPage";
import { InterviewPreparationPage } from "./features/interview/InterviewPreparationPage";
import { LiveInterviewPage } from "./features/interview/LiveInterviewPage";
import { InterviewEvaluationPage } from "./features/interview/InterviewEvaluationPage";
import { InterviewsPage } from "./features/interview/InterviewsPage";
import { AppShell } from "./components/layout";
import { Button, Card } from "./components/ui";

const WorkspaceRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <ProtectedRoute>
    <AppShell variant="workspace">{children}</AppShell>
  </ProtectedRoute>
);

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Onboarding Flow */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <AppShell variant="minimal">
                  <OnboardingWizard />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Protected Workspace Routes */}
          <Route
            path="/dashboard"
            element={
              <WorkspaceRoute>
                <DashboardPage />
              </WorkspaceRoute>
            }
          />
          <Route
            path="/readiness"
            element={
              <WorkspaceRoute>
                <ReadinessPage />
              </WorkspaceRoute>
            }
          />
          <Route
            path="/skills"
            element={
              <WorkspaceRoute>
                <ReadinessPage />
              </WorkspaceRoute>
            }
          />
          <Route
            path="/interviews"
            element={
              <WorkspaceRoute>
                <InterviewsPage />
              </WorkspaceRoute>
            }
          />
          <Route
            path="/interviews/:interviewId/prep"
            element={
              <WorkspaceRoute>
                <InterviewPreparationPage />
              </WorkspaceRoute>
            }
          />
          <Route
            path="/interviews/:interviewId/live"
            element={
              <WorkspaceRoute>
                <LiveInterviewPage />
              </WorkspaceRoute>
            }
          />
          <Route
            path="/interviews/:interviewId/evaluation"
            element={
              <WorkspaceRoute>
                <InterviewEvaluationPage />
              </WorkspaceRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <WorkspaceRoute>
                <JobsPage />
              </WorkspaceRoute>
            }
          />
          <Route
            path="/saved-jobs"
            element={
              <WorkspaceRoute>
                <SavedJobsPage />
              </WorkspaceRoute>
            }
          />
          <Route
            path="/applications"
            element={
              <WorkspaceRoute>
                <TrackerPage />
              </WorkspaceRoute>
            }
          />
          <Route
            path="/resume"
            element={
              <WorkspaceRoute>
                <ResumePage />
              </WorkspaceRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <WorkspaceRoute>
                <UserProfileCard />
              </WorkspaceRoute>
            }
          />
          <Route
            path="/profile-setup"
            element={
              <WorkspaceRoute>
                <ProfileSetupForm />
              </WorkspaceRoute>
            }
          />
          <Route
            path="/matches/:jobId"
            element={
              <WorkspaceRoute>
                <MatchPage />
              </WorkspaceRoute>
            }
          />
          <Route
            path="/skill-gap/:jobId"
            element={
              <WorkspaceRoute>
                <SkillGapPage />
              </WorkspaceRoute>
            }
          />
          <Route
            path="/skill-gaps/:jobId"
            element={
              <WorkspaceRoute>
                <SkillGapPage />
              </WorkspaceRoute>
            }
          />
          <Route
            path="/tailor/:jobId"
            element={
              <WorkspaceRoute>
                <TailoringPage />
              </WorkspaceRoute>
            }
          />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from ?? "/dashboard";
  return (
    <AppShell variant="auth">
      <LoginForm
        onSuccess={() => navigate(from, { replace: true })}
        onSwitchToRegister={() => navigate("/register")}
      />
    </AppShell>
  );
};

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <AppShell variant="auth">
      <RegisterForm
        onSuccess={() => navigate("/onboarding", { replace: true })}
        onSwitchToLogin={() => navigate("/login")}
      />
    </AppShell>
  );
};

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  return (
    <AppShell variant="minimal">
      <Card className="mx-auto max-w-md text-center" padding="lg">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          404 Not Found
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-content-heading">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-content-secondary">
          The page you are looking for does not exist or may have moved.
        </p>
        <div className="mt-6 flex justify-center">
          <Button variant="primary" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </Card>
    </AppShell>
  );
};

export default App;

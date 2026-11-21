import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Loader2 } from "lucide-react";
import { MotionConfig } from "framer-motion";
import {
  AuthProvider,
  useAuth,
  LoginForm,
  RegisterForm,
  ProfileSetupForm,
  UserProfileCard,
  ProtectedRoute,
  OnboardingWizard,
} from "./features/auth";
import { ThemeProvider } from "./context/ThemeContext";
import { AppShell } from "./components/layout";
import { Button, Card, PageTransition } from "./components/ui";
import { ErrorBoundary } from "./components/ErrorBoundary";

const LandingPage = lazy(() =>
  import("./features/landing/LandingPage").then((m) => ({
    default: m.LandingPage,
  })),
);
const DashboardPage = lazy(() =>
  import("./features/dashboard/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  })),
);
const JobsPage = lazy(() =>
  import("./features/jobs/JobsPage").then((m) => ({ default: m.JobsPage })),
);
const SavedJobsPage = lazy(() =>
  import("./features/jobs/SavedJobsPage").then((m) => ({
    default: m.SavedJobsPage,
  })),
);
const ResumePage = lazy(() =>
  import("./features/resume/ResumePage").then((m) => ({
    default: m.ResumePage,
  })),
);
const MatchPage = lazy(() => import("./features/matching/MatchPage"));
const SkillGapPage = lazy(() =>
  import("./features/matching/SkillGapPage").then((m) => ({
    default: m.SkillGapPage,
  })),
);
const TailoringPage = lazy(() =>
  import("./features/tailoring/TailoringPage").then((m) => ({
    default: m.TailoringPage,
  })),
);
const TrackerPage = lazy(() =>
  import("./features/tracker/TrackerPage").then((m) => ({
    default: m.TrackerPage,
  })),
);
const ReadinessPage = lazy(() =>
  import("./features/readiness/ReadinessPage").then((m) => ({
    default: m.ReadinessPage,
  })),
);
const InterviewPreparationPage = lazy(() =>
  import("./features/interview/InterviewPreparationPage").then((m) => ({
    default: m.InterviewPreparationPage,
  })),
);
const LiveInterviewPage = lazy(() =>
  import("./features/interview/LiveInterviewPage").then((m) => ({
    default: m.LiveInterviewPage,
  })),
);
const InterviewEvaluationPage = lazy(() =>
  import("./features/interview/InterviewEvaluationPage").then((m) => ({
    default: m.InterviewEvaluationPage,
  })),
);
const InterviewsPage = lazy(() =>
  import("./features/interview/InterviewsPage").then((m) => ({
    default: m.InterviewsPage,
  })),
);
const OntologyDashboardPage = lazy(
  () => import("./features/ontology/OntologyDashboardPage"),
);
const RoleFitRadarPage = lazy(() =>
  import("./features/radar/RoleFitRadarPage").then((m) => ({
    default: m.RoleFitRadarPage,
  })),
);
const AdminDashboardPage = lazy(() =>
  import("./features/admin/AdminDashboardPage").then((m) => ({
    default: m.AdminDashboardPage,
  })),
);

const RouteLoadingFallback: React.FC = () => (
  <div className="flex min-h-[60vh] items-center justify-center bg-canvas">
    <div className="flex flex-col items-center gap-2.5">
      <Loader2
        className="h-7 w-7 motion-safe:animate-spin text-primary"
        aria-hidden="true"
      />
      <p className="text-xs font-medium text-content-secondary">
        Loading view...
      </p>
    </div>
  </div>
);

const WorkspaceRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  return (
    <ProtectedRoute>
      <AppShell variant="workspace">
        <Suspense fallback={<RouteLoadingFallback />}>
          <PageTransition key={location.pathname}>{children}</PageTransition>
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  );
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className="h-8 w-8 motion-safe:animate-spin text-primary"
            aria-hidden="true"
          />
          <p className="text-sm text-content-secondary">
            Verifying admin access...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user?.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return <WorkspaceRoute>{children}</WorkspaceRoute>;
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <ThemeProvider>
          <AuthProvider>
            <Router>
              <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboardPage />
                  </AdminRoute>
                }
              />

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
                path="/ontology"
                element={
                  <WorkspaceRoute>
                    <OntologyDashboardPage />
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
                path="/radar"
                element={
                  <WorkspaceRoute>
                    <RoleFitRadarPage />
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
              </Suspense>
            </Router>
          </AuthProvider>
        </ThemeProvider>
      </MotionConfig>
    </ErrorBoundary>
  );
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from ?? "/dashboard";
  return (
    <AppShell variant="auth">
      <PageTransition className="w-full flex justify-center">
        <LoginForm
          onSuccess={() => navigate(from, { replace: true })}
          onSwitchToRegister={() => navigate("/register")}
        />
      </PageTransition>
    </AppShell>
  );
};

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <AppShell variant="auth">
      <PageTransition className="w-full flex justify-center">
        <RegisterForm
          onSuccess={() => navigate("/onboarding", { replace: true })}
          onSwitchToLogin={() => navigate("/login")}
        />
      </PageTransition>
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

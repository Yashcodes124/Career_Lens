import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./features/auth/AuthContext";
import { ProtectedRoute } from "./features/auth/ProtectedRoute";
import { LoginForm } from "./features/auth/LoginForm";
import { RegisterForm } from "./features/auth/RegisterForm";
import { UserProfileCard } from "./features/auth/UserProfileCard";
import { ProfileSetupForm } from "./features/auth/ProfileSetupForm";
import { JobsPage } from "./features/jobs/JobsPage";
import { SavedJobsPage } from "./features/jobs/SavedJobsPage";
import { TrackerPage } from "./features/tracker/TrackerPage";
import MatchPage from "./features/matching/MatchPage";
import { InterviewPreparationPage } from "./features/interview/InterviewPreparationPage";
import { LiveInterviewPage } from "./features/interview/LiveInterviewPage";
import { InterviewEvaluationPage } from "./features/interview/InterviewEvaluationPage";

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
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

const LoginPage: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
    <LoginForm
      onSuccess={() => (window.location.href = "/profile")}
      onSwitchToRegister={() => (window.location.href = "/register")}
    />
  </div>
);

const RegisterPage: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
    <RegisterForm
      onSuccess={() => (window.location.href = "/profile-setup")}
      onSwitchToLogin={() => (window.location.href = "/login")}
    />
  </div>
);

const ProfileSetupPage: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
    <ProfileSetupForm
      onSuccess={() => (window.location.href = "/profile")}
      onSkip={() => (window.location.href = "/profile")}
    />
  </div>
);

const NotFound: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-slate-100 mb-4">404</h1>
      <p className="text-slate-400 mb-6">Page not found</p>
      <a href="/" className="text-indigo-400 hover:text-indigo-300 font-medium">
        Go home
      </a>
    </div>
  </div>
);

export default App;

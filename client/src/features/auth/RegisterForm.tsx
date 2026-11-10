import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useAuth } from "./useAuth";
import {
  Button,
  Card,
  ErrorState,
  Input,
  ProgressBar,
  Toast,
} from "../../components/ui";

export interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onSwitchToLogin,
}) => {
  const auth = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const passwordStrength = useMemo(() => {
    if (!password)
      return { score: 0, label: "Min. 8 characters", tone: "primary" as const };
    let points = 0;
    if (password.length >= 8) points += 40;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) points += 20;
    if (/\d/.test(password)) points += 20;
    if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) points += 20;

    if (points >= 80)
      return {
        score: points,
        label: "Strong password",
        tone: "success" as const,
      };
    if (points >= 60)
      return {
        score: points,
        label: "Good password",
        tone: "primary" as const,
      };
    return {
      score: Math.max(25, points),
      label: "Use at least 8 characters with letters and numbers",
      tone: "warning" as const,
    };
  }, [password]);

  const validate = (): boolean => {
    const nextErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!name.trim()) {
      nextErrors.name = "Enter your full name.";
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      nextErrors.email = "Enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Create a password.";
    } else if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const registerFn = auth.register as (
        ...args: unknown[]
      ) => Promise<unknown>;
      if (registerFn.length >= 2) {
        await registerFn(email.trim(), password, name.trim());
      } else {
        await registerFn({
          name: name.trim(),
          email: email.trim(),
          password,
        });
      }
      setRegisterSuccess(true);
      onSuccess?.();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to create your account. Please try again.";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError =
    formError || ((auth as unknown as { error?: string | null }).error ?? null);

  return (
    <div className="w-full max-w-md space-y-4">
      {registerSuccess && (
        <Toast
          tone="success"
          title="Account created"
          description="Taking you to onboarding setup..."
        />
      )}

      <Card padding="lg" className="space-y-6">
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight text-content-heading sm:text-2xl">
            Create your account
          </h1>
          <p className="text-sm text-content-secondary">
            Upload your resume, compare your skills against real engineering
            roles, and track your interview readiness.
          </p>
        </div>

        {activeError && (
          <ErrorState title="Registration failed" message={activeError} />
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Full name"
            type="text"
            name="name"
            autoComplete="name"
            placeholder="Aarav Sharma"
            value={name}
            disabled={isSubmitting}
            error={fieldErrors.name}
            leftAddon={<User className="h-4 w-4" />}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) {
                setFieldErrors((prev) => ({ ...prev, name: undefined }));
              }
            }}
          />

          <Input
            label="Email address"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            disabled={isSubmitting}
            error={fieldErrors.email}
            leftAddon={<Mail className="h-4 w-4" />}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) {
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }
            }}
          />

          <div className="space-y-2">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              disabled={isSubmitting}
              error={fieldErrors.password}
              leftAddon={<Lock className="h-4 w-4" />}
              rightAddon={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="rounded-sm p-1 text-content-secondary hover:text-content-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
            />
            {password.length > 0 && (
              <ProgressBar
                value={passwordStrength.score}
                tone={passwordStrength.tone}
                label={passwordStrength.label}
                showValue={false}
              />
            )}
          </div>

          <Input
            label="Confirm password"
            type={showPassword ? "text" : "password"}
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            disabled={isSubmitting}
            error={fieldErrors.confirmPassword}
            leftAddon={<Lock className="h-4 w-4" />}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (fieldErrors.confirmPassword) {
                setFieldErrors((prev) => ({
                  ...prev,
                  confirmPassword: undefined,
                }));
              }
            }}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
          >
            Create account
          </Button>
        </form>

        <div className="border-t border-border pt-4 text-center text-xs text-content-secondary">
          <span>Already have an account? </span>
          {onSwitchToLogin ? (
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
            >
              Sign in
            </button>
          ) : (
            <Link
              to="/login"
              className="font-semibold text-primary hover:underline"
            >
              Sign in
            </Link>
          )}
        </div>
      </Card>
    </div>
  );
};

export default RegisterForm;

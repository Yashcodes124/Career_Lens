import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAuth } from "./useAuth";
import {
  Button,
  Card,
  Checkbox,
  ErrorState,
  Input,
  Toast,
} from "../../components/ui";

export interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToRegister,
}) => {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const validate = (): boolean => {
    const nextErrors: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      nextErrors.email = "Enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Enter your password.";
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
      const loginFn = auth.login as (...args: unknown[]) => Promise<unknown>;
      if (loginFn.length >= 2) {
        await loginFn(email.trim(), password);
      } else {
        await loginFn({ email: email.trim(), password });
      }
      setLoginSuccess(true);
      onSuccess?.();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Invalid email or password. Please check your credentials and try again.";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError =
    formError || ((auth as unknown as { error?: string | null }).error ?? null);

  return (
    <div className="w-full max-w-md space-y-4">
      {loginSuccess && (
        <Toast
          tone="success"
          title="Signed in"
          description="Loading your readiness workspace..."
        />
      )}

      <Card padding="lg" className="space-y-6">
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight text-content-heading sm:text-2xl">
            Sign in to TrueHire
          </h1>
          <p className="text-sm text-content-secondary">
            Continue your interview preparation and review your role matches.
          </p>
        </div>

        {activeError && (
          <ErrorState title="Unable to sign in" message={activeError} />
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
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

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password"
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

          <div className="flex items-center justify-between pt-1">
            <Checkbox
              label="Keep me signed in"
              checked={rememberMe}
              disabled={isSubmitting}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
          >
            Sign in
          </Button>
        </form>

        <div className="border-t border-border pt-4 text-center text-xs text-content-secondary">
          <span>New to TrueHire? </span>
          {onSwitchToRegister ? (
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
            >
              Create an account
            </button>
          ) : (
            <Link
              to="/register"
              className="font-semibold text-primary hover:underline"
            >
              Create an account
            </Link>
          )}
        </div>
      </Card>
    </div>
  );
};

export default LoginForm;

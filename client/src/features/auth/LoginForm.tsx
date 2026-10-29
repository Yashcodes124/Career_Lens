import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./useAuth";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToRegister,
}) => {
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (!email.trim() || !password) {
      setLocalError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setLocalError(err.message || "Invalid email or password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-sm rounded-xl border border-zinc-800/90 bg-zinc-900/40 p-7 shadow-2xl">
      <div className="mb-7">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-tight text-zinc-300 hover:text-white"
        >
          <span className="h-2 w-2 rounded-full bg-teal-400" />
          <span>TrueHire</span>
        </Link>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-white">
          Sign in to your account
        </h1>
        <p className="mt-1 text-xs text-zinc-400">
          Continue your job discovery and interview readiness workflow.
        </p>
      </div>

      {(localError || error) && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-950/30 p-3.5 text-xs text-red-300"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <span>{localError || error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-zinc-400">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-lg border border-zinc-800 bg-[#09090b] px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-teal-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-zinc-400">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full rounded-lg border border-zinc-800 bg-[#09090b] px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-teal-500"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-teal-500 px-4 py-2.5 text-xs font-semibold text-zinc-950 transition hover:bg-teal-400 active:scale-[0.98] disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {onSwitchToRegister && (
        <div className="mt-6 border-t border-zinc-800/80 pt-5 text-center text-xs text-zinc-400">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-semibold text-teal-400 hover:text-teal-300"
          >
            Create an account
          </button>
        </div>
      )}
    </div>
  );
};

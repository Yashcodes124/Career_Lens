import React from "react";
import { AlertCircle, Inbox, RotateCw, Loader2 } from "lucide-react";

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  description,
  actions,
}) => (
  <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
    <div className="space-y-1">
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          {eyebrow}
        </p>
      )}
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px]">
        {title}
      </h1>
      {description && (
        <p className="max-w-2xl text-sm text-slate-600">{description}</p>
      )}
    </div>
    {actions && (
      <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
    )}
  </header>
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}) => {
  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary:
      "bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-sm disabled:opacity-50",
    secondary:
      "bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50",
    outline:
      "border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50",
    danger:
      "border border-red-200 bg-red-50 text-red-700 font-medium hover:bg-red-100 disabled:opacity-50",
    ghost:
      "text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50",
  };

  const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2 text-sm rounded-lg",
    lg: "px-5 py-2.5 text-sm rounded-xl",
  };

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
};

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div
    className={`rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm ${className}`}
  >
    {children}
  </div>
);

export type BadgeTone =
  "neutral" | "primary" | "success" | "warning" | "danger";

export const Badge: React.FC<{
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}> = ({ tone = "neutral", children, className = "" }) => {
  const tones: Record<BadgeTone, string> = {
    neutral: "border-slate-200 bg-slate-100 text-slate-700",
    primary: "border-blue-200 bg-blue-50 text-blue-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    danger: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
};

export type SkillReadinessLevel =
  "VERIFIED" | "PRACTICED" | "WEAK" | "EXTRACTED" | "MISSING";

export const SkillBadge: React.FC<{
  skill: string;
  level?: SkillReadinessLevel;
  meta?: string;
}> = ({ skill, level = "EXTRACTED", meta }) => {
  const levelMap: Record<
    SkillReadinessLevel,
    { tone: BadgeTone; label: string }
  > = {
    VERIFIED: { tone: "success", label: "Verified" },
    PRACTICED: { tone: "primary", label: "Practiced" },
    WEAK: { tone: "warning", label: "Needs practice" },
    EXTRACTED: { tone: "neutral", label: "Resume" },
    MISSING: { tone: "danger", label: "Missing" },
  };
  const cfg = levelMap[level];

  return (
    <Badge tone={cfg.tone}>
      <span>{skill}</span>
      {meta ? (
        <span className="opacity-75">· {meta}</span>
      ) : (
        <span className="opacity-75">· {cfg.label}</span>
      )}
    </Badge>
  );
};

export const ScoreRing: React.FC<{
  score: number | null;
  size?: number;
  label?: string;
}> = ({ score, size = 76, label }) => {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = score === null ? 0 : Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;

  const strokeColor =
    score === null
      ? "stroke-slate-300"
      : clamped >= 75
        ? "stroke-emerald-600"
        : clamped >= 50
          ? "stroke-blue-600"
          : "stroke-amber-500";

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            strokeWidth={strokeWidth}
            className="stroke-slate-200"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`transition-all duration-500 ${strokeColor}`}
          />
        </svg>
        <span className="absolute text-base font-semibold text-slate-900 tabular-nums">
          {score === null ? "N/A" : `${clamped}%`}
        </span>
      </div>
      {label && (
        <span className="text-xs font-medium text-slate-500">{label}</span>
      )}
    </div>
  );
};

export const ProgressBar: React.FC<{
  value: number;
  max?: number;
  tone?: "primary" | "success" | "warning";
  label?: string;
}> = ({ value, max = 100, tone = "primary", label }) => {
  const pct =
    max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;
  const barColors = {
    primary: "bg-blue-600",
    success: "bg-emerald-600",
    warning: "bg-amber-500",
  };

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <div className="flex items-center justify-between text-xs font-medium text-slate-600 tabular-nums">
          <span>{label}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColors[tone]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  subtext?: string;
  tone?: "default" | "success" | "warning" | "primary";
}> = ({ label, value, subtext, tone = "default" }) => {
  const valueColors = {
    default: "text-slate-900",
    primary: "text-blue-600",
    success: "text-emerald-600",
    warning: "text-amber-600",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p
        className={`mt-1.5 text-2xl font-semibold tabular-nums ${valueColors[tone]}`}
      >
        {value}
      </p>
      {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
    </div>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({
  className = "h-4 w-full",
}) => (
  <div className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} />
);

export const EmptyState: React.FC<{
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center">
    <Inbox className="h-7 w-7 text-slate-400" aria-hidden="true" />
    <h3 className="mt-3 text-sm font-semibold text-slate-900">{title}</h3>
    <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-600">
      {description}
    </p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const ErrorState: React.FC<{
  message: string;
  onRetry?: () => void;
}> = ({ message, onRetry }) => (
  <div
    role="alert"
    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
  >
    <div className="flex items-center gap-2.5">
      <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
      <span>{message}</span>
    </div>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
      >
        <RotateCw className="h-3 w-3" />
        <span>Try again</span>
      </button>
    )}
  </div>
);

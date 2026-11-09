import React, { useEffect, useId, useRef, useState } from "react";
import {
  AlertCircle,
  Bookmark,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  HelpCircle,
  Inbox,
  Info,
  Loader2,
  MapPin,
  RotateCw,
  X,
} from "lucide-react";

/* ============================================================================
   1. BUTTON
   ============================================================================ */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = "",
      children,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
      primary:
        "bg-primary text-white border border-transparent hover:bg-primary-hover shadow-xs",
      secondary:
        "bg-muted text-content-heading border border-border hover:bg-border/60",
      outline:
        "bg-surface text-content-body border border-border hover:bg-muted hover:text-content-heading",
      danger:
        "bg-status-danger-soft text-status-danger border border-status-danger-border hover:bg-status-danger hover:text-white",
      ghost:
        "bg-transparent text-content-secondary border border-transparent hover:bg-muted hover:text-content-heading",
    };

    const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
      sm: "h-8 px-3 text-xs rounded-sm gap-1.5",
      md: "h-10 px-4 text-sm rounded-input gap-2",
      lg: "h-11 px-5 text-sm rounded-input gap-2",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading}
        className={`inline-flex items-center justify-center font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
        {...props}
      >
        {loading ? (
          <Loader2
            className="h-4 w-4 shrink-0 animate-spin"
            aria-hidden="true"
          />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  },
);
Button.displayName = "Button";

/* ============================================================================
   2. INPUT
   ============================================================================ */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftAddon,
      rightAddon,
      id,
      disabled,
      className = "",
      containerClassName = "",
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className={`w-full space-y-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-content-heading"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftAddon && (
            <div className="pointer-events-none absolute left-3 flex items-center text-content-secondary">
              {leftAddon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={`h-10 w-full rounded-input border bg-surface px-3.5 py-2 text-sm text-content-heading placeholder:text-content-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 ${
              error
                ? "border-status-danger focus-visible:ring-status-danger"
                : "border-border hover:border-border-strong"
            } ${leftAddon ? "pl-9" : ""} ${rightAddon ? "pr-9" : ""} ${className}`}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3 flex items-center text-content-secondary">
              {rightAddon}
            </div>
          )}
        </div>
        {error ? (
          <p id={errorId} role="alert" className="text-xs text-status-danger">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-content-secondary">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";

/* ============================================================================
   3. TEXTAREA
   ============================================================================ */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      id,
      disabled,
      rows = 4,
      className = "",
      containerClassName = "",
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    return (
      <div className={`w-full space-y-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-medium text-content-heading"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`w-full rounded-input border bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-content-heading placeholder:text-content-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 ${
            error
              ? "border-status-danger focus-visible:ring-status-danger"
              : "border-border hover:border-border-strong"
          } ${className}`}
          {...props}
        />
        {error ? (
          <p id={errorId} role="alert" className="text-xs text-status-danger">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-content-secondary">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

/* ============================================================================
   4. SELECT
   ============================================================================ */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options?: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      options,
      placeholder,
      id,
      disabled,
      children,
      className = "",
      containerClassName = "",
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    return (
      <div className={`w-full space-y-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium text-content-heading"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`h-10 w-full rounded-input border bg-surface px-3.5 py-2 text-sm text-content-heading transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 ${
            error
              ? "border-status-danger focus-visible:ring-status-danger"
              : "border-border hover:border-border-strong"
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options
            ? options.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                >
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error ? (
          <p id={errorId} role="alert" className="text-xs text-status-danger">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-content-secondary">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);
Select.displayName = "Select";

/* ============================================================================
   5. CHECKBOX
   ============================================================================ */
export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: React.ReactNode;
  description?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    { label, description, error, id, disabled, className = "", ...props },
    ref,
  ) => {
    const generatedId = useId();
    const checkboxId = id || generatedId;

    return (
      <div className={`flex items-start gap-2.5 ${className}`}>
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-border bg-surface text-primary accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          {...props}
        />
        {(label || description || error) && (
          <div className="space-y-0.5 text-sm">
            {label && (
              <label
                htmlFor={checkboxId}
                className={`font-medium text-content-heading select-none ${
                  disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                }`}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-content-secondary">{description}</p>
            )}
            {error && (
              <p role="alert" className="text-xs text-status-danger">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    );
  },
);
Checkbox.displayName = "Checkbox";

/* ============================================================================
   6. BADGE
   ============================================================================ */
export type BadgeTone =
  "neutral" | "primary" | "success" | "warning" | "danger";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: "sm" | "md";
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  tone = "neutral",
  size = "md",
  icon,
  children,
  className = "",
  ...props
}) => {
  const tones: Record<BadgeTone, string> = {
    neutral: "border-border bg-muted text-content-body",
    primary: "border-primary/20 bg-primary-soft text-primary",
    success:
      "border-status-success-border bg-status-success-soft text-status-success",
    warning:
      "border-status-warning-border bg-status-warning-soft text-status-warning",
    danger:
      "border-status-danger-border bg-status-danger-soft text-status-danger",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-0.5 text-xs",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border font-medium leading-5 ${tones[tone]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

/* ============================================================================
   7. CARD
   ============================================================================ */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  muted?: boolean;
  interactive?: boolean;
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      padding = "md",
      muted = false,
      interactive = false,
      className = "",
      children,
      ...props
    },
    ref,
  ) => {
    const paddings = {
      none: "p-0",
      sm: "p-4",
      md: "p-5 sm:p-6",
      lg: "p-6 sm:p-8",
    };

    return (
      <div
        ref={ref}
        className={`rounded-card border border-border ${
          muted ? "bg-muted" : "bg-surface shadow-card"
        } ${
          interactive
            ? "transition-colors duration-150 hover:border-border-strong"
            : ""
        } ${paddings[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Card.displayName = "Card";

/* ============================================================================
   8. SECTION CARD
   ============================================================================ */
export interface SectionCardProps {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  description,
  eyebrow,
  action,
  footer,
  loading = false,
  error = null,
  onRetry,
  empty = false,
  emptyTitle = "No data available",
  emptyDescription = "There are no items to display in this section yet.",
  emptyAction,
  children,
  className = "",
  bodyClassName = "",
}) => (
  <section
    className={`rounded-card border border-border bg-surface shadow-card ${className}`}
  >
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
      <div className="space-y-0.5">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            {eyebrow}
          </p>
        )}
        <h2 className="text-base font-semibold text-content-heading">
          {title}
        </h2>
        {description && (
          <p className="text-xs text-content-secondary">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>

    <div className={`p-5 sm:p-6 ${bodyClassName}`}>
      {loading ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : empty ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      ) : (
        children
      )}
    </div>

    {footer && (
      <div className="border-t border-border bg-muted/50 px-5 py-3 sm:px-6 rounded-b-card">
        {footer}
      </div>
    )}
  </section>
);

/* ============================================================================
   9. MODAL
   ============================================================================ */
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  size = "md",
  footer,
  children,
}) => {
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
    >
      <div
        className="fixed inset-0 bg-content-heading/40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-card border border-border bg-surface shadow-sm ${sizes[size]}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="space-y-1">
            <h2
              id={titleId}
              className="text-base font-semibold text-content-heading"
            >
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-xs text-content-secondary">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-sm p-1 text-content-secondary hover:bg-muted hover:text-content-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6">{children}</div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-muted/50 px-5 py-3.5 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   10. DRAWER
   ============================================================================ */
export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  side?: "right" | "left";
  widthClassName?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  title,
  description,
  side = "right",
  widthClassName = "max-w-lg",
  footer,
  children,
}) => {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="fixed inset-0 bg-content-heading/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative z-10 flex h-full w-full flex-col bg-surface border-border ${widthClassName} ${
          side === "right" ? "ml-auto border-l" : "mr-auto border-r"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="space-y-1">
            <h2
              id={titleId}
              className="text-base font-semibold text-content-heading"
            >
              {title}
            </h2>
            {description && (
              <p className="text-xs text-content-secondary">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="rounded-sm p-1 text-content-secondary hover:bg-muted hover:text-content-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-muted/50 px-5 py-3.5 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   11. TABS
   ============================================================================ */
export interface TabItem {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
  content?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeTab?: string;
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeTab,
  defaultTab,
  onChange,
  className = "",
}) => {
  const [internalTab, setInternalTab] = useState<string>(
    defaultTab || items[0]?.id || "",
  );
  const currentTab = activeTab !== undefined ? activeTab : internalTab;

  const handleSelect = (id: string) => {
    if (activeTab === undefined) setInternalTab(id);
    onChange?.(id);
  };

  const activeItem = items.find((item) => item.id === currentTab);

  return (
    <div className={`w-full ${className}`}>
      <div
        role="tablist"
        aria-orientation="horizontal"
        className="flex flex-wrap items-center gap-1 border-b border-border"
      >
        {items.map((item) => {
          const isSelected = item.id === currentTab;
          return (
            <button
              key={item.id}
              role="tab"
              type="button"
              aria-selected={isSelected}
              disabled={item.disabled}
              onClick={() => handleSelect(item.id)}
              className={`inline-flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 ${
                isSelected
                  ? "border-primary text-primary"
                  : "border-transparent text-content-secondary hover:border-border-strong hover:text-content-heading"
              }`}
            >
              <span>{item.label}</span>
              {item.count !== undefined && (
                <span
                  className={`rounded-sm px-1.5 py-0.5 text-[11px] font-medium tabular-nums ${
                    isSelected
                      ? "bg-primary-soft text-primary"
                      : "bg-muted text-content-secondary"
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {activeItem?.content !== undefined && (
        <div role="tabpanel" className="pt-4">
          {activeItem.content}
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   12. TABLE
   ============================================================================ */
export interface TableColumn<T> {
  key: string;
  header: React.ReactNode;
  render: (row: T, index: number) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  rowKey,
  loading = false,
  emptyTitle = "No records found",
  emptyDescription = "There are no rows to display right now.",
  onRowClick,
  className = "",
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-2 rounded-card border border-border bg-surface p-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <div
      className={`overflow-x-auto rounded-card border border-border bg-surface shadow-card ${className}`}
    >
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/60">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-content-secondary ${
                  alignClass[col.align || "left"]
                } ${col.className || ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row, idx) => (
            <tr
              key={rowKey(row, idx)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowClick(row);
                      }
                    }
                  : undefined
              }
              className={`transition-colors ${
                onRowClick
                  ? "cursor-pointer hover:bg-muted/60 focus-visible:bg-primary-soft/50 focus-visible:outline-none"
                  : "hover:bg-muted/30"
              }`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3.5 text-content-body ${
                    alignClass[col.align || "left"]
                  } ${col.className || ""}`}
                >
                  {col.render(row, idx)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================================
   13. TOOLTIP
   ============================================================================ */
export interface TooltipProps {
  content: React.ReactNode;
  side?: "top" | "bottom";
  children: React.ReactNode;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  side = "top",
  children,
  className = "",
}) => {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();

  return (
    <span
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <span aria-describedby={visible ? tooltipId : undefined}>{children}</span>
      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          className={`pointer-events-none absolute left-1/2 z-40 w-max max-w-xs -translate-x-1/2 rounded-sm border border-border bg-content-heading px-2.5 py-1.5 text-xs font-medium text-white shadow-sm ${
            side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
        >
          {content}
        </span>
      )}
    </span>
  );
};

/* ============================================================================
   14. TOAST
   ============================================================================ */
export interface ToastProps {
  title: string;
  description?: string;
  tone?: "neutral" | "success" | "warning" | "danger";
  onDismiss?: () => void;
  action?: React.ReactNode;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  title,
  description,
  tone = "neutral",
  onDismiss,
  action,
  className = "",
}) => {
  const styles = {
    neutral: "border-border bg-surface text-content-heading",
    success:
      "border-status-success-border bg-status-success-soft text-status-success",
    warning:
      "border-status-warning-border bg-status-warning-soft text-status-warning",
    danger:
      "border-status-danger-border bg-status-danger-soft text-status-danger",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start justify-between gap-3 rounded-card border p-4 shadow-sm ${styles[tone]} ${className}`}
    >
      <div className="flex items-start gap-2.5">
        {tone === "success" ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        ) : tone === "danger" || tone === "warning" ? (
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        ) : (
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        )}
        <div className="space-y-0.5 text-sm">
          <p className="font-semibold">{title}</p>
          {description && (
            <p className="text-xs text-content-body">{description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {action}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss notification"
            className="rounded-sm p-1 text-content-secondary hover:bg-muted hover:text-content-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   15. SKELETON
   ============================================================================ */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "h-4 w-full",
  ...props
}) => (
  <div
    aria-hidden="true"
    className={`animate-pulse rounded-sm bg-muted ${className}`}
    {...props}
  />
);

/* ============================================================================
   16. EMPTY STATE
   ============================================================================ */
export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = "",
}) => (
  <div
    className={`flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-muted/40 px-6 py-10 text-center ${className}`}
  >
    <div className="flex h-10 w-10 items-center justify-center rounded-input border border-border bg-surface text-content-secondary">
      {icon || <Inbox className="h-5 w-5" aria-hidden="true" />}
    </div>
    <h3 className="mt-3 text-sm font-semibold text-content-heading">{title}</h3>
    <p className="mt-1 max-w-md text-xs leading-relaxed text-content-secondary">
      {description}
    </p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

/* ============================================================================
   17. ERROR STATE
   ============================================================================ */
export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  onRetry,
  className = "",
}) => (
  <div
    role="alert"
    className={`flex flex-wrap items-center justify-between gap-3 rounded-card border border-status-danger-border bg-status-danger-soft px-4 py-3 text-xs sm:text-sm text-status-danger ${className}`}
  >
    <div className="flex items-start gap-2.5">
      <AlertCircle
        className="mt-0.5 h-4 w-4 shrink-0 text-status-danger"
        aria-hidden="true"
      />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <p>{message}</p>
      </div>
    </div>
    {onRetry && (
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        leftIcon={<RotateCw className="h-3.5 w-3.5" />}
      >
        Try again
      </Button>
    )}
  </div>
);

/* ============================================================================
   18. SCORE RING
   ============================================================================ */
export interface ScoreRingProps {
  score: number | null;
  size?: number;
  label?: string;
  className?: string;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  size = 76,
  label,
  className = "",
}) => {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = score === null ? 0 : Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;

  const strokeColor =
    score === null
      ? "stroke-border"
      : clamped >= 75
        ? "stroke-status-success"
        : clamped >= 50
          ? "stroke-primary"
          : "stroke-status-warning";

  return (
    <div
      className={`inline-flex flex-col items-center gap-1.5 ${className}`}
      role="img"
      aria-label={
        score === null
          ? `${label || "Score"}: Not available`
          : `${label || "Score"}: ${clamped}%`
      }
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          aria-hidden="true"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            strokeWidth={strokeWidth}
            className="stroke-muted"
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
            className={`transition-all duration-300 ${strokeColor}`}
          />
        </svg>
        <span className="absolute text-base font-bold text-content-heading tabular-nums">
          {score === null ? "N/A" : `${clamped}%`}
        </span>
      </div>
      {label && (
        <span className="text-[11px] font-medium uppercase tracking-wider text-content-secondary">
          {label}
        </span>
      )}
    </div>
  );
};

/* ============================================================================
   19. PROGRESS BAR
   ============================================================================ */
export interface ProgressBarProps {
  value: number;
  max?: number;
  tone?: "primary" | "success" | "warning" | "danger";
  label?: string;
  showValue?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  tone = "primary",
  label,
  showValue = true,
  className = "",
}) => {
  const pct =
    max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;

  const barColors = {
    primary: "bg-primary",
    success: "bg-status-success",
    warning: "bg-status-warning",
    danger: "bg-status-danger",
  };

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs font-medium text-content-secondary tabular-nums">
          {label && <span className="text-content-body">{label}</span>}
          {showValue && <span>{pct}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-2 w-full overflow-hidden rounded-sm bg-muted"
      >
        <div
          className={`h-full rounded-sm transition-all duration-300 ${barColors[tone]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

/* ============================================================================
   20. STAT CARD
   ============================================================================ */
export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  subtext?: string;
  tone?: "default" | "primary" | "success" | "warning" | "danger";
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  tone = "default",
  icon,
  loading = false,
  className = "",
}) => {
  const tones = {
    default: "text-content-heading",
    primary: "text-primary",
    success: "text-status-success",
    warning: "text-status-warning",
    danger: "text-status-danger",
  };

  return (
    <div
      className={`rounded-card border border-border bg-surface p-4 sm:p-5 shadow-card ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-content-secondary">{label}</p>
        {icon && <span className="text-content-secondary">{icon}</span>}
      </div>
      {loading ? (
        <div className="mt-2 space-y-1.5">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-3 w-28" />
        </div>
      ) : (
        <>
          <p
            className={`mt-1.5 text-2xl font-semibold tracking-tight tabular-nums ${tones[tone]}`}
          >
            {value}
          </p>
          {subtext && (
            <p className="mt-1 text-xs text-content-secondary">{subtext}</p>
          )}
        </>
      )}
    </div>
  );
};

/* ============================================================================
   21. PAGE HEADER
   ============================================================================ */
export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  description,
  actions,
  breadcrumbs,
  className = "",
}) => (
  <header
    className={`flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5 ${className}`}
  >
    <div className="space-y-1">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-1">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-content-secondary">
            {breadcrumbs.map((crumb, idx) => (
              <li key={idx} className="inline-flex items-center gap-1.5">
                {idx > 0 && <ChevronRight className="h-3 w-3" />}
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="hover:text-content-heading hover:underline"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="font-medium text-content-body">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          {eyebrow}
        </p>
      )}
      <h1 className="text-2xl font-semibold tracking-tight text-content-heading sm:text-3xl">
        {title}
      </h1>
      {description && (
        <p className="max-w-2xl text-sm text-content-secondary">
          {description}
        </p>
      )}
    </div>
    {actions && (
      <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
    )}
  </header>
);

/* ============================================================================
   22. SKILL BADGE
   ============================================================================ */
export type SkillReadinessLevel =
  "VERIFIED" | "PRACTICED" | "WEAK" | "EXTRACTED" | "MISSING";

export interface SkillBadgeProps {
  skill: string;
  level?: SkillReadinessLevel;
  meta?: string;
  onRemove?: () => void;
  className?: string;
}

export const SkillBadge: React.FC<SkillBadgeProps> = ({
  skill,
  level = "EXTRACTED",
  meta,
  onRemove,
  className = "",
}) => {
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
    <Badge tone={cfg.tone} className={className}>
      <span className="font-medium">{skill}</span>
      <span className="opacity-75">· {meta || cfg.label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${skill}`}
          className="ml-0.5 rounded-sm p-0.5 hover:bg-black/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
};

/* ============================================================================
   23. JOB CARD
   ============================================================================ */
export interface JobCardProps {
  id: string;
  title: string;
  company: string;
  location?: string | null;
  source?: string | null;
  matchScore?: number | null;
  skills?: string[];
  saved?: boolean;
  appliedStatus?: string | null;
  postedAt?: string | null;
  externalUrl?: string | null;
  onSelect?: () => void;
  onToggleSave?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export const JobCard: React.FC<JobCardProps> = ({
  title,
  company,
  location,
  source,
  matchScore,
  skills = [],
  saved = false,
  appliedStatus,
  postedAt,
  externalUrl,
  onSelect,
  onToggleSave,
  actions,
  className = "",
}) => (
  <article
    className={`rounded-card border border-border bg-surface p-5 shadow-card transition-colors hover:border-border-strong ${className}`}
  >
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-content-heading">
            {onSelect ? (
              <button
                type="button"
                onClick={onSelect}
                className="text-left hover:text-primary focus-visible:outline-none focus-visible:underline"
              >
                {title}
              </button>
            ) : (
              title
            )}
          </h3>
          {appliedStatus && <Badge tone="primary">{appliedStatus}</Badge>}
          {source && <Badge tone="neutral">{source}</Badge>}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-content-secondary">
          <span className="inline-flex items-center gap-1 font-medium text-content-body">
            <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
            {company}
          </span>
          {location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {location}
            </span>
          )}
          {postedAt && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {postedAt}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {matchScore !== undefined && matchScore !== null && (
          <Badge
            tone={
              matchScore >= 75
                ? "success"
                : matchScore >= 50
                  ? "primary"
                  : "warning"
            }
          >
            {matchScore}% match
          </Badge>
        )}
        {onToggleSave && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSave}
            aria-label={saved ? "Remove from saved jobs" : "Save job"}
            aria-pressed={saved}
          >
            <Bookmark
              className={`h-4 w-4 ${saved ? "fill-primary text-primary" : ""}`}
            />
          </Button>
        )}
      </div>
    </div>

    {skills.length > 0 && (
      <div className="mt-3.5 flex flex-wrap gap-1.5">
        {skills.slice(0, 6).map((skill) => (
          <Badge key={skill} tone="neutral" size="sm">
            {skill}
          </Badge>
        ))}
        {skills.length > 6 && (
          <Badge tone="neutral" size="sm">
            +{skills.length - 6} more
          </Badge>
        )}
      </div>
    )}

    {(actions || externalUrl) && (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3.5">
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
        {externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-content-secondary hover:text-primary"
          >
            <span>Official posting</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    )}
  </article>
);

/* ============================================================================
   24. REQUIREMENT ROW
   ============================================================================ */
export interface RequirementRowProps {
  skill: string;
  status: "MET" | "PRACTICED" | "WEAK" | "MISSING";
  priority?: "high" | "medium" | "low";
  evidence?: string;
  frequencyLabel?: string;
  action?: React.ReactNode;
  className?: string;
}

export const RequirementRow: React.FC<RequirementRowProps> = ({
  skill,
  status,
  priority,
  evidence,
  frequencyLabel,
  action,
  className = "",
}) => {
  const statusConfig: Record<
    RequirementRowProps["status"],
    { level: SkillReadinessLevel; icon: React.ReactNode }
  > = {
    MET: {
      level: "VERIFIED",
      icon: <Check className="h-4 w-4 text-status-success" />,
    },
    PRACTICED: {
      level: "PRACTICED",
      icon: <Check className="h-4 w-4 text-primary" />,
    },
    WEAK: {
      level: "WEAK",
      icon: <AlertCircle className="h-4 w-4 text-status-warning" />,
    },
    MISSING: {
      level: "MISSING",
      icon: <HelpCircle className="h-4 w-4 text-status-danger" />,
    },
  };

  const priorityTone: Record<
    NonNullable<RequirementRowProps["priority"]>,
    BadgeTone
  > = {
    high: "danger",
    medium: "warning",
    low: "neutral",
  };

  const cfg = statusConfig[status];

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface px-4 py-3 ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0" aria-hidden="true">
          {cfg.icon}
        </span>
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-content-heading">
              {skill}
            </span>
            <SkillBadge skill={skill} level={cfg.level} />
            {priority && (
              <Badge tone={priorityTone[priority]} size="sm">
                {priority} priority
              </Badge>
            )}
            {frequencyLabel && (
              <span className="text-xs text-content-secondary">
                {frequencyLabel}
              </span>
            )}
          </div>
          {evidence && (
            <p className="text-xs text-content-secondary">{evidence}</p>
          )}
        </div>
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
};

/* ============================================================================
   25. INTERVIEW QUESTION CARD
   ============================================================================ */
export interface InterviewQuestionCardProps {
  questionNumber: number;
  totalQuestions?: number;
  question: string;
  round?: string;
  skill?: string;
  difficulty?: string;
  answer?: string;
  score?: number | null;
  children?: React.ReactNode;
  className?: string;
}

export const InterviewQuestionCard: React.FC<InterviewQuestionCardProps> = ({
  questionNumber,
  totalQuestions,
  question,
  round,
  skill,
  difficulty,
  answer,
  score,
  children,
  className = "",
}) => (
  <section
    className={`rounded-card border border-border bg-surface p-5 sm:p-6 shadow-card ${className}`}
  >
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary tabular-nums">
          Question {questionNumber}
          {totalQuestions ? ` of ${totalQuestions}` : ""}
        </span>
        {round && <Badge tone="neutral">{round}</Badge>}
        {skill && <Badge tone="primary">{skill}</Badge>}
        {difficulty && <Badge tone="neutral">{difficulty}</Badge>}
      </div>
      {score !== undefined && score !== null && (
        <Badge
          tone={score >= 75 ? "success" : score >= 50 ? "primary" : "warning"}
        >
          Score: {score}/100
        </Badge>
      )}
    </div>

    <h3 className="mt-4 text-base font-semibold leading-relaxed text-content-heading sm:text-lg">
      {question}
    </h3>

    {answer && (
      <div className="mt-4 rounded-input border border-border bg-muted/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-content-secondary">
          Candidate Response
        </p>
        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-content-body">
          {answer}
        </p>
      </div>
    )}

    {children && <div className="mt-4">{children}</div>}
  </section>
);

/* ============================================================================
   26. FEEDBACK CARD
   ============================================================================ */
export interface FeedbackCardProps {
  title?: string;
  score?: number | null;
  strengths?: string[];
  improvements?: string[];
  summary?: string;
  suggestedAnswer?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({
  title = "Evaluation Feedback",
  score,
  strengths = [],
  improvements = [],
  summary,
  suggestedAnswer,
  actions,
  className = "",
}) => (
  <section
    className={`rounded-card border border-border bg-surface p-5 sm:p-6 shadow-card space-y-4 ${className}`}
  >
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
      <h3 className="text-base font-semibold text-content-heading">{title}</h3>
      {score !== undefined && score !== null && (
        <Badge
          tone={score >= 75 ? "success" : score >= 50 ? "primary" : "warning"}
        >
          {score}/100
        </Badge>
      )}
    </div>

    {summary && (
      <p className="text-sm leading-relaxed text-content-body">{summary}</p>
    )}

    {(strengths.length > 0 || improvements.length > 0) && (
      <div className="grid gap-4 sm:grid-cols-2">
        {strengths.length > 0 && (
          <div className="rounded-input border border-status-success-border bg-status-success-soft/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-status-success">
              What Was Strong
            </p>
            <ul className="mt-2 space-y-1.5 text-xs text-content-body">
              {strengths.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-success" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {improvements.length > 0 && (
          <div className="rounded-input border border-status-warning-border bg-status-warning-soft/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-status-warning">
              How to Improve
            </p>
            <ul className="mt-2 space-y-1.5 text-xs text-content-body">
              {improvements.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-warning" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )}

    {suggestedAnswer && (
      <div className="rounded-input border border-border bg-muted/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-content-secondary">
          Recommended Answer Structure
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-content-body">
          {suggestedAnswer}
        </p>
      </div>
    )}

    {actions && (
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
        {actions}
      </div>
    )}
  </section>
);

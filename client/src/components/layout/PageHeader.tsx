import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  description,
  breadcrumbs,
  primaryAction,
  secondaryActions,
  actions,
  className = "",
}) => {
  const hasActions = Boolean(primaryAction || secondaryActions || actions);

  return (
    <header
      className={`flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5 ${className}`}
    >
      <div className="space-y-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-1">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-content-secondary">
              {breadcrumbs.map((crumb, idx) => (
                <li key={idx} className="inline-flex items-center gap-1.5">
                  {idx > 0 && (
                    <ChevronRight
                      className="h-3.5 w-3.5 text-content-secondary"
                      aria-hidden="true"
                    />
                  )}
                  {crumb.href ? (
                    <Link
                      to={crumb.href}
                      className="transition-colors hover:text-content-heading hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                    >
                      {crumb.label}
                    </Link>
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
          <p className="max-w-2xl text-sm leading-relaxed text-content-secondary">
            {description}
          </p>
        )}
      </div>

      {hasActions && (
        <div className="flex flex-wrap items-center gap-2.5">
          {secondaryActions}
          {primaryAction}
          {actions}
        </div>
      )}
    </header>
  );
};

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../../features/auth/useAuth";
import { Badge, Button } from "../ui";
import { isNavItemActive, NAV_ITEMS, type NavItem } from "./navigation";

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const workspaceItems = NAV_ITEMS.filter((i) => i.group === "workspace");
  const pipelineItems = NAV_ITEMS.filter((i) => i.group === "pipeline");
  const accountItems = NAV_ITEMS.filter((i) => i.group === "account");

  const renderGroup = (title: string, items: NavItem[]) => (
    <div className="space-y-1">
      <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-content-secondary">
        {title}
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = isNavItemActive(location.pathname, item);
          const Icon = item.icon;
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                aria-current={active ? "page" : undefined}
                className={`group relative flex items-center gap-3 rounded-input px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  active
                    ? "bg-primary-soft text-primary font-semibold"
                    : "text-content-body hover:bg-muted hover:text-content-heading"
                }`}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-sm bg-primary"
                  />
                )}
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    active
                      ? "text-primary"
                      : "text-content-secondary group-hover:text-content-heading"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <aside
      aria-label="Primary Sidebar Navigation"
      className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border lg:bg-surface"
    >
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-content-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary text-xs font-bold text-white">
            TH
          </span>
          <span>TrueHire</span>
        </Link>
        <Badge tone="neutral" size="sm">
          Workspace
        </Badge>
      </div>

      {/* Navigation Groups */}
      <nav
        aria-label="Main Navigation"
        className="flex-1 space-y-6 overflow-y-auto px-3 py-5"
      >
        {renderGroup("Readiness & Prep", workspaceItems)}
        {renderGroup("Job Pipeline", pipelineItems)}
        {renderGroup("Settings", accountItems)}
      </nav>

      {/* User Footer */}
      {user && (
        <div className="border-t border-border bg-muted/40 p-4 space-y-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-content-heading">
              {user.name || user.email}
            </p>
            {user.name && (
              <p className="truncate text-[11px] text-content-secondary">
                {user.email}
              </p>
            )}
            {user.targetRole && (
              <div className="mt-2">
                <Badge tone="primary" size="sm" className="max-w-full truncate">
                  {user.targetRole}
                </Badge>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            fullWidth
            onClick={() => void logout()}
            leftIcon={<LogOut className="h-3.5 w-3.5" />}
          >
            Sign out
          </Button>
        </div>
      )}
    </aside>
  );
};

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, LogOut, Menu } from "lucide-react";
import { useAuth } from "../../features/auth/useAuth";
import { Badge, Button } from "../ui";
import { getRouteContext, isNavItemActive, NAV_ITEMS } from "./navigation";

export interface TopNavProps {
  onOpenMobileNav: () => void;
  showHorizontalLinks?: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenMobileNav,
  showHorizontalLinks = false,
}) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const routeContext = getRouteContext(location.pathname);

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-border bg-surface">
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile Menu Button + Brand (on <lg) + Route Context Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileNav}
            aria-label="Open navigation menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-input border border-border bg-surface text-content-body hover:bg-muted hover:text-content-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
          </button>

          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight text-content-heading lg:hidden"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-primary text-[11px] font-bold text-white">
              TH
            </span>
            <span className="hidden sm:inline">TrueHire</span>
          </Link>

          {/* Breadcrumb Context */}
          <nav
            aria-label="Current Page Context"
            className="flex items-center gap-1.5 text-xs sm:text-sm min-w-0"
          >
            <span className="hidden text-content-secondary sm:inline">
              {routeContext.parentPath ? (
                <Link
                  to={routeContext.parentPath}
                  className="hover:text-content-heading hover:underline"
                >
                  {routeContext.section}
                </Link>
              ) : (
                routeContext.section
              )}
            </span>
            <ChevronRight
              className="hidden h-3.5 w-3.5 shrink-0 text-content-secondary sm:inline"
              aria-hidden="true"
            />
            <span className="truncate font-semibold text-content-heading">
              {routeContext.title}
            </span>
          </nav>
        </div>

        {/* Optional Horizontal Nav (Used when TopNav renders standalone without Sidebar) */}
        {showHorizontalLinks && (
          <nav
            aria-label="Horizontal Workspace Navigation"
            className="hidden items-center gap-1 lg:flex"
          >
            {NAV_ITEMS.map((item) => {
              const active = isNavItemActive(location.pathname, item);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-input px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "bg-primary-soft text-primary font-semibold"
                      : "text-content-body hover:bg-muted hover:text-content-heading"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right: Target Role + Profile Link + Sign Out */}
        <div className="flex items-center gap-2.5 shrink-0">
          {user?.targetRole && (
            <Badge
              tone="neutral"
              size="sm"
              className="hidden md:inline-flex max-w-[200px] truncate"
            >
              Target: {user.targetRole}
            </Badge>
          )}

          {user && (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                to="/profile"
                className="rounded-input px-2.5 py-1.5 text-xs font-medium text-content-body hover:bg-muted hover:text-content-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {user.name || user.email}
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void logout()}
                leftIcon={<LogOut className="h-3.5 w-3.5" />}
              >
                Log out
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

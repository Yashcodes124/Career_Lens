import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../../features/auth/useAuth";
import { Badge, Button, Drawer } from "../ui";
import { isNavItemActive, NAV_ITEMS } from "./navigation";

export interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ open, onClose }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  // Close mobile drawer automatically when route changes
  useEffect(() => {
    if (open) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="left"
      widthClassName="max-w-xs"
      title="TrueHire"
      description={
        user?.targetRole
          ? `Target Role: ${user.targetRole}`
          : "Career Readiness Workspace"
      }
      footer={
        user ? (
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-content-heading truncate">
                {user.name || user.email}
              </span>
              <Badge tone="primary" size="sm">
                Active
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => {
                onClose();
                void logout();
              }}
              leftIcon={<LogOut className="h-3.5 w-3.5" />}
            >
              Log out
            </Button>
          </div>
        ) : undefined
      }
    >
      <nav aria-label="Mobile Navigation" className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(location.pathname, item);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-input px-3.5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                active
                  ? "bg-primary-soft text-primary font-semibold"
                  : "text-content-body hover:bg-muted hover:text-content-heading"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  active ? "text-primary" : "text-content-secondary"
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </Drawer>
  );
};

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../features/auth/useAuth";

const NAV_LINKS = [
  { label: "Overview", path: "/dashboard" },
  { label: "Jobs", path: "/jobs" },
  { label: "Saved", path: "/saved-jobs" },
  { label: "Tracker", path: "/applications" },
  { label: "Resume", path: "/resume" },
  { label: "Profile", path: "/profile" },
];

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight text-zinc-100"
          >
            <span className="h-2 w-2 rounded-full bg-teal-400" />
            <span>TrueHire</span>
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 md:flex"
          >
            {NAV_LINKS.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 ${
                    active
                      ? "bg-zinc-800/90 text-zinc-100"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          {user?.targetRole && (
            <span className="font-mono text-[11px] text-zinc-500">
              ROLE //{" "}
              <strong className="font-normal text-zinc-300">
                {user.targetRole}
              </strong>
            </span>
          )}

          {user && (
            <div className="flex items-center gap-3 border-l border-zinc-800 pl-4">
              <span className="max-w-[140px] truncate text-xs text-zinc-400">
                {user.name || user.email}
              </span>
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-md border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white active:scale-[0.98]"
              >
                Sign out
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className=" rounded-md border border-zinc-800 p-1.5 text-zinc-400 hover:text-white md:hidden"
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-zinc-800 bg-[#09090b] px-4 py-3 md:hidden">
          <div className="flex flex-col space-y-1">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  isActive(item.path)
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {user && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  void logout();
                }}
                className="mt-2 rounded-md border border-zinc-800 px-3 py-2 text-left text-sm text-zinc-400 hover:text-white"
              >
                Sign out ({user.name || user.email})
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

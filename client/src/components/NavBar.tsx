import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b border-slate-800 bg-slate-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link to="/jobs" className="text-lg font-bold text-white">
          TrueHire
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/jobs"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive("/jobs")
                ? "bg-indigo-500/10 text-indigo-300"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Jobs
          </Link>

          <Link
            to="/saved-jobs"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive("/saved-jobs")
                ? "bg-indigo-500/10 text-indigo-300"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Saved Jobs
          </Link>

          <Link
            to="/profile"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive("/profile")
                ? "bg-indigo-500/10 text-indigo-300"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Profile
          </Link>

          {user && (
            <button
              type="button"
              onClick={() => void logout()}
              className="ml-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-red-500/50 hover:text-red-300"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

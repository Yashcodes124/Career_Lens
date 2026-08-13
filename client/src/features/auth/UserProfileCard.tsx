import React, { useState } from "react";
import { useAuth } from "./useAuth";
import {
  User,
  Mail,
  Shield,
  Key,
  Briefcase,
  MapPin,
  Award,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
} from "lucide-react";

export const UserProfileCard: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [targetRole, setTargetRole] = useState(user?.targetRole || "");
  const [preferredLocations, setPreferredLocations] = useState<string[]>(
    user?.preferredLocations || [],
  );
  const [experienceLevel, setExperienceLevel] = useState(
    user?.experienceLevel || "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!user) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    const payload: {
      name?: string;
      email?: string;
      password?: string;
      targetRole?: string;
      preferredLocations?: string[];
      experienceLevel?: string;
    } = {};
    if (name !== user.name) payload.name = name;
    if (email !== user.email) payload.email = email;
    if (newPassword.trim()) payload.password = newPassword;
    if (targetRole !== user.targetRole) payload.targetRole = targetRole;
    if (
      JSON.stringify(preferredLocations) !==
      JSON.stringify(user.preferredLocations || [])
    ) {
      payload.preferredLocations = preferredLocations;
    }
    if (experienceLevel !== user.experienceLevel)
      payload.experienceLevel = experienceLevel;

    if (Object.keys(payload).length === 0) {
      setSuccessMessage("No changes to update.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile(payload);
      setSuccessMessage("Profile updated successfully!");
      setNewPassword("");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl p-8 transition-all">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 mb-6 border-b border-slate-800 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/20">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">{user.name}</h2>
            <p className="text-sm text-slate-400">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Shield className="w-3.5 h-3.5" />
            {user.role}
          </span>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/50 border border-emerald-800/60 flex items-center gap-3 text-emerald-400 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800/60 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleUpdate} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Change Password (Optional)
          </label>
          <div className="relative">
            <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              minLength={8}
              className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">
            Career Profile
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Target Role
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g., Product Manager"
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Experience Level
              </label>
              <div className="relative">
                <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none"
                >
                  <option value="">Select experience level</option>
                  <option value="Entry Level">Entry Level</option>
                  <option value="Mid-Level">Mid-Level</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead">Lead</option>
                  <option value="Manager">Manager</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Preferred Locations
            </label>
            <input
              type="text"
              placeholder="Enter locations separated by commas (e.g., New York, San Francisco, Remote)"
              value={preferredLocations.join(", ")}
              onChange={(e) =>
                setPreferredLocations(
                  e.target.value.split(",").map((l) => l.trim()),
                )
              }
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            {preferredLocations.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {preferredLocations.map((location) => (
                  <span
                    key={location}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
                  >
                    <MapPin className="w-3 h-3" />
                    {location}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <span>Update Profile</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

import React, { useState } from "react";
import { Navbar } from "../../components/NavBar";
import { useAuth } from "./useAuth";
import { CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";

const EXPERIENCE_LEVELS = [
  "Entry Level",
  "Mid-Level",
  "Senior",
  "Lead",
  "Manager",
  "Executive",
];

const QUICK_LOCATIONS = [
  "Remote",
  "Hybrid",
  "Bengaluru",
  "San Francisco",
  "New York",
  "Seattle",
];

export const UserProfileCard: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [targetRole, setTargetRole] = useState(user?.targetRole || "");
  const [preferredLocations, setPreferredLocations] = useState<string[]>(
    user?.preferredLocations || [],
  );
  const [locationInput, setLocationInput] = useState("");
  const [experienceLevel, setExperienceLevel] = useState(
    user?.experienceLevel || "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!user) return null;

  const toggleLocation = (loc: string) => {
    setPreferredLocations((prev) =>
      prev.includes(loc) ? prev.filter((item) => item !== loc) : [...prev, loc],
    );
  };

  const addCustomLocation = () => {
    const trimmed = locationInput.trim();
    if (trimmed && !preferredLocations.includes(trimmed)) {
      setPreferredLocations((prev) => [...prev, trimmed]);
      setLocationInput("");
    }
  };

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
    if (targetRole !== (user.targetRole || "")) payload.targetRole = targetRole;
    if (
      JSON.stringify(preferredLocations) !==
      JSON.stringify(user.preferredLocations || [])
    ) {
      payload.preferredLocations = preferredLocations;
    }
    if (experienceLevel !== (user.experienceLevel || "")) {
      payload.experienceLevel = experienceLevel;
    }

    if (Object.keys(payload).length === 0) {
      setSuccessMessage("No changes to update.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile(payload);
      setSuccessMessage("Profile updated.");
      setNewPassword("");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-teal-400">
              Account & Role Configuration
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Candidate Profile
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1 font-mono text-[11px] uppercase text-zinc-300">
              ROLE // {user.role}
            </span>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-red-500/40 hover:text-red-300"
            >
              Sign out
            </button>
          </div>
        </header>

        {successMessage && (
          <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3.5 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-red-500/30 bg-red-950/20 p-3.5 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form
          onSubmit={handleUpdate}
          className="space-y-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-[#09090b] px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-[#09090b] px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-zinc-400">
              Change Password (Optional)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              minLength={8}
              className="w-full rounded-lg border border-zinc-800 bg-[#09090b] px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-teal-500"
            />
          </div>

          <div className="border-t border-zinc-800/80 pt-6">
            <h2 className="mb-4 text-sm font-semibold text-white">
              Career Readiness Preferences
            </h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                  Target Role
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g., Backend Engineer, Full-Stack Developer"
                  className="w-full rounded-lg border border-zinc-800 bg-[#09090b] px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                  Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-[#09090b] px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-teal-500"
                >
                  <option value="">Select experience level</option>
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                Preferred Locations
              </label>

              <div className="mb-3 flex flex-wrap gap-1.5">
                {QUICK_LOCATIONS.map((loc) => {
                  const active = preferredLocations.includes(loc);
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => toggleLocation(loc)}
                      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                        active
                          ? "border-teal-500/50 bg-teal-500/10 text-teal-300"
                          : "border-zinc-800 bg-[#09090b] text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomLocation();
                    }
                  }}
                  placeholder="Add another location and press Enter..."
                  className="flex-1 rounded-lg border border-zinc-800 bg-[#09090b] px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={addCustomLocation}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
                >
                  Add
                </button>
              </div>

              {preferredLocations.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {preferredLocations.map((loc) => (
                    <span
                      key={loc}
                      className="inline-flex items-center gap-1.5 rounded border border-zinc-800 bg-[#09090b] px-2.5 py-1 font-mono text-xs text-zinc-200"
                    >
                      {loc}
                      <button
                        type="button"
                        onClick={() => toggleLocation(loc)}
                        className="text-zinc-500 hover:text-zinc-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end border-t border-zinc-800/80 pt-5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-5 py-2.5 text-xs font-semibold text-zinc-950 transition hover:bg-teal-400 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <span>Update Profile</span>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

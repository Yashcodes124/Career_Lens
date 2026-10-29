import React, { useState, useMemo } from "react";
import { useAuth } from "./useAuth";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  X,
} from "lucide-react";

interface ProfileSetupFormProps {
  onSuccess?: () => void;
  onSkip?: () => void;
}

const EXPERIENCE_LEVELS = [
  "Entry Level",
  "Mid-Level",
  "Senior",
  "Lead",
  "Manager",
  "Executive",
];

const COMMON_LOCATIONS = [
  "Remote",
  "Hybrid",
  "Bengaluru",
  "San Francisco",
  "New York",
  "Austin",
  "Seattle",
  "Boston",
  "London",
];

export const ProfileSetupForm: React.FC<ProfileSetupFormProps> = ({
  onSuccess,
  onSkip,
}) => {
  const { user, updateProfile } = useAuth();
  const [targetRole, setTargetRole] = useState(user?.targetRole || "");
  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    user?.preferredLocations || [],
  );
  const [experienceLevel, setExperienceLevel] = useState(
    user?.experienceLevel || "",
  );
  const [customLocation, setCustomLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isProfileComplete = useMemo(() => {
    return (
      targetRole.trim() !== "" &&
      selectedLocations.length > 0 &&
      experienceLevel.trim() !== ""
    );
  }, [targetRole, selectedLocations, experienceLevel]);

  if (!user) return null;

  const handleLocationToggle = (location: string) => {
    if (selectedLocations.includes(location)) {
      setSelectedLocations(selectedLocations.filter((l) => l !== location));
    } else {
      setSelectedLocations([...selectedLocations, location]);
    }
  };

  const handleAddCustomLocation = () => {
    if (
      customLocation.trim() &&
      !selectedLocations.includes(customLocation.trim())
    ) {
      setSelectedLocations([...selectedLocations, customLocation.trim()]);
      setCustomLocation("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!isProfileComplete) {
      setErrorMessage("Please complete all profile fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile({
        targetRole,
        preferredLocations: selectedLocations,
        experienceLevel,
      });
      setSuccessMessage("Profile setup completed!");
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 900);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl rounded-xl border border-zinc-800 bg-zinc-900/40 p-7 shadow-2xl">
      <div className="mb-6">
        <p className="font-mono text-xs uppercase tracking-wider text-teal-400">
          Profile Configuration
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
          Complete Your Profile
        </h2>
        <p className="mt-1 text-xs text-zinc-400">
          Configure your target role and location preferences for job matching.
        </p>
      </div>

      {successMessage && (
        <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-3.5 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-red-500/30 bg-red-950/30 p-3.5 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-zinc-400">
            Target Role / Job Title
          </label>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g., Full Stack Developer, Backend Engineer"
            required
            className="w-full rounded-lg border border-zinc-800 bg-[#09090b] px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-teal-500"
          />
        </div>

        <div>
          <label className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-zinc-400">
            Experience Level
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {EXPERIENCE_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setExperienceLevel(level)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                  experienceLevel === level
                    ? "border-teal-500/50 bg-teal-500/10 text-teal-300"
                    : "border-zinc-800 bg-[#09090b] text-zinc-400 hover:border-zinc-700"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-zinc-400">
            Preferred Locations
          </label>
          <div className="mb-3 grid grid-cols-3 gap-2">
            {COMMON_LOCATIONS.map((location) => (
              <button
                key={location}
                type="button"
                onClick={() => handleLocationToggle(location)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                  selectedLocations.includes(location)
                    ? "border-teal-500/50 bg-teal-500/10 text-teal-300"
                    : "border-zinc-800 bg-[#09090b] text-zinc-400 hover:border-zinc-700"
                }`}
              >
                {location}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              placeholder="Add custom location..."
              className="flex-1 rounded-lg border border-zinc-800 bg-[#09090b] px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-teal-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomLocation();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddCustomLocation}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
            >
              Add
            </button>
          </div>

          {selectedLocations.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selectedLocations.map((location) => (
                <span
                  key={location}
                  className="inline-flex items-center gap-1.5 rounded border border-zinc-800 bg-[#09090b] px-2.5 py-1 font-mono text-xs text-zinc-300"
                >
                  {location}
                  <button
                    type="button"
                    onClick={() => handleLocationToggle(location)}
                    className="text-zinc-500 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-zinc-800/80 pt-5">
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 rounded-lg border border-zinc-800 bg-[#09090b] px-4 py-2.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white"
          >
            Skip for Now
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isProfileComplete}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-500 px-4 py-2.5 text-xs font-semibold text-zinc-950 transition hover:bg-teal-400 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>Complete Setup</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

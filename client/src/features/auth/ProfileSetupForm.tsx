import React, { useState, useMemo } from "react";
import { useAuth } from "./useAuth";
import {
  Briefcase,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
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
  "New York",
  "San Francisco",
  "Austin",
  "Seattle",
  "Boston",
  "Chicago",
  "Los Angeles",
  "Denver",
  "Miami",
  "Remote",
  "Hybrid",
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
      setSuccessMessage("Profile setup completed successfully!");
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl p-8 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl transition-all">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
          <Briefcase className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
          Complete Your Profile
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Help us understand your career preferences to find better
          opportunities
        </p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/50 border border-emerald-800/60 flex items-center gap-3 text-emerald-400 text-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800/60 flex items-center gap-3 text-red-400 text-sm animate-fadeIn">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Target Role */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Target Role / Job Title
          </label>
          <div className="relative">
            <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g., Product Manager, Full Stack Engineer, UX Designer"
              required
              className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            The role or job title you're targeting in your career
          </p>
        </div>

        {/* Experience Level */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Experience Level
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {EXPERIENCE_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setExperienceLevel(level)}
                className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all border ${
                  experienceLevel === level
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                    : "bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Locations */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Preferred Locations
          </label>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
            {COMMON_LOCATIONS.map((location) => (
              <button
                key={location}
                type="button"
                onClick={() => handleLocationToggle(location)}
                className={`px-3 py-2 rounded-lg font-medium text-xs transition-all border flex items-center gap-2 ${
                  selectedLocations.includes(location)
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                    : "bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
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
              className="flex-1 px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomLocation();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddCustomLocation}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-medium transition-all border border-slate-700"
            >
              Add
            </button>
          </div>

          {selectedLocations.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedLocations.map((location) => (
                <span
                  key={location}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
                >
                  {location}
                  <button
                    type="button"
                    onClick={() => handleLocationToggle(location)}
                    className="ml-1 hover:text-indigo-300 transition-colors"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-xl transition-all border border-slate-700"
          >
            Skip for Now
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isProfileComplete}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>Complete Setup</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { MapPin, CheckCircle2, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { ResumeUploader } from "../resume/ResumeUploader";
import { useResumes } from "../resume/useResumes";

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
  "Remote",
  "Hybrid",
];

export const OnboardingWizard: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const { data: resumes } = useResumes();
  const latestResume = resumes?.[0];
  const [targetRole, setTargetRole] = useState<string>(user?.targetRole || "");
  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    user?.preferredLocations || [],
  );
  const [experienceLevel, setExperienceLevel] = useState<string>(
    user?.experienceLevel || "",
  );
  const [customLocation, setCustomLocation] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    setError(null);
    if (currentStep === 2 && !targetRole.trim()) {
      setError("Please specify your target role.");
      return;
    }
    if (currentStep === 3 && selectedLocations.length === 0) {
      setError("Please select at least one preferred location.");
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleLocationToggle = (loc: string) => {
    setSelectedLocations((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc],
    );
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

  const handleComplete = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await updateProfile({
        targetRole,
        preferredLocations: selectedLocations,
        experienceLevel,
      });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to complete profile setup");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur-xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            {["Resume", "Target Role", "Preferences", "Review"].map(
              (label, index) => {
                const stepNum = index + 1;
                return (
                  <div key={label} className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        currentStep >= stepNum
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                          : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      {stepNum}
                    </div>
                    <span
                      className={`text-xs font-medium hidden sm:inline ${
                        currentStep >= stepNum
                          ? "text-slate-200"
                          : "text-slate-500"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                );
              },
            )}
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
              style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800/60 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* STEP 1: RESUME UPLOAD */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-100">
                Step 1: Upload Resume
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Upload a PDF or DOCX to fill in your skills and experience.
                You can skip this and add details later.
              </p>
            </div>
            <ResumeUploader />
          </div>
        )}

        {/* STEP 2: TARGET ROLE */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-100">
                Step 2: Target Role & Experience
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Tell us what kind of positions you are targeting.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Target Job Title
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Backend Engineer, Product Manager"
                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
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
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                      experienceLevel === level
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PREFERENCES */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-100">
                Step 3: Preferred Locations
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Where would you prefer to work?
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {COMMON_LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => handleLocationToggle(loc)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                    selectedLocations.includes(loc)
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {loc}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="Add custom location..."
                className="flex-1 px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddCustomLocation}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & CONFIRM */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-100">
                Step 4: Review Your Profile
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Confirm your onboarding details before finishing.
              </p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase">
                  Resume File
                </span>
                <p className="text-sm font-medium text-slate-200">
                  {latestResume
                    ? `${latestResume.fileName ?? latestResume.title} · ${latestResume.skills.length} skills`
                    : "No resume uploaded (skipped)"}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase">
                  Target Role
                </span>
                <p className="text-sm font-medium text-slate-200">
                  {targetRole || "Not specified"}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase">
                  Experience Level
                </span>
                <p className="text-sm font-medium text-slate-200">
                  {experienceLevel || "Not specified"}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase">
                  Preferred Locations
                </span>
                <p className="text-sm font-medium text-slate-200">
                  {selectedLocations.length > 0
                    ? selectedLocations.join(", ")
                    : "None selected"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* NAVIGATION BUTTONS */}
        <div className="flex justify-between items-center pt-8 border-t border-slate-800 mt-8">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center gap-2 transition-all border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-medium flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Profile...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Complete Setup
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

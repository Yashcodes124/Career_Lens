import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
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
  "Remote",
  "Hybrid",
  "Bengaluru",
  "San Francisco",
  "New York",
  "Seattle",
  "Austin",
  "London",
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

  const steps = ["Resume", "Target Role", "Locations", "Review"];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] p-4 text-zinc-100">
      <div className="w-full max-w-xl rounded-xl border border-zinc-800 bg-zinc-900/40 p-7 shadow-2xl">
        {/* Stepper Header */}
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            {steps.map((label, index) => {
              const stepNum = index + 1;
              const active = currentStep >= stepNum;
              return (
                <div key={label} className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded font-mono text-xs font-semibold ${
                      active
                        ? "bg-teal-500 text-zinc-950"
                        : "border border-zinc-800 bg-[#09090b] text-zinc-500"
                    }`}
                  >
                    0{stepNum}
                  </span>
                  <span
                    className={`hidden text-xs font-medium sm:inline ${
                      active ? "text-zinc-200" : "text-zinc-500"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full bg-teal-400 transition-all duration-300"
              style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-950/30 p-3.5 text-xs text-red-300">
            {error}
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-teal-400">
                Step 01 // Baseline Data
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                Upload your resume
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                Upload a PDF or DOCX to extract your skills and experience. You
                can also skip and upload later.
              </p>
            </div>
            <ResumeUploader />
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-5">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-teal-400">
                Step 02 // Role Targeting
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                Target Role & Seniority
              </h2>
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                Target Job Title
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Full-Stack Developer, Backend Engineer"
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
                        : "border-zinc-800 bg-[#09090b] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-5">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-teal-400">
                Step 03 // Geography
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                Preferred Locations
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {COMMON_LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => handleLocationToggle(loc)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                    selectedLocations.includes(loc)
                      ? "border-teal-500/50 bg-teal-500/10 text-teal-300"
                      : "border-zinc-800 bg-[#09090b] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomLocation();
                  }
                }}
                placeholder="Add custom city or region..."
                className="flex-1 rounded-lg border border-zinc-800 bg-[#09090b] px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-teal-500"
              />
              <button
                type="button"
                onClick={handleAddCustomLocation}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-5">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-teal-400">
                Step 04 // Verification
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                Review Your Readiness Profile
              </h2>
            </div>

            <div className="divide-y divide-zinc-800/80 rounded-lg border border-zinc-800 bg-[#09090b] px-4">
              <div className="py-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  Active Resume
                </span>
                <p className="mt-0.5 text-sm font-medium text-zinc-200">
                  {latestResume
                    ? `${latestResume.fileName ?? latestResume.title} (${latestResume.skills.length} skills)`
                    : "No resume uploaded yet"}
                </p>
              </div>
              <div className="py-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  Target Role
                </span>
                <p className="mt-0.5 text-sm font-medium text-zinc-200">
                  {targetRole || "Not specified"}
                </p>
              </div>
              <div className="py-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  Seniority
                </span>
                <p className="mt-0.5 text-sm font-medium text-zinc-200">
                  {experienceLevel || "Not specified"}
                </p>
              </div>
              <div className="py-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  Locations
                </span>
                <p className="mt-0.5 text-sm font-medium text-zinc-200">
                  {selectedLocations.length > 0
                    ? selectedLocations.join(", ")
                    : "None selected"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-zinc-800/80 pt-5">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#09090b] px-4 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Skip onboarding
            </button>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500 px-5 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-teal-400 active:scale-[0.98]"
            >
              <span>Continue</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleComplete()}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500 px-5 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-teal-400 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Complete Setup</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

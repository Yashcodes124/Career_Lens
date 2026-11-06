import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { ArrowRight, ArrowLeft, Loader2, Check, X } from "lucide-react";
import { ResumeUploader } from "../resume/ResumeUploader";
import { useResumes } from "../resume/useResumes";

const EXPERIENCE_LEVELS = [
  "Student",
  "Fresher",
  "Junior",
  "Mid-level",
  "Senior",
];

const SUGGESTED_ROLES = [
  "Frontend Engineer",
  "Backend Engineer",
  "Full-Stack Developer",
  "Software Engineer",
  "DevOps / Cloud Engineer",
  "Data Engineer",
];

const COMMON_LOCATIONS = [
  "Remote",
  "Bengaluru",
  "Hyderabad",
  "Pune",
  "Mumbai",
  "Delhi NCR",
  "Chennai",
  "San Francisco",
];

const DISMISSED_SKILLS_KEY = "truehire_dismissed_resume_skills";

export const OnboardingWizard: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const { data: resumes } = useResumes();
  const latestResume = resumes?.[0];

  const [targetRole, setTargetRole] = useState<string>(user?.targetRole || "");
  const [experienceLevel, setExperienceLevel] = useState<string>(
    user?.experienceLevel || "",
  );
  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    user?.preferredLocations || [],
  );
  const [customLocation, setCustomLocation] = useState<string>("");
  const [removedSkills, setRemovedSkills] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    "Target Role",
    "Experience",
    "Locations",
    "Resume",
    "Confirmation",
  ];

  const handleNext = () => {
    setError(null);
    setCurrentStep((prev) => Math.min(prev + 1, 5));
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
    const trimmed = customLocation.trim();
    if (trimmed && !selectedLocations.includes(trimmed)) {
      setSelectedLocations([...selectedLocations, trimmed]);
      setCustomLocation("");
    }
  };

  const toggleRemoveSkill = (skill: string) => {
    const key = skill.toLowerCase();
    setRemovedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (removedSkills.size > 0) {
        try {
          localStorage.setItem(
            DISMISSED_SKILLS_KEY,
            JSON.stringify([...removedSkills]),
          );
        } catch {
          // Ignore storage errors
        }
      }

      await updateProfile({
        targetRole: targetRole.trim() || undefined,
        preferredLocations:
          selectedLocations.length > 0 ? selectedLocations : undefined,
        experienceLevel: experienceLevel || undefined,
      });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to save preferences.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const extractedSkills = latestResume?.skills ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-slate-900"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
              TH
            </span>
            <span>TrueHire</span>
          </Link>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Skip for now →
          </button>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {/* Stepper Header */}
          <div className="mb-8">
            <div className="mb-3 flex items-center justify-between gap-1">
              {steps.map((label, index) => {
                const stepNum = index + 1;
                const active = currentStep >= stepNum;
                return (
                  <div key={label} className="flex items-center gap-1.5">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
                        active
                          ? "bg-blue-600 text-white"
                          : "border border-slate-200 bg-slate-50 text-slate-400"
                      }`}
                    >
                      {stepNum}
                    </span>
                    <span
                      className={`hidden text-xs font-medium sm:inline ${
                        active ? "text-slate-900" : "text-slate-400"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          {/* Step 1: Target Role */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Step 1 of 5
                </p>
                <h1 className="mt-1 text-xl font-semibold text-slate-900">
                  What role are you preparing for?
                </h1>
                <p className="mt-1 text-xs text-slate-600">
                  We use your target role to highlight relevant job listings and
                  interview questions.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Target role
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g., Full-Stack Developer, Backend Engineer"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-slate-500">
                  Common engineering roles
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setTargetRole(role)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        targetRole === role
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Experience Level */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Step 2 of 5
                </p>
                <h1 className="mt-1 text-xl font-semibold text-slate-900">
                  Select your experience level
                </h1>
                <p className="mt-1 text-xs text-slate-600">
                  Helps calibrate mock interview difficulty and expected depth.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {EXPERIENCE_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setExperienceLevel(level)}
                    className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition ${
                      experienceLevel === level
                        ? "border-blue-600 bg-blue-50 text-blue-800"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Preferred Locations */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Step 3 of 5
                </p>
                <h1 className="mt-1 text-xl font-semibold text-slate-900">
                  Preferred job locations
                </h1>
                <p className="mt-1 text-xs text-slate-600">
                  Select one or more locations, including Remote.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {COMMON_LOCATIONS.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => handleLocationToggle(loc)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      selectedLocations.includes(loc)
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
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
                  placeholder="Add another city..."
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={handleAddCustomLocation}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Resume Upload */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Step 4 of 5
                </p>
                <h1 className="mt-1 text-xl font-semibold text-slate-900">
                  Upload your resume
                </h1>
                <p className="mt-1 text-xs text-slate-600">
                  Upload a PDF or DOCX resume so TrueHire can extract your
                  skills and compare them with target roles.
                </p>
              </div>
              <ResumeUploader />
            </div>
          )}

          {/* Step 5: Confirmation */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Step 5 of 5
                </p>
                <h1 className="mt-1 text-xl font-semibold text-slate-900">
                  Confirm your extracted skills & preferences
                </h1>
                <p className="mt-1 text-xs text-slate-600">
                  Review what we extracted from your resume. Click any skill to
                  remove it if it does not belong in your profile.
                </p>
              </div>

              <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-slate-50 px-4">
                <div className="py-3">
                  <span className="text-xs font-medium text-slate-500">
                    Target Role & Level
                  </span>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">
                    {targetRole || "Not specified"}{" "}
                    {experienceLevel ? `· ${experienceLevel}` : ""}
                  </p>
                </div>
                <div className="py-3">
                  <span className="text-xs font-medium text-slate-500">
                    Preferred Locations
                  </span>
                  <p className="mt-0.5 text-sm font-medium text-slate-800">
                    {selectedLocations.length > 0
                      ? selectedLocations.join(", ")
                      : "Any location"}
                  </p>
                </div>
              </div>

              {extractedSkills.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-medium text-slate-700">
                    Extracted Skills (
                    {extractedSkills.length - removedSkills.size} confirmed)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {extractedSkills.map((skill) => {
                      const isRemoved = removedSkills.has(skill.toLowerCase());
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleRemoveSkill(skill)}
                          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                            isRemoved
                              ? "border-slate-200 bg-slate-100 text-slate-400 line-through"
                              : "border-emerald-200 bg-emerald-50 text-emerald-800"
                          }`}
                        >
                          {isRemoved ? (
                            <X className="h-3 w-3" />
                          ) : (
                            <Check className="h-3 w-3 text-emerald-600" />
                          )}
                          <span>{skill}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  No resume uploaded yet. You can upload one anytime from the
                  Resumes page.
                </p>
              )}
            </div>
          )}

          {/* Footer Navigation */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-5">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                Skip for now
              </button>
            )}

            <div className="flex items-center gap-2.5">
              {currentStep < 5 && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 px-2 py-2"
                >
                  Skip step
                </button>
              )}

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleComplete()}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Continue to Dashboard</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

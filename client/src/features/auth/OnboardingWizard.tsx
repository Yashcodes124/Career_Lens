import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  MapPin,
  Plus,
  Upload,
} from "lucide-react";
import { useAuth } from "./useAuth";
import { uploadResume } from "../resume/resumeApi";
import { ContentContainer, PageHeader } from "../../components/layout";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  ProgressBar,
  SectionCard,
  Select,
  Skeleton,
  SkillBadge,
  Toast,
} from "../../components/ui";

export interface OnboardingWizardProps {
  onComplete?: () => void;
}

const SUGGESTED_ROLES = [
  "Backend Engineer",
  "Full-Stack Engineer",
  "Frontend Engineer",
  "Software Engineer",
  "DevOps / Cloud Engineer",
  "Data Engineer",
];

const EXPERIENCE_OPTIONS = [
  { value: "Entry-Level (0-1 years)", label: "Entry-Level (0–1 years)" },
  { value: "Junior (1-2 years)", label: "Junior (1–2 years)" },
  { value: "Mid-Level (2-5 years)", label: "Mid-Level (2–5 years)" },
  { value: "Senior (5+ years)", label: "Senior (5+ years)" },
];

const SUGGESTED_LOCATIONS = [
  "Bengaluru",
  "Hyderabad",
  "Pune",
  "Mumbai",
  "Delhi NCR",
  "Chennai",
  "Remote",
];

const DEFAULT_ROLE_SKILLS: Record<string, string[]> = {
  "Backend Engineer": [
    "Node.js",
    "TypeScript",
    "PostgreSQL",
    "REST APIs",
    "Docker",
  ],
  "Full-Stack Engineer": [
    "React",
    "TypeScript",
    "Node.js",
    "PostgreSQL",
    "Tailwind CSS",
  ],
  "Frontend Engineer": [
    "React",
    "TypeScript",
    "JavaScript",
    "HTML/CSS",
    "Testing",
  ],
  "Software Engineer": [
    "TypeScript",
    "Python",
    "SQL",
    "Git",
    "Data Structures",
  ],
  "DevOps / Cloud Engineer": ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux"],
  "Data Engineer": ["Python", "SQL", "PostgreSQL", "Data Modeling", "ETL"],
};

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  onComplete,
}) => {
  const navigate = useNavigate();
  const auth = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Role & Experience
  const [targetRole, setTargetRole] = useState<string>(
    auth.user?.targetRole || "Backend Engineer",
  );
  const [experienceLevel, setExperienceLevel] = useState<string>(
    auth.user?.experienceLevel || "Mid-Level (2-5 years)",
  );

  // Step 2: Preferred Locations
  const [locations, setLocations] = useState<string[]>(
    auth.user?.preferredLocations?.length
      ? auth.user.preferredLocations
      : ["Bengaluru", "Remote"],
  );
  const [customLocation, setCustomLocation] = useState("");

  // Step 3: Resume Upload
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<
    string | null
  >(null);

  // Step 4: Confirmed Skills
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState("");

  // Final Submission State
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const finishOnboarding = () => {
    if (onComplete) {
      onComplete();
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  const toggleLocation = (loc: string) => {
    setLocations((prev) =>
      prev.includes(loc) ? prev.filter((item) => item !== loc) : [...prev, loc],
    );
  };

  const handleAddCustomLocation = () => {
    const trimmed = customLocation.trim();
    if (!trimmed) return;
    if (!locations.includes(trimmed)) {
      setLocations((prev) => [...prev, trimmed]);
    }
    setCustomLocation("");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccessMessage(null);

    const allowedExtensions = /\.(pdf|docx)$/i;
    if (!allowedExtensions.test(file.name)) {
      setUploadError("Please select a PDF or DOCX resume file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be under 5 MB.");
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = await uploadResume(file);
      const extracted = Array.isArray(uploaded?.skills) ? uploaded.skills : [];

      setUploadedFileName(file.name);
      if (extracted.length > 0) {
        setSkills(Array.from(new Set(extracted)));
        setUploadSuccessMessage(
          `Extracted ${extracted.length} skills from ${file.name}.`,
        );
      } else {
        const fallback =
          DEFAULT_ROLE_SKILLS[targetRole] ||
          DEFAULT_ROLE_SKILLS["Backend Engineer"];
        setSkills(fallback);
        setUploadSuccessMessage(
          `Uploaded ${file.name}. Review your skills in the next step.`,
        );
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Resume upload failed. You can try again or continue and upload later.";
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;
    if (!skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkills((prev) => [...prev, trimmed]);
    }
    setNewSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleLoadRoleStarterSkills = () => {
    const starter =
      DEFAULT_ROLE_SKILLS[targetRole] ||
      DEFAULT_ROLE_SKILLS["Backend Engineer"];
    setSkills(starter);
  };

  const handleCompleteSetup = async () => {
    setSaveError(null);
    setIsSaving(true);

    try {
      if (typeof auth.updateProfile === "function") {
        await auth.updateProfile({
          targetRole: targetRole.trim() || "Software Engineer",
          experienceLevel,
          preferredLocations: locations,
        });
      }
      finishOnboarding();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not save your onboarding preferences. Please try again.";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const stepsMeta = [
    { num: 1, label: "Target role" },
    { num: 2, label: "Locations" },
    { num: 3, label: "Resume" },
    { num: 4, label: "Confirm skills" },
  ];

  return (
    <ContentContainer size="md" className="space-y-6">
      <PageHeader
        eyebrow={`Step ${step} of 4`}
        title="Set up your readiness profile"
        description="Tell TrueHire which roles you are targeting and upload your resume to see your initial skill coverage."
        secondaryActions={
          <Button variant="ghost" size="sm" onClick={finishOnboarding}>
            Skip setup for now
          </Button>
        }
      />

      {/* Step Progress Indicator */}
      <Card padding="sm" className="space-y-3">
        <ProgressBar
          value={step * 25}
          label={`Onboarding progress: ${stepsMeta[step - 1].label}`}
          tone="primary"
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stepsMeta.map((item) => {
            const isCompleted = step > item.num;
            const isCurrent = step === item.num;
            return (
              <div
                key={item.num}
                className={`flex items-center gap-2 rounded-sm border px-3 py-2 text-xs font-medium ${
                  isCurrent
                    ? "border-primary bg-primary-soft text-primary"
                    : isCompleted
                      ? "border-status-success-border bg-status-success-soft text-status-success"
                      : "border-border bg-muted/50 text-content-secondary"
                }`}
              >
                <span className="tabular-nums font-semibold">
                  {isCompleted ? "✓" : `0${item.num}`}
                </span>
                <span className="truncate">{item.label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {saveError && (
        <ErrorState
          title="Could not save setup"
          message={saveError}
          onRetry={handleCompleteSetup}
        />
      )}

      {/* STEP 1: Target Role & Seniority */}
      {step === 1 && (
        <SectionCard
          title="1. Choose your target role and experience level"
          description="We use this to prioritize matching engineering jobs and calibrate mock interview difficulty."
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="primary"
                onClick={() => setStep(2)}
                disabled={!targetRole.trim()}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Continue to locations
              </Button>
            </div>
          }
        >
          <div className="space-y-5">
            <Input
              label="Target role title"
              placeholder="e.g., Backend Engineer"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              helperText="Pick a common engineering role below or type your own."
            />

            <div className="space-y-2">
              <p className="text-xs font-medium text-content-secondary">
                Common target roles
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_ROLES.map((role) => {
                  const selected = targetRole === role;
                  return (
                    <Button
                      key={role}
                      variant={selected ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setTargetRole(role)}
                    >
                      {role}
                    </Button>
                  );
                })}
              </div>
            </div>

            <Select
              label="Experience level"
              value={experienceLevel}
              options={EXPERIENCE_OPTIONS}
              onChange={(e) => setExperienceLevel(e.target.value)}
            />
          </div>
        </SectionCard>
      )}

      {/* STEP 2: Preferred Locations */}
      {step === 2 && (
        <SectionCard
          title="2. Select your preferred work locations"
          description="Filter verified ATS postings by tech hub or remote eligibility."
          footer={
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>
              <Button
                variant="primary"
                onClick={() => setStep(3)}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Continue to resume upload
              </Button>
            </div>
          }
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-medium text-content-heading">
                Select one or more locations
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_LOCATIONS.map((loc) => {
                  const active = locations.includes(loc);
                  return (
                    <Button
                      key={loc}
                      variant={active ? "primary" : "outline"}
                      size="sm"
                      onClick={() => toggleLocation(loc)}
                      leftIcon={<MapPin className="h-3.5 w-3.5" />}
                    >
                      {loc}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <Input
                label="Add another city or region"
                placeholder="e.g., Noida, Kochi, Hybrid"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomLocation();
                  }
                }}
              />
              <Button
                variant="secondary"
                onClick={handleAddCustomLocation}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Add location
              </Button>
            </div>

            {locations.length === 0 ? (
              <EmptyState
                title="No locations selected"
                description="Select at least one location or Remote so we can surface relevant job openings."
              />
            ) : (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-content-secondary">
                  Selected locations ({locations.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {locations.map((loc) => (
                    <Badge key={loc} tone="primary">
                      <span>{loc}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* STEP 3: Resume Upload */}
      {step === 3 && (
        <SectionCard
          title="3. Upload your resume to extract baseline skills"
          description="Upload a PDF or DOCX resume (up to 5 MB) so TrueHire can compare your skills against job requirements."
          footer={
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" onClick={() => setStep(4)}>
                  Skip resume upload
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setStep(4)}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Continue to skill review
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              className="sr-only"
              aria-label="Upload resume PDF or DOCX"
            />

            {uploadError && (
              <ErrorState
                title="Resume upload issue"
                message={uploadError}
                onRetry={() => fileInputRef.current?.click()}
              />
            )}

            {uploadSuccessMessage && (
              <Toast
                tone="success"
                title="Resume processed"
                description={uploadSuccessMessage}
              />
            )}

            {isUploading ? (
              <Card muted padding="md" className="space-y-3">
                <p className="text-xs font-medium text-content-heading">
                  Extracting skills from your resume...
                </p>
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-8 w-full" />
              </Card>
            ) : (
              <Card
                muted
                padding="lg"
                className="flex flex-col items-center justify-center text-center space-y-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-input border border-border bg-surface text-primary">
                  {uploadedFileName ? (
                    <FileText className="h-5 w-5" />
                  ) : (
                    <Upload className="h-5 w-5" />
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-semibold text-content-heading">
                    {uploadedFileName
                      ? `Uploaded: ${uploadedFileName}`
                      : "Select a PDF or DOCX resume"}
                  </p>
                  <p className="text-xs text-content-secondary">
                    We extract named technical skills so you can review and edit
                    them before matching with jobs.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="md"
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<Upload className="h-4 w-4" />}
                >
                  {uploadedFileName ? "Replace resume file" : "Choose file"}
                </Button>
              </Card>
            )}
          </div>
        </SectionCard>
      )}

      {/* STEP 4: Confirm Extracted Skills */}
      {step === 4 && (
        <SectionCard
          title="4. Confirm your technical skills"
          description="Review the skills on your profile. You can remove any inaccurate items or add skills manually."
          footer={
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(3)}
                disabled={isSaving}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>
              <Button
                variant="primary"
                loading={isSaving}
                onClick={handleCompleteSetup}
                leftIcon={<Check className="h-4 w-4" />}
              >
                Save & open Dashboard
              </Button>
            </div>
          }
        >
          <div className="space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <Input
                label="Add a skill to your profile"
                placeholder="e.g., PostgreSQL, TypeScript, Redis"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
              />
              <Button
                variant="secondary"
                onClick={handleAddSkill}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Add skill
              </Button>
            </div>

            {skills.length === 0 ? (
              <EmptyState
                title="No skills added yet"
                description={`Add skills manually above or load starter skills for ${targetRole}.`}
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadRoleStarterSkills}
                  >
                    Load common {targetRole} skills
                  </Button>
                }
              />
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-medium text-content-secondary">
                  Confirmed skills ({skills.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <SkillBadge
                      key={skill}
                      skill={skill}
                      level="EXTRACTED"
                      onRemove={() => handleRemoveSkill(skill)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      )}
    </ContentContainer>
  );
};

export default OnboardingWizard;

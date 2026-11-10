import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, MapPin, Plus, X } from "lucide-react";
import { useAuth } from "./useAuth";
import { ContentContainer, PageHeader } from "../../components/layout";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Input,
  SectionCard,
  Select,
  Toast,
} from "../../components/ui";

export interface ProfileSetupFormProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

const ROLE_SUGGESTIONS = [
  "Backend Engineer",
  "Full-Stack Engineer",
  "Frontend Engineer",
  "Software Engineer",
  "DevOps / Cloud Engineer",
  "Data Engineer",
];

const EXPERIENCE_LEVELS = [
  { value: "Entry-Level (0-1 years)", label: "Entry-Level (0–1 years)" },
  { value: "Junior (1-2 years)", label: "Junior (1–2 years)" },
  { value: "Mid-Level (2-5 years)", label: "Mid-Level (2–5 years)" },
  { value: "Senior (5+ years)", label: "Senior (5+ years)" },
];

const COMMON_LOCATIONS = [
  "Bengaluru",
  "Hyderabad",
  "Pune",
  "Mumbai",
  "Delhi NCR",
  "Chennai",
  "Remote",
];

export const ProfileSetupForm: React.FC<ProfileSetupFormProps> = ({
  onComplete,
  onCancel,
}) => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState<string>(user?.name ?? "");
  const [targetRole, setTargetRole] = useState<string>(
    user?.targetRole ?? "Backend Engineer",
  );
  const [experienceLevel, setExperienceLevel] = useState<string>(
    user?.experienceLevel ?? "Mid-Level (2-5 years)",
  );
  const [preferredLocations, setPreferredLocations] = useState<string[]>(
    user?.preferredLocations?.length
      ? user.preferredLocations
      : ["Bengaluru", "Remote"],
  );
  const [customLocation, setCustomLocation] = useState("");

  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const toggleLocation = (loc: string) => {
    setPreferredLocations((prev) =>
      prev.includes(loc) ? prev.filter((item) => item !== loc) : [...prev, loc],
    );
  };

  const handleAddLocation = () => {
    const trimmed = customLocation.trim();
    if (!trimmed) return;
    if (!preferredLocations.includes(trimmed)) {
      setPreferredLocations((prev) => [...prev, trimmed]);
    }
    setCustomLocation("");
  };

  const handleRemoveLocation = (loc: string) => {
    setPreferredLocations((prev) => prev.filter((item) => item !== loc));
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate("/profile");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);
    setSubmitError(null);

    if (!targetRole.trim()) {
      setFieldError("Please enter a target engineering role.");
      return;
    }

    setIsSaving(true);
    try {
      if (typeof updateProfile === "function") {
        await updateProfile({
          name: name.trim() || undefined,
          targetRole: targetRole.trim(),
          experienceLevel,
          preferredLocations,
        });
      }
      setSavedToast(true);
      if (onComplete) {
        onComplete();
      } else {
        setTimeout(() => navigate("/profile"), 400);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not save your profile preferences. Please try again.";
      setSubmitError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ContentContainer size="md" className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Profile", href: "/profile" },
          { label: "Edit Preferences" },
        ]}
        eyebrow="Candidate Settings"
        title="Edit Profile Preferences"
        description="Configure your target engineering role, seniority level, and preferred locations for job matching and mock interviews."
        secondaryActions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to profile
          </Button>
        }
      />

      {savedToast && (
        <Toast
          tone="success"
          title="Profile preferences saved"
          description="Your job matching and interview settings have been updated."
        />
      )}

      {submitError && (
        <ErrorState title="Unable to save profile" message={submitError} />
      )}

      <form onSubmit={handleSubmit} noValidate>
        <SectionCard
          title="Role & Location Preferences"
          description="These settings personalize your recommended roles and mock interview questions."
          footer={
            <div className="flex flex-wrap items-center justify-end gap-2.5">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isSaving}
                leftIcon={<Check className="h-4 w-4" />}
              >
                Save preferences
              </Button>
            </div>
          }
        >
          <div className="space-y-5">
            <Input
              label="Full name"
              placeholder="Your name"
              value={name}
              disabled={isSaving}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="space-y-2.5">
              <Input
                label="Target engineering role"
                placeholder="e.g., Backend Engineer"
                value={targetRole}
                disabled={isSaving}
                error={fieldError ?? undefined}
                onChange={(e) => {
                  setTargetRole(e.target.value);
                  if (fieldError) setFieldError(null);
                }}
                helperText="Select a suggested role below or type a custom title."
              />

              <div className="flex flex-wrap gap-2">
                {ROLE_SUGGESTIONS.map((role) => (
                  <Button
                    key={role}
                    type="button"
                    variant={targetRole === role ? "primary" : "outline"}
                    size="sm"
                    disabled={isSaving}
                    onClick={() => {
                      setTargetRole(role);
                      if (fieldError) setFieldError(null);
                    }}
                  >
                    {role}
                  </Button>
                ))}
              </div>
            </div>

            <Select
              label="Experience level"
              value={experienceLevel}
              disabled={isSaving}
              options={EXPERIENCE_LEVELS}
              onChange={(e) => setExperienceLevel(e.target.value)}
            />

            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-xs font-medium text-content-heading">
                Preferred work locations
              </p>

              <div className="flex flex-wrap gap-2">
                {COMMON_LOCATIONS.map((loc) => {
                  const selected = preferredLocations.includes(loc);
                  return (
                    <Button
                      key={loc}
                      type="button"
                      variant={selected ? "primary" : "outline"}
                      size="sm"
                      disabled={isSaving}
                      onClick={() => toggleLocation(loc)}
                      leftIcon={<MapPin className="h-3.5 w-3.5" />}
                    >
                      {loc}
                    </Button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <Input
                  label="Add custom city or remote preference"
                  placeholder="e.g., Gurugram, Hybrid"
                  value={customLocation}
                  disabled={isSaving}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddLocation();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isSaving}
                  onClick={handleAddLocation}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Add location
                </Button>
              </div>

              {preferredLocations.length === 0 ? (
                <EmptyState
                  title="No locations selected"
                  description="Select at least one city or Remote to filter job listings."
                />
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  {preferredLocations.map((loc) => (
                    <Badge key={loc} tone="primary">
                      <span>{loc}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLocation(loc)}
                        aria-label={`Remove ${loc}`}
                        className="ml-1 rounded-sm p-0.5 hover:bg-black/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      </form>
    </ContentContainer>
  );
};

export default ProfileSetupForm;

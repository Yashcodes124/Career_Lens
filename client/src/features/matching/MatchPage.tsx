import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  FileText,
  Sparkles,
} from "lucide-react";
import { calculateJobMatch } from "./matchingApi";
import type { MatchResult as MatchResultType } from "./types";
import { MatchResult } from "./MatchResult";
import { useResumes } from "../resume/useResumes";
import { useReadiness } from "../readiness/useReadiness";
import type { ReadinessSkill } from "../readiness/readinessApi";
import { useApplications } from "../tracker/useApplications";
import { createApplication } from "../tracker/trackerApi";
import type { Job } from "../jobs/types";
import {
  fetchJobById,
  fetchSavedJobs,
  saveJob,
  unsaveJob,
} from "../jobs/jobsApi";
import { ContentContainer, PageHeader } from "../../components/layout";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  Toast,
} from "../../components/ui";

export const MatchPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryResumeId = searchParams.get("resumeId");

  const { data: resumes, isLoading: resumesLoading } = useResumes();
  const { data: readiness } = useReadiness();
  const { data: applications } = useApplications();

  const activeResume = useMemo(
    () => resumes?.find((r) => r.id === queryResumeId) ?? resumes?.[0] ?? null,
    [resumes, queryResumeId],
  );
  const activeResumeId = activeResume?.id ?? null;

  const [job, setJob] = useState<Job | null>(null);
  const [result, setResult] = useState<MatchResultType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isSaved, setIsSaved] = useState(false);
  const [isSavingJob, setIsSavingJob] = useState(false);
  const [isAddingTracker, setIsAddingTracker] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load job metadata & saved state
  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;

    const loadJobMeta = async () => {
      try {
        const [jobRes, savedList] = await Promise.all([
          fetchJobById(jobId).catch(() => null),
          fetchSavedJobs().catch(() => []),
        ]);
        if (cancelled) return;
        if (jobRes && jobRes.title) {
          setJob(jobRes);
        }
        setIsSaved(savedList.some((s) => s.id === jobId));
      } catch {
        // Non-fatal metadata fetch
      }
    };

    void loadJobMeta();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const runMatchAnalysis = async () => {
    if (!jobId) {
      setError("Job identifier is missing.");
      setLoading(false);
      return;
    }
    if (!activeResumeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await calculateJobMatch({
        resumeId: activeResumeId,
        jobId,
      });
      setResult(response.data);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to calculate requirement match for this role.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resumesLoading) return;
    void runMatchAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, activeResumeId, resumesLoading]);

  // Build cross-job gap frequency map from user's tracked applications
  const jobFrequencyMap = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const app of applications ?? []) {
      for (const gap of app.skillGaps ?? []) {
        const key = gap.toLowerCase().trim();
        if (key) counts[key] = (counts[key] ?? 0) + 1;
      }
    }
    return counts;
  }, [applications]);

  const verifiedSkills = useMemo(
    () =>
      (readiness?.skills ?? [])
        .filter((s: ReadinessSkill) => s.status === "STRONG")
        .map((s: ReadinessSkill) => s.skill),
    [readiness],
  );

  const weakSkillsMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of readiness?.skills ?? []) {
      if (s.status === "WEAK") {
        map[s.skill.toLowerCase().trim()] = s.evidence;
      }
    }
    return map;
  }, [readiness]);

  const handleToggleSaveJob = async () => {
    if (!jobId || isSavingJob) return;
    try {
      setIsSavingJob(true);
      if (isSaved) {
        await unsaveJob(jobId);
        setIsSaved(false);
        setToastMessage("Removed job from Saved Jobs.");
      } else {
        await saveJob(jobId);
        setIsSaved(true);
        setToastMessage("Saved job for comparison and interview prep.");
      }
    } catch {
      setToastMessage("Could not update saved status.");
    } finally {
      setIsSavingJob(false);
    }
  };

  const handleAddToTracker = async () => {
    if (!jobId || isAddingTracker) return;
    try {
      setIsAddingTracker(true);
      await createApplication(jobId);
      setToastMessage("Added role to your Application Tracker.");
    } catch {
      setToastMessage("Role is already tracked in your pipeline.");
    } finally {
      setIsAddingTracker(false);
    }
  };

  const handleStartTargetedInterview = (focusSkill?: string) => {
    if (!jobId) return;
    const params = new URLSearchParams();
    if (activeResumeId) params.set("resumeId", activeResumeId);
    if (focusSkill) params.set("focusSkill", focusSkill);
    const qs = params.toString();
    navigate(`/skill-gaps/${jobId}${qs ? `?${qs}` : ""}`);
  };

  const matchedApp = useMemo(
    () => (applications ?? []).find((a) => a.jobId === jobId),
    [applications, jobId],
  );

  const displayJobTitle =
    job?.title ?? matchedApp?.job.title ?? "Role Match Breakdown";
  const displayCompany =
    job?.company ?? matchedApp?.job.company ?? "Verified Employer";

  return (
    <ContentContainer size="xl" className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Explore Jobs", href: "/jobs" },
          { label: displayJobTitle },
        ]}
        eyebrow={`Match Analysis · ${displayCompany}`}
        title={displayJobTitle}
        description={
          activeResume
            ? `Compared against ${
                activeResume.fileName || activeResume.title
              } · Generated ${new Date().toLocaleDateString()}`
            : "Deterministic comparison between your verified skill profile and role requirements."
        }
        primaryAction={
          <Button
            variant="primary"
            onClick={() => handleStartTargetedInterview()}
            disabled={!activeResumeId}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Start targeted interview
          </Button>
        }
        secondaryActions={
          <>
            <Button
              variant="outline"
              size="md"
              disabled={!activeResumeId}
              onClick={() =>
                navigate(
                  `/tailor/${jobId}${
                    activeResumeId ? `?resumeId=${activeResumeId}` : ""
                  }`,
                )
              }
              leftIcon={<Sparkles className="h-4 w-4 text-primary" />}
            >
              Tailor application
            </Button>

            <Button
              variant="outline"
              size="md"
              loading={isAddingTracker}
              onClick={() => void handleAddToTracker()}
              leftIcon={<Briefcase className="h-4 w-4" />}
            >
              Add to tracker
            </Button>

            <Button
              variant="ghost"
              size="md"
              disabled={isSavingJob}
              onClick={() => void handleToggleSaveJob()}
              leftIcon={
                isSaved ? (
                  <BookmarkCheck className="h-4 w-4 text-primary" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )
              }
            >
              {isSaved ? "Saved" : "Save job"}
            </Button>
          </>
        }
      />

      {toastMessage && (
        <Toast
          tone="success"
          title="Workspace updated"
          description={toastMessage}
          onDismiss={() => setToastMessage(null)}
        />
      )}

      {/* Resume Context Strip */}
      {activeResume && (
        <Card
          muted
          padding="sm"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex flex-wrap items-center gap-2 text-xs text-content-body">
            <FileText className="h-4 w-4 text-primary" />
            <span>
              Resume used:{" "}
              <strong className="font-semibold text-content-heading">
                {activeResume.fileName || activeResume.title}
              </strong>{" "}
              ({activeResume.skills.length} extracted skills)
            </span>
            <Badge tone="neutral" size="sm">
              Match generated {new Date().toLocaleDateString()}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/resume")}>
            Switch active resume
          </Button>
        </Card>
      )}

      {/* States: Loading / Missing Resume / Error / Match Result */}
      {loading || resumesLoading ? (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-44 w-full" />
          <div className="grid gap-4 sm:grid-cols-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : !activeResumeId ? (
        <EmptyState
          title="Resume required for deterministic matching"
          description="Upload a PDF or DOCX resume so TrueHire can compare your skills against this role's requirements."
          icon={<FileText className="h-5 w-5" />}
          action={
            <Button variant="primary" onClick={() => navigate("/resume")}>
              Upload resume
            </Button>
          }
        />
      ) : error ? (
        <ErrorState
          title="Unable to compute match"
          message={error}
          onRetry={() => void runMatchAnalysis()}
        />
      ) : result ? (
        <MatchResult
          result={result}
          jobTitle={job?.title ?? matchedApp?.job.title}
          companyName={job?.company ?? matchedApp?.job.company}
          jobFrequencyMap={jobFrequencyMap}
          verifiedSkills={verifiedSkills}
          weakSkillsMap={weakSkillsMap}
          onPracticeSkill={(skill) => handleStartTargetedInterview(skill)}
          onStartTargetedInterview={() => handleStartTargetedInterview()}
        />
      ) : null}
    </ContentContainer>
  );
};

export default MatchPage;

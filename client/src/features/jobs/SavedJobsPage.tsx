import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  ExternalLink,
  Search,
  Trash2,
} from "lucide-react";
import { fetchSavedJobs, unsaveJob } from "./jobsApi";
import { JobCard } from "./JobCard";
import type { Job } from "./types";
import { createApplication } from "../tracker/trackerApi";
import { useResumes } from "../resume/useResumes";
import { ContentContainer, PageHeader } from "../../components/layout";
import {
  Badge,
  Button,
  Card,
  Drawer,
  EmptyState,
  ErrorState,
  Input,
  RequirementRow,
  ScoreRing,
  Select,
  Skeleton,
  Tabs,
  Toast,
} from "../../components/ui";

const decodeHtml = (html: string): string => {
  if (!html) return "";
  const textarea = document.createElement("textarea");
  textarea.innerHTML = html;
  return textarea.value;
};

export const SavedJobsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: resumes } = useResumes();
  const activeResume = resumes?.[0] ?? null;
  const resumeId = activeResume?.id;
  const resumeSkills = useMemo(
    () => activeResume?.skills ?? [],
    [activeResume],
  );

  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [minMatch, setMinMatch] = useState("0");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [drawerTab, setDrawerTab] = useState("overview");
  const [isTracking, setIsTracking] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadSaved = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchSavedJobs();
      setSavedJobs(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Could not load your saved jobs.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSaved();
  }, []);

  const enrichedSavedJobs = useMemo(() => {
    const normalizedResumeSet = new Set(
      resumeSkills.map((s) => s.toLowerCase().trim()),
    );

    return savedJobs.map((job) => {
      const reqs = job.requirements ?? [];
      const matched: string[] = [];
      const missing: string[] = [];

      for (const req of reqs) {
        const normReq = req.toLowerCase().trim();
        const isHit =
          normalizedResumeSet.has(normReq) ||
          resumeSkills.some((rs) => {
            const normRs = rs.toLowerCase().trim();
            return (
              normRs.length >= 3 &&
              (normReq.includes(normRs) || normRs.includes(normReq))
            );
          });
        if (isHit) matched.push(req);
        else missing.push(req);
      }

      const matchScore =
        reqs.length > 0 && resumeSkills.length > 0
          ? Math.round((matched.length / reqs.length) * 100)
          : null;

      return {
        job,
        matchScore,
        matched,
        missing,
      };
    });
  }, [savedJobs, resumeSkills]);

  const filteredSavedJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    const minScoreNum = Number(minMatch);

    return enrichedSavedJobs.filter(({ job, matchScore }) => {
      const matchesQuery =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        (job.location ?? "").toLowerCase().includes(q) ||
        (job.requirements ?? []).some((r) => r.toLowerCase().includes(q));

      const matchesMinScore =
        minScoreNum <= 0 || (matchScore !== null && matchScore >= minScoreNum);

      return matchesQuery && matchesMinScore;
    });
  }, [enrichedSavedJobs, search, minMatch]);

  const handleUnsave = async (job: Job) => {
    try {
      await unsaveJob(job.id);
      setSavedJobs((prev) => prev.filter((item) => item.id !== job.id));
      if (selectedJob?.id === job.id) {
        setSelectedJob(null);
      }
      setToastMessage(`Removed ${job.title} from Saved Jobs.`);
    } catch {
      setToastMessage("Failed to remove saved job.");
    }
  };

  const handleTrack = async (job: Job) => {
    if (isTracking) return;
    try {
      setIsTracking(true);
      await createApplication(job.id);
      setToastMessage(`Added ${job.title} to Application Tracker.`);
      navigate("/applications");
    } catch {
      setToastMessage("Could not add job to tracker.");
    } finally {
      setIsTracking(false);
    }
  };

  const selectedEnriched = useMemo(
    () =>
      selectedJob
        ? (enrichedSavedJobs.find((item) => item.job.id === selectedJob.id) ??
          null)
        : null,
    [selectedJob, enrichedSavedJobs],
  );

  return (
    <ContentContainer size="xl" className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Explore Jobs", href: "/jobs" },
          { label: "Saved Jobs" },
        ]}
        eyebrow="Bookmarked Roles"
        title={`Saved Jobs (${savedJobs.length})`}
        description="Compare requirement coverage across your bookmarked roles, inspect missing skills, and launch targeted mock interviews."
        primaryAction={
          <Button
            variant="primary"
            onClick={() => navigate("/jobs")}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Browse more jobs
          </Button>
        }
        secondaryActions={
          <Button variant="outline" onClick={() => navigate("/applications")}>
            Open pipeline tracker
          </Button>
        }
      />

      {toastMessage && (
        <Toast
          tone="success"
          title="Saved jobs updated"
          description={toastMessage}
          onDismiss={() => setToastMessage(null)}
        />
      )}

      {error && (
        <ErrorState
          title="Unable to load saved jobs"
          message={error}
          onRetry={() => void loadSaved()}
        />
      )}

      {savedJobs.length > 0 && (
        <Card padding="sm" className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Input
              placeholder="Filter saved jobs by title, company, location, or skill..."
              value={search}
              leftAddon={<Search className="h-4 w-4" />}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={minMatch}
            options={[
              { value: "0", label: "All match scores" },
              { value: "40", label: "40%+ match" },
              { value: "60", label: "60%+ match" },
              { value: "75", label: "75%+ strong match" },
            ]}
            onChange={(e) => setMinMatch(e.target.value)}
          />
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      ) : savedJobs.length === 0 ? (
        <EmptyState
          title="No saved jobs yet"
          description="Bookmark verified engineering roles on the Explore Jobs page to compare requirements and prepare for interviews."
          icon={<Bookmark className="h-5 w-5" />}
          action={
            <Button variant="primary" onClick={() => navigate("/jobs")}>
              Explore verified jobs
            </Button>
          }
        />
      ) : filteredSavedJobs.length === 0 ? (
        <EmptyState
          title="No saved jobs match your filter"
          description="Clear your search query or lower the minimum match score filter."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setMinMatch("0");
              }}
            >
              Reset filter
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredSavedJobs.map(({ job, matchScore, matched, missing }) => (
            <JobCard
              key={job.id}
              job={job}
              resumeId={resumeId}
              resumeSkills={resumeSkills}
              matchScore={matchScore}
              matchedSkills={matched}
              missingSkills={missing}
              isSaved={true}
              isSelected={selectedJob?.id === job.id}
              onSelect={(target) => {
                setSelectedJob(target);
                setDrawerTab("overview");
              }}
              onToggleSave={(target) => void handleUnsave(target)}
            />
          ))}
        </div>
      )}

      {/* Saved Job Detail Drawer */}
      <Drawer
        open={Boolean(selectedJob)}
        onClose={() => setSelectedJob(null)}
        title={selectedJob?.title ?? "Job Details"}
        description={
          selectedJob
            ? `${selectedJob.company} · ${selectedJob.location || "Verified Listing"} · ${selectedJob.source || "Greenhouse"}`
            : undefined
        }
        widthClassName="max-w-2xl"
        footer={
          selectedJob ? (
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => void handleUnsave(selectedJob)}
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                >
                  Remove saved
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={isTracking}
                  onClick={() => void handleTrack(selectedJob)}
                >
                  Add to tracker
                </Button>
                {selectedJob.url && (
                  <a
                    href={selectedJob.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1 rounded-sm border border-border bg-surface px-3 text-xs font-medium text-content-body hover:bg-muted"
                  >
                    <span>Official posting</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  navigate(
                    `/matches/${selectedJob.id}${
                      resumeId ? `?resumeId=${resumeId}` : ""
                    }`,
                  )
                }
                rightIcon={<ArrowUpRight className="h-4 w-4" />}
              >
                Full match & interview
              </Button>
            </div>
          ) : undefined
        }
      >
        {selectedJob && selectedEnriched && (
          <div className="space-y-5">
            <Card
              muted
              padding="md"
              className="flex flex-wrap items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="neutral" size="sm">
                    {selectedJob.source || "Greenhouse"}
                  </Badge>
                  {selectedJob.salaryRange && (
                    <Badge tone="primary" size="sm">
                      {selectedJob.salaryRange}
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-semibold text-content-heading">
                  {selectedJob.requirements?.length
                    ? `You meet ${selectedEnriched.matched.length} of ${selectedJob.requirements.length} requirements.`
                    : "Inspect full posting below."}
                </p>
              </div>
              <ScoreRing
                score={selectedEnriched.matchScore}
                size={68}
                label="Match"
              />
            </Card>

            <Tabs
              activeTab={drawerTab}
              onChange={setDrawerTab}
              items={[
                {
                  id: "overview",
                  label: "Requirements",
                  count: selectedJob.requirements?.length ?? 0,
                  content: (
                    <div className="space-y-2.5">
                      {selectedEnriched.matched.map((skill) => (
                        <RequirementRow
                          key={`m-${skill}`}
                          skill={skill}
                          status="MET"
                          evidence="Matched on your active resume"
                        />
                      ))}
                      {selectedEnriched.missing.map((skill) => (
                        <RequirementRow
                          key={`gap-${skill}`}
                          skill={skill}
                          status="MISSING"
                          priority="high"
                          evidence="Missing from active resume"
                        />
                      ))}
                    </div>
                  ),
                },
                {
                  id: "description",
                  label: "Full Description",
                  content: (
                    <Card padding="md">
                      <div
                        className="prose prose-slate max-w-none text-sm leading-relaxed text-content-body"
                        dangerouslySetInnerHTML={{
                          __html: decodeHtml(selectedJob.description),
                        }}
                      />
                    </Card>
                  ),
                },
              ]}
            />
          </div>
        )}
      </Drawer>
    </ContentContainer>
  );
};

export default SavedJobsPage;

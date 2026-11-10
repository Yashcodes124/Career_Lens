import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Briefcase,
  Clock,
  FileText,
  Kanban,
  MessageSquare,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useApplications } from "./useApplications";
import * as trackerApi from "./trackerApi";
import type { Application, ApplicationStatus } from "./types";
import { useResumes } from "../resume/useResumes";
import { fetchJobs } from "../jobs/jobsApi";
import type { Job } from "../jobs/types";
import { fetchUserInterviews } from "../interview/interviewApi";
import type { Interview } from "../interview/types";
import { apiClient } from "../../lib/api-client";
import { ContentContainer, PageHeader } from "../../components/layout";
import {
  Badge,
  Button,
  Card,
  Drawer,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  ScoreRing,
  Select,
  Skeleton,
  SkillBadge,
  Textarea,
  Toast,
  type BadgeTone,
} from "../../components/ui";

const PIPELINE_COLUMNS: {
  status: ApplicationStatus;
  label: string;
  tone: BadgeTone;
}[] = [
  { status: "SAVED", label: "Saved", tone: "neutral" },
  { status: "APPLIED", label: "Applied", tone: "primary" },
  { status: "INTERVIEWING", label: "Interviewing", tone: "warning" },
  { status: "OFFER", label: "Offer", tone: "success" },
  { status: "REJECTED", label: "Rejected", tone: "danger" },
];

const NOTES_STORAGE_PREFIX = "truehire_app_notes_";
const HISTORY_STORAGE_PREFIX = "truehire_app_history_";

interface StatusHistoryEntry {
  status: ApplicationStatus;
  timestamp: string;
}

const readAppNotes = (appId: string): string => {
  try {
    return localStorage.getItem(`${NOTES_STORAGE_PREFIX}${appId}`) ?? "";
  } catch {
    return "";
  }
};

const writeAppNotes = (appId: string, notes: string) => {
  try {
    localStorage.setItem(`${NOTES_STORAGE_PREFIX}${appId}`, notes);
  } catch {
    // Ignore storage errors
  }
};

const readStatusHistory = (app: Application): StatusHistoryEntry[] => {
  try {
    const raw = localStorage.getItem(`${HISTORY_STORAGE_PREFIX}${app.id}`);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as StatusHistoryEntry[];
      }
    }
  } catch {
    // Fallback
  }
  return [
    {
      status: app.status,
      timestamp: app.updatedAt || new Date().toISOString(),
    },
  ];
};

const appendStatusHistory = (appId: string, newStatus: ApplicationStatus) => {
  try {
    const raw = localStorage.getItem(`${HISTORY_STORAGE_PREFIX}${appId}`);
    const existing: StatusHistoryEntry[] = raw ? JSON.parse(raw) : [];
    const updated = [
      { status: newStatus, timestamp: new Date().toISOString() },
      ...existing,
    ].slice(0, 10);
    localStorage.setItem(
      `${HISTORY_STORAGE_PREFIX}${appId}`,
      JSON.stringify(updated),
    );
  } catch {
    // Ignore storage errors
  }
};

export const TrackerPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: applicationsData,
    isLoading,
    isError,
    refetch,
  } = useApplications();
  const { data: resumes } = useResumes();
  const activeResume = resumes?.[0] ?? null;

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Application Detail Drawer State
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [appNotes, setAppNotes] = useState<string>("");
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([]);

  // Remove Confirmation Modal State
  const [appToRemove, setAppToRemove] = useState<Application | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Add Application Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [catalogJobs, setCatalogJobs] = useState<Job[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [selectedJobIdToAdd, setSelectedJobIdToAdd] = useState<string>("");
  const [isAddingApp, setIsAddingApp] = useState(false);

  useEffect(() => {
    fetchUserInterviews()
      .then((list) => setInterviews(list))
      .catch(() => setInterviews([]));
  }, []);

  const applications = useMemo<Application[]>(
    () => (Array.isArray(applicationsData) ? applicationsData : []),
    [applicationsData],
  );

  // Count interviews per applicationId
  const interviewCountMap = useMemo(() => {
    const map = new Map<string, Interview[]>();
    for (const session of interviews) {
      const appId = (session as Record<string, any>).applicationId;
      if (appId) {
        const list = map.get(appId) ?? [];
        list.push(session);
        map.set(appId, list);
      }
    }
    return map;
  }, [interviews]);

  const filteredApplications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter(
      (app) =>
        app.job.title.toLowerCase().includes(q) ||
        app.job.company.toLowerCase().includes(q) ||
        (app.skillGaps ?? []).some((g) => g.toLowerCase().includes(q)),
    );
  }, [applications, searchQuery]);

  const groupedByColumn = useMemo(() => {
    const map: Record<ApplicationStatus, Application[]> = {
      SAVED: [],
      APPLIED: [],
      INTERVIEWING: [],
      OFFER: [],
      REJECTED: [],
    };
    for (const app of filteredApplications) {
      if (map[app.status]) {
        map[app.status].push(app);
      } else {
        map.SAVED.push(app);
      }
    }
    return map;
  }, [filteredApplications]);

  const openAppDetailDrawer = (app: Application) => {
    setSelectedApp(app);
    setAppNotes(readAppNotes(app.id));
    setStatusHistory(readStatusHistory(app));
  };

  const handleStatusChange = async (
    app: Application,
    nextStatus: ApplicationStatus,
  ) => {
    if (app.status === nextStatus) return;
    setUpdatingId(app.id);

    try {
      const anyTracker = trackerApi as Record<string, any>;
      if (typeof anyTracker.updateApplicationStatus === "function") {
        await anyTracker.updateApplicationStatus(app.id, nextStatus);
      } else if (typeof anyTracker.updateApplication === "function") {
        await anyTracker.updateApplication(app.id, { status: nextStatus });
      } else {
        await apiClient.patch(`/applications/${app.id}/status`, {
          status: nextStatus,
        });
      }

      appendStatusHistory(app.id, nextStatus);
      await queryClient.invalidateQueries({ queryKey: ["applications"] });

      if (selectedApp?.id === app.id) {
        const updatedApp = {
          ...selectedApp,
          status: nextStatus,
          updatedAt: new Date().toISOString(),
        };
        setSelectedApp(updatedApp);
        setStatusHistory(readStatusHistory(updatedApp));
      }

      setToastMessage(
        `Moved ${app.job.title} at ${app.job.company} to ${nextStatus}.`,
      );
    } catch {
      setToastMessage("Could not update application status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveApplication = async () => {
    if (!appToRemove) return;
    setIsRemoving(true);
    try {
      const anyTracker = trackerApi as Record<string, any>;
      if (typeof anyTracker.deleteApplication === "function") {
        await anyTracker.deleteApplication(appToRemove.id);
      } else if (typeof anyTracker.removeApplication === "function") {
        await anyTracker.removeApplication(appToRemove.id);
      } else {
        await apiClient.delete(`/applications/${appToRemove.id}`);
      }

      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      if (selectedApp?.id === appToRemove.id) {
        setSelectedApp(null);
      }
      setToastMessage(
        `Removed ${appToRemove.job.title} from your application pipeline.`,
      );
      setAppToRemove(null);
    } catch {
      setToastMessage(
        "Could not remove application from pipeline. Please try again.",
      );
      setAppToRemove(null);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleOpenAddModal = async () => {
    setAddModalOpen(true);
    if (catalogJobs.length === 0) {
      setLoadingCatalog(true);
      try {
        const jobs = await fetchJobs();
        setCatalogJobs(jobs);
        if (jobs.length > 0) {
          setSelectedJobIdToAdd(jobs[0].id);
        }
      } catch {
        setCatalogJobs([]);
      } finally {
        setLoadingCatalog(false);
      }
    }
  };

  const handleAddApplication = async () => {
    if (!selectedJobIdToAdd) return;
    setIsAddingApp(true);
    try {
      await trackerApi.createApplication(selectedJobIdToAdd);
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      setAddModalOpen(false);
      setToastMessage("Added opportunity to your application pipeline.");
    } catch {
      setToastMessage("This job is already in your application tracker.");
      setAddModalOpen(false);
    } finally {
      setIsAddingApp(false);
    }
  };

  return (
    <ContentContainer size="full" className="space-y-6">
      {/* 1. Header */}
      <PageHeader
        eyebrow="Opportunity Pipeline"
        title="Applications"
        description="Track every opportunity and its preparation status."
        primaryAction={
          <Button
            variant="primary"
            onClick={() => void handleOpenAddModal()}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add application
          </Button>
        }
        secondaryActions={
          <Button variant="outline" onClick={() => navigate("/jobs")}>
            Explore verified jobs
          </Button>
        }
      />

      {toastMessage && (
        <Toast
          tone="success"
          title="Pipeline updated"
          description={toastMessage}
          onDismiss={() => setToastMessage(null)}
        />
      )}

      {isError && (
        <ErrorState
          title="Unable to load applications"
          message="We could not retrieve your tracked job applications."
          onRetry={() => void refetch()}
        />
      )}

      {/* Search & Stage Summary Bar */}
      {applications.length > 0 && (
        <Card
          padding="sm"
          className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
        >
          <div className="flex flex-wrap items-center gap-2">
            {PIPELINE_COLUMNS.map((col) => (
              <Badge key={col.status} tone={col.tone} size="sm">
                {col.label}: {groupedByColumn[col.status].length}
              </Badge>
            ))}
          </div>

          <div className="w-full sm:w-72">
            <Input
              placeholder="Filter by company, role, or skill gap..."
              value={searchQuery}
              leftAddon={<Search className="h-4 w-4" />}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </Card>
      )}

      {/* 2. Pipeline View (5 Columns: Saved, Applied, Interviewing, Offer, Rejected — Horizontally Scrollable on Mobile) */}
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4" aria-busy="true">
          {PIPELINE_COLUMNS.map((col) => (
            <div
              key={col.status}
              className="w-[300px] shrink-0 space-y-3 lg:flex-1"
            >
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-44 w-full" />
              <Skeleton className="h-44 w-full" />
            </div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        /* 5. Empty State */
        <EmptyState
          title="No applications yet."
          description="Save a job to start tracking your application pipeline."
          icon={<Kanban className="h-5 w-5" />}
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="primary"
                onClick={() => void handleOpenAddModal()}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Add application
              </Button>
              <Button variant="outline" onClick={() => navigate("/jobs")}>
                Browse verified jobs
              </Button>
            </div>
          }
        />
      ) : (
        <div
          className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory"
          role="region"
          aria-label="Application pipeline columns"
        >
          {PIPELINE_COLUMNS.map((column) => {
            const colApps = groupedByColumn[column.status];

            return (
              <section
                key={column.status}
                aria-label={`${column.label} stage`}
                className="flex w-[300px] min-w-[290px] shrink-0 snap-start flex-col rounded-card border border-border bg-muted/60 p-3 sm:w-[320px] xl:flex-1"
              >
                {/* Column Header */}
                <div className="mb-3 flex items-center justify-between border-b border-border pb-2.5 px-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-content-heading">
                      {column.label}
                    </h2>
                  </div>
                  <Badge tone={column.tone} size="sm">
                    {colApps.length}
                  </Badge>
                </div>

                {/* Column Cards */}
                {colApps.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-card border border-dashed border-border bg-surface/50 px-4 py-8 text-center">
                    <p className="text-xs text-content-secondary">
                      No roles in {column.label}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {colApps.map((app) => {
                      const appInterviews = interviewCountMap.get(app.id) ?? [];
                      const interviewCount = appInterviews.length;
                      const roundedScore =
                        app.matchScore != null
                          ? Math.round(app.matchScore)
                          : null;
                      const gaps = app.skillGaps ?? [];

                      return (
                        /* 3. Application Card */
                        <Card
                          key={app.id}
                          padding="sm"
                          interactive
                          onClick={() => openAppDetailDrawer(app)}
                          className="cursor-pointer space-y-3"
                        >
                          {/* Company, Role, Status, Match Score */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 space-y-0.5">
                              <p className="truncate text-xs font-semibold text-content-secondary">
                                {app.job.company}
                              </p>
                              <h3 className="text-sm font-semibold text-content-heading hover:text-primary">
                                {app.job.title}
                              </h3>
                            </div>

                            {roundedScore !== null && (
                              <Badge
                                tone={
                                  roundedScore >= 75
                                    ? "success"
                                    : roundedScore >= 50
                                      ? "primary"
                                      : "warning"
                                }
                                size="sm"
                              >
                                {roundedScore}% match
                              </Badge>
                            )}
                          </div>

                          {/* Skill Gaps Preview */}
                          <div className="space-y-1">
                            <p className="text-[11px] font-medium text-content-secondary">
                              {gaps.length > 0
                                ? `Skill gaps (${gaps.length}):`
                                : "Skill gaps: None identified"}
                            </p>
                            {gaps.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {gaps.slice(0, 3).map((gap) => (
                                  <Badge key={gap} tone="warning" size="sm">
                                    {gap}
                                  </Badge>
                                ))}
                                {gaps.length > 3 && (
                                  <Badge tone="neutral" size="sm">
                                    +{gaps.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Interview Count & Last Updated */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-[11px] text-content-secondary tabular-nums">
                            <span className="inline-flex items-center gap-1">
                              <MessageSquare className="h-3 w-3 text-primary" />
                              {interviewCount}{" "}
                              {interviewCount === 1
                                ? "interview"
                                : "interviews"}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(app.updatedAt).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Card Actions: Update Status, View Job, Start Interview, Remove */}
                          <div
                            className="space-y-2 border-t border-border pt-2.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Select
                              aria-label={`Update status for ${app.job.title}`}
                              value={app.status}
                              disabled={updatingId === app.id}
                              options={PIPELINE_COLUMNS.map((c) => ({
                                value: c.status,
                                label: `Status: ${c.label}`,
                              }))}
                              onChange={(e) =>
                                void handleStatusChange(
                                  app,
                                  e.target.value as ApplicationStatus,
                                )
                              }
                            />

                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    navigate(
                                      `/matches/${app.jobId}${
                                        activeResume
                                          ? `?resumeId=${activeResume.id}`
                                          : ""
                                      }`,
                                    )
                                  }
                                >
                                  View job
                                </Button>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() =>
                                    navigate(
                                      `/skill-gaps/${app.jobId}${
                                        activeResume
                                          ? `?resumeId=${activeResume.id}`
                                          : ""
                                      }`,
                                    )
                                  }
                                >
                                  Start interview
                                </Button>
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label={`Remove ${app.job.title}`}
                                onClick={() => setAppToRemove(app)}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-status-danger" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* 4. Application Detail Drawer (Job details, Resume used, Match result, Interviews, Notes, Status history) */}
      <Drawer
        open={Boolean(selectedApp)}
        onClose={() => setSelectedApp(null)}
        title={selectedApp?.job.title ?? "Application Details"}
        description={
          selectedApp
            ? `${selectedApp.job.company} · ${
                selectedApp.job.location || "Verified Role"
              }`
            : undefined
        }
        widthClassName="max-w-xl"
        footer={
          selectedApp ? (
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => setAppToRemove(selectedApp)}
                leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              >
                Remove application
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate(
                      `/matches/${selectedApp.jobId}${
                        activeResume ? `?resumeId=${activeResume.id}` : ""
                      }`,
                    )
                  }
                >
                  View match result
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    navigate(
                      `/skill-gaps/${selectedApp.jobId}${
                        activeResume ? `?resumeId=${activeResume.id}` : ""
                      }`,
                    )
                  }
                  rightIcon={<ArrowUpRight className="h-4 w-4" />}
                >
                  Start interview
                </Button>
              </div>
            </div>
          ) : undefined
        }
      >
        {selectedApp && (
          <div className="space-y-5">
            {/* Match Result & Status Header */}
            <Card
              muted
              padding="md"
              className="flex items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <Badge tone="primary">{selectedApp.status}</Badge>
                <p className="text-sm font-semibold text-content-heading">
                  {selectedApp.job.title} at {selectedApp.job.company}
                </p>
                <p className="inline-flex items-center gap-1.5 text-xs text-content-secondary">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <span>
                    Resume used:{" "}
                    <strong className="font-medium text-content-heading">
                      {activeResume
                        ? activeResume.fileName || activeResume.title
                        : "Active Profile Resume"}
                    </strong>
                  </span>
                </p>
              </div>
              <ScoreRing
                score={
                  selectedApp.matchScore != null
                    ? Math.round(selectedApp.matchScore)
                    : null
                }
                size={68}
                label="Match"
              />
            </Card>

            {/* Stage Selector */}
            <Select
              label="Pipeline stage"
              value={selectedApp.status}
              options={PIPELINE_COLUMNS.map((c) => ({
                value: c.status,
                label: c.label,
              }))}
              onChange={(e) =>
                void handleStatusChange(
                  selectedApp,
                  e.target.value as ApplicationStatus,
                )
              }
            />

            {/* Skill Gaps for This Opportunity */}
            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-content-secondary">
                Identified Skill Gaps ({selectedApp.skillGaps?.length ?? 0})
              </p>
              {(selectedApp.skillGaps?.length ?? 0) === 0 ? (
                <p className="text-xs text-content-secondary">
                  No missing skills recorded for this application.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {selectedApp.skillGaps.map((skill) => (
                    <SkillBadge key={skill} skill={skill} level="MISSING" />
                  ))}
                </div>
              )}
            </div>

            {/* Linked Interviews */}
            <div className="space-y-2 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-content-secondary">
                  Mock Interviews (
                  {(interviewCountMap.get(selectedApp.id) ?? []).length})
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    navigate(
                      `/skill-gaps/${selectedApp.jobId}${
                        activeResume ? `?resumeId=${activeResume.id}` : ""
                      }`,
                    )
                  }
                >
                  New interview
                </Button>
              </div>

              {(interviewCountMap.get(selectedApp.id) ?? []).length === 0 ? (
                <p className="text-xs text-content-secondary">
                  No mock interviews completed for this application yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {(interviewCountMap.get(selectedApp.id) ?? []).map(
                    (session) => (
                      <li key={session.id}>
                        <Card
                          padding="sm"
                          className="flex items-center justify-between gap-2"
                        >
                          <div className="space-y-0.5">
                            <p className="text-xs font-semibold text-content-heading">
                              {session.title}
                            </p>
                            <p className="text-[11px] text-content-secondary tabular-nums">
                              {session.status} ·{" "}
                              {new Date(session.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(
                                session.status === "COMPLETED"
                                  ? `/interviews/${session.id}/evaluation`
                                  : session.status === "IN_PROGRESS"
                                    ? `/interviews/${session.id}/live`
                                    : `/interviews/${session.id}/prep`,
                              )
                            }
                          >
                            {session.status === "COMPLETED"
                              ? "Evaluation"
                              : "Resume"}
                          </Button>
                        </Card>
                      </li>
                    ),
                  )}
                </ul>
              )}
            </div>

            {/* Candidate Notes */}
            <div className="space-y-2 border-t border-border pt-4">
              <Textarea
                label="Preparation & recruiter notes"
                rows={4}
                placeholder="Record referral contacts, recruiter screen dates, or key topics to review..."
                value={appNotes}
                onChange={(e) => {
                  setAppNotes(e.target.value);
                  writeAppNotes(selectedApp.id, e.target.value);
                }}
                helperText="Notes are saved automatically to your workspace."
              />
            </div>

            {/* Status History */}
            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-content-secondary">
                Status History
              </p>
              <ul className="space-y-1.5 text-xs">
                {statusHistory.map((item, idx) => (
                  <li
                    key={`${item.status}-${idx}`}
                    className="flex items-center justify-between rounded-sm bg-muted/60 px-3 py-2"
                  >
                    <span className="font-medium text-content-heading">
                      Moved to {item.status}
                    </span>
                    <span className="text-content-secondary tabular-nums">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Drawer>

      {/* Add Application Modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add application to pipeline"
        description="Select a verified engineering role to track in your pipeline."
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setAddModalOpen(false)}
              disabled={isAddingApp}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={isAddingApp}
              disabled={!selectedJobIdToAdd}
              onClick={() => void handleAddApplication()}
            >
              Add to Saved
            </Button>
          </>
        }
      >
        {loadingCatalog ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : catalogJobs.length === 0 ? (
          <EmptyState
            title="No jobs found"
            description="Browse the Explore Jobs directory to find roles."
            icon={<Briefcase className="h-5 w-5" />}
          />
        ) : (
          <Select
            label="Select verified job posting"
            value={selectedJobIdToAdd}
            onChange={(e) => setSelectedJobIdToAdd(e.target.value)}
            options={catalogJobs.map((j) => ({
              value: j.id,
              label: `${j.title} — ${j.company} (${j.location || "Remote"})`,
            }))}
          />
        )}
      </Modal>

      {/* Remove Application Confirmation Modal */}
      <Modal
        open={Boolean(appToRemove)}
        onClose={() => setAppToRemove(null)}
        title="Remove application?"
        description="This will remove the application card from your pipeline tracker."
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setAppToRemove(null)}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={isRemoving}
              onClick={() => void handleRemoveApplication()}
            >
              Remove
            </Button>
          </>
        }
      >
        <p className="text-sm text-content-body">
          Are you sure you want to remove{" "}
          <strong className="font-semibold text-content-heading">
            {appToRemove?.job.title} at {appToRemove?.job.company}
          </strong>{" "}
          from your tracker?
        </p>
      </Modal>
    </ContentContainer>
  );
};

export default TrackerPage;

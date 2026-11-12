import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Briefcase,
  Clock,
  FileText,
  Kanban,
  LayoutGrid,
  Columns,
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
  SectionCard,
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
  const [stageFilter, setStageFilter] = useState<"ALL" | ApplicationStatus>(
    "ALL",
  );
  const [layoutMode, setLayoutMode] = useState<"GRID" | "BOARD">("GRID");
  const [showEmptyStages, setShowEmptyStages] = useState<boolean>(false);

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
    return applications.filter((app) => {
      const matchesStage = stageFilter === "ALL" || app.status === stageFilter;
      const matchesQuery =
        !q ||
        app.job.title.toLowerCase().includes(q) ||
        app.job.company.toLowerCase().includes(q) ||
        (app.skillGaps ?? []).some((g) => g.toLowerCase().includes(q));
      return matchesStage && matchesQuery;
    });
  }, [applications, searchQuery, stageFilter]);

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

  // Only show stages that actually have applications unless user toggled showEmptyStages or picked a specific stage
  const visibleColumns = useMemo(() => {
    if (stageFilter !== "ALL") {
      return PIPELINE_COLUMNS.filter((c) => c.status === stageFilter);
    }
    if (showEmptyStages) {
      return PIPELINE_COLUMNS;
    }
    const populated = PIPELINE_COLUMNS.filter(
      (c) => groupedByColumn[c.status].length > 0,
    );
    return populated.length > 0 ? populated : PIPELINE_COLUMNS.slice(0, 1);
  }, [stageFilter, showEmptyStages, groupedByColumn]);

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
      await trackerApi.updateApplicationStatus(app.id, nextStatus);
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
      await trackerApi.deleteApplication(appToRemove.id);
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

  const renderAppCard = (app: Application) => {
    const appInterviews = interviewCountMap.get(app.id) ?? [];
    const interviewCount = appInterviews.length;
    const roundedScore =
      app.matchScore != null ? Math.round(app.matchScore) : null;
    const gaps = app.skillGaps ?? [];
    const stageMeta =
      PIPELINE_COLUMNS.find((c) => c.status === app.status) ??
      PIPELINE_COLUMNS[0];

    return (
      <Card
        key={app.id}
        padding="md"
        interactive
        onClick={() => openAppDetailDrawer(app)}
        className="flex flex-col justify-between gap-4 cursor-pointer"
      >
        <div className="space-y-3">
          {/* Header: Company, Role, Stage & Match Score */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="truncate text-xs font-semibold text-content-secondary">
                  {app.job.company}
                </span>
                <Badge tone={stageMeta.tone} size="sm">
                  {stageMeta.label}
                </Badge>
              </div>
              <h3 className="text-base font-semibold text-content-heading hover:text-primary">
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
              >
                {roundedScore}% match
              </Badge>
            )}
          </div>

          {/* Skill Gaps */}
          <div className="space-y-1.5 border-t border-border pt-2.5">
            <p className="text-xs font-medium text-content-secondary">
              {gaps.length > 0
                ? `Priority skill gaps (${gaps.length}):`
                : "All extracted requirements met"}
            </p>
            {gaps.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {gaps.slice(0, 4).map((gap) => (
                  <Badge key={gap} tone="warning" size="sm">
                    {gap}
                  </Badge>
                ))}
                {gaps.length > 4 && (
                  <Badge tone="neutral" size="sm">
                    +{gaps.length - 4} more
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Telemetry */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-content-secondary tabular-nums">
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              {interviewCount}{" "}
              {interviewCount === 1 ? "interview" : "interviews"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Updated {new Date(app.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Footer Controls */}
        <div
          className="space-y-2.5 border-t border-border pt-3"
          onClick={(e) => e.stopPropagation()}
        >
          <Select
            aria-label={`Update status for ${app.job.title}`}
            value={app.status}
            disabled={updatingId === app.id}
            options={PIPELINE_COLUMNS.map((c) => ({
              value: c.status,
              label: `Move to: ${c.label}`,
            }))}
            onChange={(e) =>
              void handleStatusChange(app, e.target.value as ApplicationStatus)
            }
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(
                    `/matches/${app.jobId}${
                      activeResume ? `?resumeId=${activeResume.id}` : ""
                    }`,
                  )
                }
              >
                View match
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  navigate(
                    `/skill-gaps/${app.jobId}${
                      activeResume ? `?resumeId=${activeResume.id}` : ""
                    }`,
                  )
                }
              >
                Practice interview
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
  };

  return (
    <ContentContainer size="xl" className="space-y-6">
      <PageHeader
        eyebrow="Opportunity Pipeline"
        title={`Applications (${applications.length})`}
        description="Track every opportunity, its requirement match coverage, and mock interview status."
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

      {/* Stage Filter Pills, Search & Layout Switcher */}
      {applications.length > 0 && (
        <Card padding="sm" className="space-y-3">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            {/* Stage Filter Buttons (Only active counts highlighted; click to filter) */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant={stageFilter === "ALL" ? "primary" : "outline"}
                size="sm"
                onClick={() => setStageFilter("ALL")}
              >
                All Active ({applications.length})
              </Button>
              {PIPELINE_COLUMNS.map((col) => {
                const count = applications.filter(
                  (a) => a.status === col.status,
                ).length;
                if (
                  count === 0 &&
                  !showEmptyStages &&
                  stageFilter !== col.status
                ) {
                  return null;
                }
                return (
                  <Button
                    key={col.status}
                    variant={stageFilter === col.status ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setStageFilter(col.status)}
                  >
                    {col.label} ({count})
                  </Button>
                );
              })}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEmptyStages((prev) => !prev)}
              >
                {showEmptyStages ? "Hide empty stages" : "Show all stages"}
              </Button>
            </div>

            {/* Search & Layout Toggle */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-full sm:w-64">
                <Input
                  placeholder="Search company, role, or skill..."
                  value={searchQuery}
                  leftAddon={<Search className="h-4 w-4" />}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="inline-flex rounded-input border border-border bg-muted p-0.5">
                <button
                  type="button"
                  onClick={() => setLayoutMode("GRID")}
                  className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    layoutMode === "GRID"
                      ? "bg-surface text-content-heading shadow-xs"
                      : "text-content-secondary hover:text-content-heading"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode("BOARD")}
                  className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    layoutMode === "BOARD"
                      ? "bg-surface text-content-heading shadow-xs"
                      : "text-content-secondary hover:text-content-heading"
                  }`}
                >
                  <Columns className="h-3.5 w-3.5" />
                  <span>Columns</span>
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          aria-busy="true"
        >
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-52 w-full" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          title="No applications yet."
          description="Save or match a job to start tracking your application pipeline."
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
      ) : filteredApplications.length === 0 ? (
        <EmptyState
          title="No applications match this filter"
          description="Clear your search query or switch stage filters above."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setStageFilter("ALL");
              }}
            >
              Reset filter
            </Button>
          }
        />
      ) : layoutMode === "GRID" ? (
        /* Horizontal Multi-Column Grid Grouped by Populated Stage */
        <div className="space-y-6">
          {visibleColumns.map((column) => {
            const colApps = groupedByColumn[column.status];
            return (
              <SectionCard
                key={column.status}
                eyebrow="Pipeline Stage"
                title={`${column.label} (${colApps.length})`}
                action={
                  <Badge tone={column.tone} size="sm">
                    {colApps.length} {colApps.length === 1 ? "role" : "roles"}
                  </Badge>
                }
                empty={colApps.length === 0}
                emptyTitle={`No roles in ${column.label}`}
                emptyDescription="Move an application card to this stage using its status dropdown."
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {colApps.map(renderAppCard)}
                </div>
              </SectionCard>
            );
          })}
        </div>
      ) : (
        /* Horizontally Scrollable Board View (Only Populated Columns unless Show All is active) */
        <div
          className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory"
          role="region"
          aria-label="Application pipeline columns"
        >
          {visibleColumns.map((column) => {
            const colApps = groupedByColumn[column.status];
            return (
              <section
                key={column.status}
                aria-label={`${column.label} stage`}
                className="flex w-[320px] min-w-[300px] flex-1 shrink-0 snap-start flex-col rounded-card border border-border bg-muted/60 p-3.5"
              >
                <div className="mb-3 flex items-center justify-between border-b border-border pb-2.5 px-1">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-content-heading">
                    {column.label}
                  </h2>
                  <Badge tone={column.tone} size="sm">
                    {colApps.length}
                  </Badge>
                </div>

                {colApps.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-card border border-dashed border-border bg-surface/50 px-4 py-8 text-center">
                    <p className="text-xs text-content-secondary">
                      No roles in {column.label}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">{colApps.map(renderAppCard)}</div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Application Detail Drawer */}
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
                              : "Open"}
                          </Button>
                        </Card>
                      </li>
                    ),
                  )}
                </ul>
              )}
            </div>

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

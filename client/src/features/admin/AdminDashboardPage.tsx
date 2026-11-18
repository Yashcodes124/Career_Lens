import React, { useEffect, useState } from "react";
import {
  Activity,
  Cpu,
  Database,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { apiClient } from "../../lib/api-client";
import { ContentContainer, PageHeader } from "../../components/layout";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  SectionCard,
  Select,
  Skeleton,
  Tabs,
  Toast,
} from "../../components/ui";

type AdminTab = "system" | "sync" | "ai" | "resume" | "matching" | "closedLoop";

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("system");
  const [rangeDays, setRangeDays] = useState<string>("7");

  const [overview, setOverview] = useState<any>(null);
  const [jobSyncs, setJobSyncs] = useState<any>(null);
  const [aiReliability, setAiReliability] = useState<any>(null);
  const [resumeQuality, setResumeQuality] = useState<any>(null);
  const [matchingQuality, setMatchingQuality] = useState<any>(null);
  const [closedLoop, setClosedLoop] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [syncConfirmOpen, setSyncConfirmOpen] = useState(false);
  const [isSyncRunning, setIsSyncRunning] = useState(false);
  const [aliasInputByToken, setAliasInputByToken] = useState<
    Record<string, string>
  >({});

  const buildQueryString = () => {
    if (rangeDays === "ALL") return "";
    const fromDate = new Date(
      Date.now() - Number(rangeDays) * 24 * 60 * 60 * 1000,
    ).toISOString();
    return `?from=${encodeURIComponent(fromDate)}`;
  };

  const loadAllAdminMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const qs = buildQueryString();

      const [ov, sync, ai, resQ, matchQ, loop] = await Promise.all([
        apiClient.get<{ data: any }>("/admin/overview"),
        apiClient.get<{ data: any }>(`/admin/job-syncs${qs}`),
        apiClient.get<{ data: any }>(`/admin/ai-reliability${qs}`),
        apiClient.get<{ data: any }>(`/admin/resume-quality${qs}`),
        apiClient.get<{ data: any }>(`/admin/matching-quality${qs}`),
        apiClient.get<{ data: any }>(`/admin/closed-loop${qs}`),
      ]);

      setOverview(ov.data);
      setJobSyncs(sync.data);
      setAiReliability(ai.data);
      setResumeQuality(resQ.data);
      setMatchingQuality(matchQ.data);
      setClosedLoop(loop.data);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load Admin Operations Control Plane.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAllAdminMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeDays]);

  const handleRunManualSync = async () => {
    try {
      setIsSyncRunning(true);
      await apiClient.post("/admin/job-syncs/run");
      setSyncConfirmOpen(false);
      setToastMsg("Manual multi-ATS job sync completed.");
      await loadAllAdminMetrics();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to run manual job sync.",
      );
    } finally {
      setIsSyncRunning(false);
    }
  };

  const handleResolveQueueItem = async (
    token: string,
    action: "APPROVE_CANONICAL" | "MAP_ALIAS" | "DISMISS",
  ) => {
    try {
      const targetCanonical = aliasInputByToken[token]?.trim();
      await apiClient.post("/admin/ontology/review-queue/resolve", {
        token,
        action,
        targetCanonical,
      });
      setToastMsg(`Updated ontology review item "${token}".`);
      await loadAllAdminMetrics();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Could not resolve review item.",
      );
    }
  };

  return (
    <ContentContainer size="xl" className="space-y-6">
      <PageHeader
        eyebrow="Operations & Quality Control Plane"
        title="Admin Operations Console"
        description="Aggregate system health, ATS ingestion telemetry, AI reliability, parsing diagnostics, ontology quality, and closed-loop effectiveness."
        primaryAction={
          <Button
            variant="outline"
            onClick={() => void loadAllAdminMetrics()}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh telemetry
          </Button>
        }
        secondaryActions={
          <Select
            label=""
            value={rangeDays}
            onChange={(e) => setRangeDays(e.target.value)}
            options={[
              { value: "1", label: "Last 24 hours" },
              { value: "7", label: "Last 7 days" },
              { value: "30", label: "Last 30 days" },
              { value: "ALL", label: "All time" },
            ]}
          />
        }
      />

      {toastMsg && (
        <Toast
          tone="success"
          title="Admin action completed"
          description={toastMsg}
          onDismiss={() => setToastMsg(null)}
        />
      )}

      {error && (
        <ErrorState
          title="Operations Control Plane Error"
          message={error}
          onRetry={() => void loadAllAdminMetrics()}
        />
      )}

      <Tabs
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as AdminTab)}
        items={[
          { id: "system", label: "1. System Health" },
          { id: "sync", label: "2. Job Sync" },
          { id: "ai", label: "3. AI Reliability" },
          { id: "resume", label: "4. Resume Quality" },
          { id: "matching", label: "5. Matching Quality" },
          { id: "closedLoop", label: "6. Closed-Loop Effectiveness" },
        ]}
      />

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          {/* TAB 1: SYSTEM HEALTH */}
          {activeTab === "system" && overview && (
            <SectionCard
              eyebrow="Runtime & Infrastructure"
              title="System Health Overview"
              description="Live API uptime, database latency, AI provider readiness, Sentry monitoring, and active deployment build."
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <Card muted padding="sm" className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-content-secondary">
                    <span>API Uptime</span>
                    <Activity className="h-4 w-4 text-status-success" />
                  </div>
                  <p className="text-xl font-semibold text-content-heading tabular-nums">
                    {Math.floor(overview.apiUptimeSeconds / 60)}m{" "}
                    {overview.apiUptimeSeconds % 60}s
                  </p>
                  <Badge tone="success" size="sm">
                    {overview.environment}
                  </Badge>
                </Card>

                <Card muted padding="sm" className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-content-secondary">
                    <span>Database Health</span>
                    <Database className="h-4 w-4 text-status-success" />
                  </div>
                  <p className="text-xl font-semibold text-status-success tabular-nums">
                    {overview.database.status}
                  </p>
                  <p className="text-xs text-content-secondary">
                    Ping: {overview.database.latencyMs}ms
                  </p>
                </Card>

                <Card muted padding="sm" className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-content-secondary">
                    <span>AI Provider</span>
                    <Cpu className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xl font-semibold text-content-heading uppercase">
                    {overview.aiProvider.primaryProvider}
                  </p>
                  <Badge
                    tone={
                      overview.aiProvider.configured ? "success" : "warning"
                    }
                    size="sm"
                  >
                    {overview.aiProvider.configured
                      ? "Configured"
                      : "Missing Key"}
                  </Badge>
                </Card>

                <Card muted padding="sm" className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-content-secondary">
                    <span>Sentry / Error Rate</span>
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xl font-semibold text-content-heading tabular-nums">
                    {overview.sentry.errorRatePct}%
                  </p>
                  <p className="text-xs text-content-secondary">
                    {overview.sentry.configured
                      ? "Sentry DSN Active"
                      : "Local Telemetry"}
                  </p>
                </Card>

                <Card muted padding="sm" className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-content-secondary">
                    <span>Deployment Version</span>
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xl font-semibold text-content-heading font-mono">
                    {overview.deploymentVersion}
                  </p>
                  <p className="text-xs text-content-secondary">
                    {overview.platformTotals.activeJobs} active jobs ·{" "}
                    {overview.platformTotals.canonicalSkills} skills
                  </p>
                </Card>
              </div>
            </SectionCard>
          )}

          {/* TAB 2: JOB SYNC */}
          {activeTab === "sync" && jobSyncs && (
            <SectionCard
              eyebrow="ATS Ingestion Telemetry"
              title="Multi-ATS Job Sync Health"
              description="Per-ATS sync freshness, fetched/created/updated/deactivated counts, duplicate rate, and stale listings."
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setSyncConfirmOpen(true)}
                  leftIcon={<Play className="h-3.5 w-3.5" />}
                >
                  Run manual ATS sync
                </Button>
              }
            >
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-4">
                  <Card muted padding="sm">
                    <p className="text-xs text-content-secondary">
                      Total Sync Runs
                    </p>
                    <p className="text-2xl font-semibold text-content-heading tabular-nums">
                      {jobSyncs.summary.totalSyncRuns}
                    </p>
                  </Card>
                  <Card muted padding="sm">
                    <p className="text-xs text-content-secondary">
                      Failed Syncs
                    </p>
                    <p className="text-2xl font-semibold text-status-danger tabular-nums">
                      {jobSyncs.summary.failedSyncs}
                    </p>
                  </Card>
                  <Card muted padding="sm">
                    <p className="text-xs text-content-secondary">
                      Duplicate Rate
                    </p>
                    <p className="text-2xl font-semibold text-primary tabular-nums">
                      {jobSyncs.summary.duplicateRatePct}%
                    </p>
                  </Card>
                  <Card muted padding="sm">
                    <p className="text-xs text-content-secondary">
                      Stale Jobs (&gt;14d)
                    </p>
                    <p className="text-2xl font-semibold text-status-warning tabular-nums">
                      {jobSyncs.summary.staleJobsCount}
                    </p>
                  </Card>
                </div>

                {/* Per-ATS Active Inventory */}
                <div className="grid gap-3 sm:grid-cols-3">
                  {(jobSyncs.bySource ?? []).map((src: any) => (
                    <Card key={src.source} padding="sm" className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge tone="primary" size="sm">
                          {src.source}
                        </Badge>
                        <span className="text-sm font-semibold tabular-nums">
                          {src.activeJobsCount} active
                        </span>
                      </div>
                      <p className="text-xs text-content-secondary">
                        Last synced:{" "}
                        {src.lastSyncedAt
                          ? new Date(src.lastSyncedAt).toLocaleString()
                          : "Never"}
                      </p>
                    </Card>
                  ))}
                </div>

                {/* Recent Sync Audit Log */}
                {jobSyncs.logs.length === 0 ? (
                  <EmptyState
                    title="No sync audit logs recorded in this window"
                    description="Trigger a manual ATS sync above to populate durable JobSyncAudit records."
                  />
                ) : (
                  <ul className="divide-y divide-border text-xs">
                    {jobSyncs.logs.map((log: any) => (
                      <li
                        key={log.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            tone={
                              log.status === "SUCCESS"
                                ? "success"
                                : log.status === "PARTIAL"
                                  ? "warning"
                                  : "danger"
                            }
                            size="sm"
                          >
                            {log.status}
                          </Badge>
                          <span className="font-semibold text-content-heading">
                            {log.source}
                            {log.boardToken ? ` (${log.boardToken})` : ""}
                          </span>
                          <span className="text-content-secondary tabular-nums">
                            Fetched {log.jobsFetched} · Created{" "}
                            {log.jobsCreated} · Updated {log.jobsUpdated} ·
                            Deactivated {log.jobsDeactivated} · Dupes{" "}
                            {log.duplicatesFound}
                          </span>
                        </div>
                        <span className="text-content-secondary tabular-nums">
                          {log.durationMs}ms ·{" "}
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </SectionCard>
          )}

          {/* TAB 3: AI RELIABILITY */}
          {activeTab === "ai" && aiReliability && (
            <SectionCard
              eyebrow="LLM Gateway & Cost Observability"
              title="AI Provider Reliability, Latency & Spend"
              description="Aggregated token usage, estimated USD cost, P50/P95 latency, failover frequency, and sanitized error codes."
            >
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <Card muted padding="sm">
                    <p className="text-xs text-content-secondary">
                      Total Requests
                    </p>
                    <p className="text-2xl font-semibold text-content-heading tabular-nums">
                      {aiReliability.summary.totalRequests}
                    </p>
                    <p className="text-[11px] text-status-success">
                      {aiReliability.summary.successCount} ok ·{" "}
                      {aiReliability.summary.fallbackCount} fallback
                    </p>
                  </Card>

                  <Card muted padding="sm">
                    <p className="text-xs text-content-secondary">
                      Failures / Timeouts / 429
                    </p>
                    <p className="text-2xl font-semibold text-status-danger tabular-nums">
                      {aiReliability.summary.failureCount}
                    </p>
                    <p className="text-[11px] text-content-secondary">
                      {aiReliability.summary.timeoutCount} timeouts ·{" "}
                      {aiReliability.summary.rateLimitCount} rate-limited
                    </p>
                  </Card>

                  <Card muted padding="sm">
                    <p className="text-xs text-content-secondary">
                      P50 / P95 Latency
                    </p>
                    <p className="text-2xl font-semibold text-primary tabular-nums">
                      {aiReliability.summary.p50LatencyMs}ms
                    </p>
                    <p className="text-[11px] text-content-secondary">
                      P95: {aiReliability.summary.p95LatencyMs}ms
                    </p>
                  </Card>

                  <Card muted padding="sm">
                    <p className="text-xs text-content-secondary">
                      Total Tokens
                    </p>
                    <p className="text-2xl font-semibold text-content-heading tabular-nums">
                      {(
                        aiReliability.summary.totalInputTokens +
                        aiReliability.summary.totalOutputTokens
                      ).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-content-secondary">
                      In: {aiReliability.summary.totalInputTokens} · Out:{" "}
                      {aiReliability.summary.totalOutputTokens}
                    </p>
                  </Card>

                  <Card muted padding="sm">
                    <p className="text-xs text-content-secondary">
                      Estimated Cost
                    </p>
                    <p className="text-2xl font-semibold text-status-success tabular-nums">
                      ${aiReliability.summary.totalCostUsd.toFixed(4)}
                    </p>
                    <p className="text-[11px] text-content-secondary">
                      Aggregate spend
                    </p>
                  </Card>
                </div>

                {/* By Feature Breakdown */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {(aiReliability.byFeature ?? []).map((f: any) => (
                    <Card
                      key={f.feature}
                      padding="sm"
                      className="space-y-1 text-xs"
                    >
                      <p className="font-semibold text-content-heading">
                        {f.feature}
                      </p>
                      <p className="text-content-secondary tabular-nums">
                        {f.requests} calls · {f.failures} failed · $
                        {f.totalCostUsd.toFixed(4)}
                      </p>
                    </Card>
                  ))}
                </div>

                {/* Sanitized Recent Failures */}
                {aiReliability.recentFailures?.length > 0 && (
                  <div className="space-y-2 border-t border-border pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-status-danger">
                      Recent Sanitized AI Failures
                    </p>
                    <ul className="divide-y divide-border text-xs">
                      {aiReliability.recentFailures.map((err: any) => (
                        <li
                          key={err.id}
                          className="flex items-center justify-between py-2"
                        >
                          <span>
                            <Badge tone="danger" size="sm">
                              {err.errorCode || "AI_UNAVAILABLE"}
                            </Badge>{" "}
                            {err.feature} ({err.provider}/{err.model})
                          </span>
                          <span className="text-content-secondary">
                            {err.latencyMs}ms ·{" "}
                            {new Date(err.createdAt).toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* TAB 4: RESUME QUALITY */}
          {activeTab === "resume" && resumeQuality && (
            <SectionCard
              eyebrow="Document Extraction Diagnostics"
              title="Resume Parsing Quality & Recovery Telemetry"
              description="Aggregate parse success/failure rates, scanned PDF detection, layout warnings, and re-analysis usage."
            >
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card muted padding="sm">
                    <p className="text-xs text-content-secondary">
                      Parse Success Rate
                    </p>
                    <p className="text-2xl font-semibold text-status-success tabular-nums">
                      {resumeQuality.summary.parseSuccessRatePct}%
                    </p>
                    <p className="text-xs text-content-secondary">
                      {resumeQuality.summary.totalParses} total parse audits
                    </p>
                  </Card>

                  <Card muted padding="sm">
                    <p className="text-xs text-content-secondary">
                      Low-Quality / Scanned PDF Rate
                    </p>
                    <p className="text-2xl font-semibold text-status-warning tabular-nums">
                      {resumeQuality.summary.lowQualityRatePct}% /{" "}
                      {resumeQuality.summary.scannedPdfRatePct}%
                    </p>
                    <p className="text-xs text-content-secondary">
                      Failure rate: {resumeQuality.summary.parseFailureRatePct}%
                    </p>
                  </Card>

                  <Card muted padding="sm">
                    <p className="text-xs text-content-secondary">
                      Re-Analysis Usage
                    </p>
                    <p className="text-2xl font-semibold text-primary tabular-nums">
                      {resumeQuality.summary.reanalysisUsageCount}
                    </p>
                    <p className="text-xs text-content-secondary">
                      In-place recovery runs
                    </p>
                  </Card>

                  <Card muted padding="sm">
                    <p className="text-xs text-content-secondary">
                      Avg Extracted Skills
                    </p>
                    <p className="text-2xl font-semibold text-content-heading tabular-nums">
                      {resumeQuality.summary.avgExtractedSkillsCount}
                    </p>
                    <p className="text-xs text-content-secondary">
                      Canonical skills per resume
                    </p>
                  </Card>
                </div>

                {resumeQuality.commonWarnings?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-content-secondary">
                      Most Common Parsing Warnings
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {resumeQuality.commonWarnings.map((w: any) => (
                        <Badge key={w.code} tone="warning" size="sm">
                          {w.code} ({w.count})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* TAB 5: MATCHING & ONTOLOGY QUALITY */}
          {activeTab === "matching" && matchingQuality && (
            <SectionCard
              eyebrow="Ontology & Extraction Quality"
              title="Matching & Skill Ontology Quality"
              description="INSUFFICIENT_DATA rate, unrecognized skill review queue, false-positive guardrails, and JD extraction F1."
            >
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card muted padding="sm">
                    <p className="text-xs text-content-secondary">
                      INSUFFICIENT_DATA Rate
                    </p>
                    <p className="text-2xl font-semibold text-status-warning tabular-nums">
                      {matchingQuality.summary.insufficientDataRatePct}%
                    </p>
                    <p className="text-xs text-content-secondary">
                      {matchingQuality.summary.insufficientDataJobsCount} jobs
                      with 0 skills
                    </p>
                  </Card>

                  <Card muted padding="sm">
                    <p className="text-xs text-content-secondary">
                      Alias Review Queue
                    </p>
                    <p className="text-2xl font-semibold text-primary tabular-nums">
                      {matchingQuality.summary.pendingReviewQueueSize}
                    </p>
                    <p className="text-xs text-content-secondary">
                      Pending unrecognized tokens
                    </p>
                  </Card>

                  <Card muted padding="sm">
                    <p className="text-xs text-content-secondary">
                      False-Positive Guardrails
                    </p>
                    <p className="text-2xl font-semibold text-status-success tabular-nums">
                      {matchingQuality.summary.falsePositivePassRatePct}%
                    </p>
                    <p className="text-xs text-content-secondary">
                      Boundary suite pass rate
                    </p>
                  </Card>

                  <Card muted padding="sm">
                    <p className="text-xs text-content-secondary">
                      JD Extraction F1
                    </p>
                    <p className="text-2xl font-semibold text-status-success tabular-nums">
                      {matchingQuality.summary.extractionF1Pct}%
                    </p>
                    <p className="text-xs text-content-secondary">
                      {matchingQuality.summary.canonicalSkillsCount} skills /{" "}
                      {matchingQuality.summary.totalAliasesCount} aliases
                    </p>
                  </Card>
                </div>

                {/* Top Missing Skills Across Pipeline */}
                {matchingQuality.topMissingSkills?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-content-secondary">
                      Most Common Missing Skills Across Applications
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {matchingQuality.topMissingSkills.map((g: any) => (
                        <Badge key={g.skill} tone="neutral" size="sm">
                          {g.skill} ({g.count})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Unrecognized Skill Queue */}
                {matchingQuality.reviewQueue?.filter(
                  (q: any) => q.status === "PENDING",
                ).length > 0 && (
                  <div className="space-y-2 border-t border-border pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-content-heading">
                      Pending Unrecognized Skill Tokens
                    </p>
                    <ul className="divide-y divide-border">
                      {matchingQuality.reviewQueue
                        .filter((q: any) => q.status === "PENDING")
                        .map((item: any) => (
                          <li
                            key={item.token}
                            className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-xs"
                          >
                            <div>
                              <span className="font-semibold text-content-heading">
                                {item.token}
                              </span>{" "}
                              <Badge tone="primary" size="sm">
                                {item.occurrences}x
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Input
                                placeholder="Canonical alias target"
                                value={aliasInputByToken[item.token] ?? ""}
                                onChange={(e) =>
                                  setAliasInputByToken((prev) => ({
                                    ...prev,
                                    [item.token]: e.target.value,
                                  }))
                                }
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={
                                  !aliasInputByToken[item.token]?.trim()
                                }
                                onClick={() =>
                                  void handleResolveQueueItem(
                                    item.token,
                                    "MAP_ALIAS",
                                  )
                                }
                              >
                                Map alias
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() =>
                                  void handleResolveQueueItem(
                                    item.token,
                                    "APPROVE_CANONICAL",
                                  )
                                }
                              >
                                Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  void handleResolveQueueItem(
                                    item.token,
                                    "DISMISS",
                                  )
                                }
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* TAB 6: CLOSED-LOOP EFFECTIVENESS */}
          {activeTab === "closedLoop" && closedLoop && (
            <SectionCard
              eyebrow="Product Outcome Telemetry"
              title="Closed-Loop Readiness Effectiveness"
              description="Aggregate completion rates, skill verification write-backs, proof submissions, and repeat interview retention."
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card muted padding="sm" className="space-y-1">
                  <p className="text-xs text-content-secondary">
                    Interview Completion Rate
                  </p>
                  <p className="text-2xl font-semibold text-status-success tabular-nums">
                    {closedLoop.summary.interviewCompletionRatePct}%
                  </p>
                  <p className="text-xs text-content-secondary">
                    {closedLoop.summary.completedInterviews} of{" "}
                    {closedLoop.summary.totalInterviews} interviews completed
                  </p>
                </Card>

                <Card muted padding="sm" className="space-y-1">
                  <p className="text-xs text-content-secondary">
                    Evaluation Generation Rate
                  </p>
                  <p className="text-2xl font-semibold text-primary tabular-nums">
                    {closedLoop.summary.evaluationGenerationRatePct}%
                  </p>
                  <p className="text-xs text-content-secondary">
                    Completed sessions with rubric reports
                  </p>
                </Card>

                <Card muted padding="sm" className="space-y-1">
                  <p className="text-xs text-content-secondary">
                    Skills Updated / Interview
                  </p>
                  <p className="text-2xl font-semibold text-content-heading tabular-nums">
                    {closedLoop.summary.skillsUpdatedPerInterview}
                  </p>
                  <p className="text-xs text-content-secondary">
                    {closedLoop.summary.verifiedStrongSkillsTotal} verified ·{" "}
                    {closedLoop.summary.invalidatedWeakSkillsTotal} flagged weak
                  </p>
                </Card>

                <Card muted padding="sm" className="space-y-1">
                  <p className="text-xs text-content-secondary">
                    Proof Artifacts Submitted
                  </p>
                  <p className="text-2xl font-semibold text-status-success tabular-nums">
                    {closedLoop.summary.proofSubmissionsCount}
                  </p>
                  <p className="text-xs text-content-secondary">
                    Avg verified match score:{" "}
                    {closedLoop.summary.averageVerifiedMatchScorePct}%
                  </p>
                </Card>

                <Card muted padding="sm" className="space-y-1">
                  <p className="text-xs text-content-secondary">
                    Repeat Interview Rate
                  </p>
                  <p className="text-2xl font-semibold text-primary tabular-nums">
                    {closedLoop.summary.repeatInterviewRatePct}%
                  </p>
                  <p className="text-xs text-content-secondary">
                    Candidates completing 2+ sessions
                  </p>
                </Card>

                <Card muted padding="sm" className="space-y-1">
                  <p className="text-xs text-content-secondary">
                    Retention Proxy (Returning Users)
                  </p>
                  <p className="text-2xl font-semibold text-content-heading tabular-nums">
                    {closedLoop.summary.returningUsersWithCompletedInterviews}
                  </p>
                  <p className="text-xs text-content-secondary">
                    Returning users with completed interviews
                  </p>
                </Card>
              </div>
            </SectionCard>
          )}
        </>
      )}

      {/* Manual Sync Confirmation Modal */}
      <Modal
        open={syncConfirmOpen}
        onClose={() => setSyncConfirmOpen(false)}
        title="Confirm manual multi-ATS job sync"
        description="This will fetch active software engineering roles from configured Greenhouse, Lever, and Ashby boards and write a JobSyncAudit entry."
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setSyncConfirmOpen(false)}
              disabled={isSyncRunning}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={isSyncRunning}
              onClick={() => void handleRunManualSync()}
            >
              Confirm & run sync
            </Button>
          </>
        }
      >
        <p className="text-xs text-content-body">
          Deduplication and stale-posting checks will execute automatically
          across all active ATS sources.
        </p>
      </Modal>
    </ContentContainer>
  );
};

export default AdminDashboardPage;

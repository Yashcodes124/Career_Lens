import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Database,
  GitBranch,
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
  ProgressBar,
  SectionCard,
  Select,
  Skeleton,
  Tabs,
  Toast,
} from "../../components/ui";

interface FamilyStat {
  family: string;
  label: string;
  canonicalCount: number;
  aliasCount: number;
  withPrerequisitesCount: number;
}

interface UnrecognizedSkillRecord {
  token: string;
  occurrences: number;
  sources: string[];
  sampleContexts: string[];
  firstSeenAt: string;
  lastSeenAt: string;
  status: "PENDING" | "APPROVED_CANONICAL" | "MAPPED_ALIAS" | "DISMISSED";
  resolvedTo?: string;
}

interface InsufficientDataJob {
  id: string;
  title: string;
  company: string;
  source: string;
  storedRequirementsCount: number;
  reextractedSkillsCount: number;
  reason: string;
}

interface FalsePositiveCase {
  id: string;
  text: string;
  forbiddenSkill: string;
  expectedSkill: string | null;
  passed: boolean;
  detectedSkills: string[];
}

interface OntologyDashboardData {
  summary: {
    totalCanonicalSkills: number;
    totalAliases: number;
    avgAliasesPerSkill: number;
    familiesCount: number;
    liveJobCoveragePct: number;
    totalJobsAudited: number;
    insufficientDataCount: number;
    pendingReviewCount: number;
  };
  familyStats: FamilyStat[];
  reviewQueue: UnrecognizedSkillRecord[];
  insufficientDataJobs: InsufficientDataJob[];
  falsePositiveAudit: {
    totalCases: number;
    passedCases: number;
    passRatePct: number;
    cases: FalsePositiveCase[];
  };
  extractionBenchmark: {
    precisionPct: number;
    recallPct: number;
    f1Pct: number;
    samples: Array<{
      title: string;
      expectedCount: number;
      extractedCount: number;
      matchedCount: number;
      recallPct: number;
      precisionPct: number;
    }>;
  };
  skillsCatalog: Array<{
    canonical: string;
    aliases: string[];
    family: string;
    tier: string;
    prerequisites: string[];
  }>;
}

export const OntologyDashboardPage: React.FC = () => {
  const [data, setData] = useState<OntologyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("quality");
  const [selectedFamily, setSelectedFamily] = useState<string>("ALL");
  const [catalogSearch, setCatalogSearch] = useState<string>("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [aliasTargetByToken, setAliasTargetByToken] = useState<
    Record<string, string>
  >({});

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<{
        success: boolean;
        data: OntologyDashboardData;
      }>("/ontology/dashboard");
      setData(res.data);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load skill ontology quality metrics.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const handleResolveToken = async (
    token: string,
    action: "APPROVE_CANONICAL" | "MAP_ALIAS" | "DISMISS",
    family = "backend",
  ) => {
    try {
      const targetCanonical = aliasTargetByToken[token]?.trim();
      await apiClient.post("/ontology/review-queue/resolve", {
        token,
        action,
        targetCanonical,
        family,
      });
      setToastMsg(
        action === "APPROVE_CANONICAL"
          ? `Approved "${token}" as a canonical skill in the ontology.`
          : action === "MAP_ALIAS"
            ? `Mapped "${token}" as an alias for "${targetCanonical}".`
            : `Dismissed "${token}" from the review queue.`,
      );
      await loadDashboard();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to resolve review item.",
      );
    }
  };

  const filteredCatalog = useMemo(() => {
    if (!data?.skillsCatalog) return [];
    const q = catalogSearch.trim().toLowerCase();
    return data.skillsCatalog.filter((item) => {
      const matchesFamily =
        selectedFamily === "ALL" || item.family === selectedFamily;
      const matchesQuery =
        !q ||
        item.canonical.includes(q) ||
        item.aliases.some((a) => a.includes(q)) ||
        item.prerequisites.some((p) => p.includes(q));
      return matchesFamily && matchesQuery;
    });
  }, [data, selectedFamily, catalogSearch]);

  return (
    <ContentContainer size="xl" className="space-y-6">
      <PageHeader
        eyebrow="Ontology & Extraction Quality"
        title="Skill Ontology & Dictionary Quality Dashboard"
        description="Inspect 340+ canonical engineering skills across 9 domains, resolve unrecognized skill tokens, audit INSUFFICIENT_DATA postings, and verify false-positive boundary accuracy."
        primaryAction={
          <Button
            variant="outline"
            onClick={() => void loadDashboard()}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh telemetry
          </Button>
        }
      />

      {toastMsg && (
        <Toast
          tone="success"
          title="Ontology updated"
          description={toastMsg}
          onDismiss={() => setToastMsg(null)}
        />
      )}

      {error && (
        <ErrorState
          title="Could not load ontology dashboard"
          message={error}
          onRetry={() => void loadDashboard()}
        />
      )}

      {loading || !data ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : (
        <>
          {/* Top KPI Strip */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card padding="sm" className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-content-secondary">
                  Canonical Skills & Aliases
                </span>
                <Database className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-semibold text-content-heading tabular-nums">
                {data.summary.totalCanonicalSkills}{" "}
                <span className="text-sm font-normal text-content-secondary">
                  ({data.summary.totalAliases} aliases)
                </span>
              </p>
              <p className="text-xs text-content-secondary">
                {data.summary.avgAliasesPerSkill} aliases/skill across{" "}
                {data.summary.familiesCount} families
              </p>
            </Card>

            <Card padding="sm" className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-content-secondary">
                  JD Extraction Accuracy (F1)
                </span>
                <Sparkles className="h-4 w-4 text-status-success" />
              </div>
              <p className="text-2xl font-semibold text-status-success tabular-nums">
                {data.extractionBenchmark.f1Pct}%
              </p>
              <p className="text-xs text-content-secondary">
                Precision {data.extractionBenchmark.precisionPct}% · Recall{" "}
                {data.extractionBenchmark.recallPct}%
              </p>
            </Card>

            <Card padding="sm" className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-content-secondary">
                  False-Positive Guardrails
                </span>
                <ShieldCheck className="h-4 w-4 text-status-success" />
              </div>
              <p className="text-2xl font-semibold text-content-heading tabular-nums">
                {data.falsePositiveAudit.passedCases}/
                {data.falsePositiveAudit.totalCases} Passed
              </p>
              <p className="text-xs text-content-secondary">
                {data.falsePositiveAudit.passRatePct}% whole-word boundary
                accuracy
              </p>
            </Card>

            <Card padding="sm" className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-content-secondary">
                  INSUFFICIENT_DATA Jobs
                </span>
                <AlertTriangle className="h-4 w-4 text-status-warning" />
              </div>
              <p className="text-2xl font-semibold text-status-warning tabular-nums">
                {data.summary.insufficientDataCount}
              </p>
              <p className="text-xs text-content-secondary">
                {data.summary.liveJobCoveragePct}% of{" "}
                {data.summary.totalJobsAudited} active jobs have skills
              </p>
            </Card>
          </section>

          <Tabs
            activeTab={activeTab}
            onChange={setActiveTab}
            items={[
              {
                id: "quality",
                label: "Dictionary Quality & Benchmarks",
              },
              {
                id: "review",
                label: `Unrecognized Skill Review Queue (${data.summary.pendingReviewCount})`,
                count: data.summary.pendingReviewCount,
              },
              {
                id: "insufficient",
                label: `INSUFFICIENT_DATA Audit (${data.summary.insufficientDataCount})`,
                count: data.summary.insufficientDataCount,
              },
              {
                id: "explorer",
                label: `9-Family Ontology & Prerequisites (${data.summary.totalCanonicalSkills})`,
              },
            ]}
          />

          {/* TAB 1: Dictionary Quality, Alias Coverage, Extraction Accuracy & False Positives */}
          {activeTab === "quality" && (
            <div className="space-y-6">
              <SectionCard
                eyebrow="Domain Coverage"
                title="Alias Coverage & Prerequisite Graph by Skill Family"
                description="Distribution of canonical skills, acronym aliases, and prerequisite dependencies across all 9 engineering domains."
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.familyStats.map((fam) => (
                    <Card
                      key={fam.family}
                      muted
                      padding="sm"
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-content-heading">
                          {fam.label}
                        </span>
                        <Badge tone="primary" size="sm">
                          {fam.canonicalCount} skills
                        </Badge>
                      </div>
                      <p className="text-xs text-content-secondary tabular-nums">
                        {fam.aliasCount} aliases · {fam.withPrerequisitesCount}{" "}
                        with prerequisites
                      </p>
                      <ProgressBar
                        label="Alias richness"
                        value={Math.min(
                          100,
                          Math.round(
                            (fam.aliasCount / Math.max(1, fam.canonicalCount)) *
                              45,
                          ),
                        )}
                        tone="primary"
                      />
                    </Card>
                  ))}
                </div>
              </SectionCard>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Extraction Accuracy Benchmark */}
                <SectionCard
                  eyebrow="Extraction Precision & Recall"
                  title="Job Description Extraction Accuracy"
                  description="Evaluated against multi-domain software engineering job descriptions."
                >
                  <div className="space-y-3">
                    {data.extractionBenchmark.samples.map((s) => (
                      <Card
                        key={s.title}
                        muted
                        padding="sm"
                        className="space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-content-heading">
                            {s.title}
                          </span>
                          <Badge tone="success" size="sm">
                            {s.matchedCount}/{s.expectedCount} matched
                          </Badge>
                        </div>
                        <ProgressBar
                          label={`Recall ${s.recallPct}% · Precision ${s.precisionPct}%`}
                          value={s.recallPct}
                          tone="success"
                        />
                      </Card>
                    ))}
                  </div>
                </SectionCard>

                {/* False-Positive Boundary Examples */}
                <SectionCard
                  eyebrow="Boundary Integrity"
                  title="False-Positive Prevention Examples"
                  description="Whole-word boundary assertions verifying substrings never trigger false matches."
                >
                  <ul className="space-y-2.5">
                    {data.falsePositiveAudit.cases.map((tc) => (
                      <li
                        key={tc.id}
                        className="rounded-input border border-border bg-muted/40 p-3 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-content-heading">
                            Blocks "{tc.forbiddenSkill}"{" "}
                            {tc.expectedSkill
                              ? `→ Detects "${tc.expectedSkill}"`
                              : ""}
                          </span>
                          <Badge
                            tone={tc.passed ? "success" : "danger"}
                            size="sm"
                          >
                            {tc.passed ? "Passed" : "Failed"}
                          </Badge>
                        </div>
                        <p className="text-content-secondary">"{tc.text}"</p>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              </div>
            </div>
          )}

          {/* TAB 2: Review Queue for Unrecognized Skills */}
          {activeTab === "review" && (
            <SectionCard
              eyebrow="Ontology Curation"
              title="Unrecognized Skill Review Queue"
              description="Tokens extracted from job postings and resumes that do not yet map to a canonical entry. Approve as a new canonical skill, map as an alias, or dismiss noise."
            >
              {data.reviewQueue.length === 0 ? (
                <EmptyState
                  title="Zero unrecognized skill tokens queued"
                  description="All extracted job and resume skills matched the 340+ canonical ontology."
                  icon={
                    <CheckCircle2 className="h-5 w-5 text-status-success" />
                  }
                />
              ) : (
                <ul className="divide-y divide-border">
                  {data.reviewQueue.map((item) => (
                    <li
                      key={item.token}
                      className="flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-content-heading">
                            {item.token}
                          </span>
                          <Badge
                            tone={
                              item.status === "PENDING"
                                ? "warning"
                                : item.status === "DISMISSED"
                                  ? "neutral"
                                  : "success"
                            }
                            size="sm"
                          >
                            {item.status}
                          </Badge>
                          <Badge tone="primary" size="sm">
                            {item.occurrences} occurrence(s)
                          </Badge>
                          <span className="text-[11px] text-content-secondary">
                            Sources: {item.sources.join(", ")}
                          </span>
                        </div>
                        {item.sampleContexts[0] && (
                          <p className="text-xs text-content-secondary truncate">
                            Seen in: {item.sampleContexts[0]}
                          </p>
                        )}
                      </div>

                      {item.status === "PENDING" && (
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <Input
                            placeholder="Map alias to (e.g. react)"
                            value={aliasTargetByToken[item.token] ?? ""}
                            onChange={(e) =>
                              setAliasTargetByToken((prev) => ({
                                ...prev,
                                [item.token]: e.target.value,
                              }))
                            }
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!aliasTargetByToken[item.token]?.trim()}
                            onClick={() =>
                              void handleResolveToken(item.token, "MAP_ALIAS")
                            }
                          >
                            Map alias
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              void handleResolveToken(
                                item.token,
                                "APPROVE_CANONICAL",
                              )
                            }
                            leftIcon={<Check className="h-3.5 w-3.5" />}
                          >
                            Approve skill
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              void handleResolveToken(item.token, "DISMISS")
                            }
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          )}

          {/* TAB 3: Jobs Causing INSUFFICIENT_DATA */}
          {activeTab === "insufficient" && (
            <SectionCard
              eyebrow="Coverage Diagnostics"
              title="Listings Causing INSUFFICIENT_DATA"
              description="Active postings with empty requirements[] arrays that trigger INSUFFICIENT_DATA instead of guessed match scores."
            >
              {data.insufficientDataJobs.length === 0 ? (
                <EmptyState
                  title="All audited active jobs have structured skill requirements"
                  description="Zero listings are currently triggering INSUFFICIENT_DATA."
                  icon={
                    <CheckCircle2 className="h-5 w-5 text-status-success" />
                  }
                />
              ) : (
                <ul className="divide-y divide-border">
                  {data.insufficientDataJobs.map((job) => (
                    <li
                      key={job.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <p className="font-semibold text-content-heading">
                          {job.title} · {job.company}{" "}
                          <Badge tone="neutral" size="sm">
                            {job.source}
                          </Badge>
                        </p>
                        <p className="text-content-secondary">{job.reason}</p>
                      </div>
                      <Badge
                        tone={
                          job.reextractedSkillsCount > 0 ? "primary" : "warning"
                        }
                        size="sm"
                      >
                        {job.reextractedSkillsCount > 0
                          ? `${job.reextractedSkillsCount} recoverable from description`
                          : "No skills in text"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          )}

          {/* TAB 4: 9-Family Skill & Prerequisite Explorer */}
          {activeTab === "explorer" && (
            <SectionCard
              eyebrow="Canonical Graph"
              title="9-Family Skill & Prerequisite Explorer"
              description="Browse canonical skills, aliases, tier depth, and prerequisite chains (e.g., Kubernetes → Docker, Linux, Networking)."
            >
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-[240px_1fr]">
                  <Select
                    label="Filter by family"
                    value={selectedFamily}
                    onChange={(e) => setSelectedFamily(e.target.value)}
                    options={[
                      {
                        value: "ALL",
                        label: `All 9 Families (${data.skillsCatalog.length})`,
                      },
                      ...data.familyStats.map((f) => ({
                        value: f.family,
                        label: `${f.label} (${f.canonicalCount})`,
                      })),
                    ]}
                  />
                  <Input
                    label="Search canonical skill, alias, or prerequisite"
                    placeholder="e.g., kubernetes, k8s, rag, oauth, playwright..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredCatalog.slice(0, 60).map((item) => (
                    <Card
                      key={item.canonical}
                      muted
                      padding="sm"
                      className="space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-content-heading">
                          {item.canonical}
                        </span>
                        <Badge tone="neutral" size="sm">
                          {item.family}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-content-secondary">
                        Aliases: {item.aliases.join(", ")}
                      </p>
                      {item.prerequisites.length > 0 && (
                        <p className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                          <GitBranch className="h-3 w-3 shrink-0" />
                          Requires: {item.prerequisites.join(" + ")}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            </SectionCard>
          )}
        </>
      )}
    </ContentContainer>
  );
};

export default OntologyDashboardPage;

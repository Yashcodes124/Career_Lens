import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  FileText,
  Gauge,
  Save,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  applyTailoredResume,
  fetchTailoring,
  type BulletCoachSuggestion,
  type TailoringSuggestions,
} from "./tailoringApi";
import { useResumes } from "../resume/useResumes";
import { useReadiness } from "../readiness/useReadiness";
import { calculateJobMatch } from "../matching/matchingApi";
import type { MatchResult } from "../matching/types";
import { fetchJobById } from "../jobs/jobsApi";
import type { Job } from "../jobs/types";
import { ContentContainer, PageHeader } from "../../components/layout";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  SectionCard,
  Skeleton,
  SkillBadge,
  Tabs,
  Textarea,
  Toast,
} from "../../components/ui";

type BulletDecision = "PENDING" | "ACCEPTED" | "REJECTED";

interface BulletCoachItemState extends BulletCoachSuggestion {
  decision: BulletDecision;
  editedText: string;
  userMetric: string;
  isEditing: boolean;
}

const buildFinalBulletText = (item: BulletCoachItemState): string => {
  const base = item.editedText.trim();
  const metric = item.userMetric.trim();
  if (!metric) return base;
  const withoutTrailingPeriod = base.replace(/[.!?]+$/, "");
  const cleanMetric = metric.replace(/[.!?]+$/, "");
  return `${withoutTrailingPeriod}, ${cleanMetric}.`;
};

export const TailoringPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const queryResumeId = searchParams.get("resumeId");

  const { data: resumes, isLoading: resumesLoading } = useResumes();
  const { data: readiness } = useReadiness();

  const activeResume = useMemo(
    () => resumes?.find((r) => r.id === queryResumeId) ?? resumes?.[0] ?? null,
    [resumes, queryResumeId],
  );
  const activeResumeId = activeResume?.id ?? null;

  const [job, setJob] = useState<Job | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [tailoringData, setTailoringData] =
    useState<TailoringSuggestions | null>(null);

  const [bulletItems, setBulletItems] = useState<BulletCoachItemState[]>([]);
  const [acceptedSkills, setAcceptedSkills] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<string>("bullets");

  const [loading, setLoading] = useState(true);
  const [isSavingToResume, setIsSavingToResume] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const verifiedSkillSet = useMemo(() => {
    const set = new Set<string>();
    for (const s of readiness?.skills ?? []) {
      if (s.status === "STRONG") {
        set.add(s.skill.toLowerCase().trim());
      }
    }
    return set;
  }, [readiness]);

  const loadTailoringData = async () => {
    if (!jobId || !activeResumeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [resolvedJob, matchRes, tailoringRes] = await Promise.all([
        fetchJobById(jobId).catch(() => null),
        calculateJobMatch({ resumeId: activeResumeId, jobId }),
        fetchTailoring(activeResumeId, jobId),
      ]);

      if (resolvedJob) setJob(resolvedJob);
      setMatchResult(matchRes.data);
      setTailoringData(tailoringRes);

      setBulletItems(
        (tailoringRes.bulletSuggestions ?? []).map((b) => ({
          ...b,
          decision: "PENDING",
          editedText: b.suggestedBullet,
          userMetric: "",
          isEditing: false,
        })),
      );
      setAcceptedSkills(
        new Set((tailoringRes.addToSkills ?? []).map((s) => s.skill)),
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load Resume Bullet Coach.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resumesLoading) return;
    void loadTailoringData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, activeResumeId, resumesLoading]);

  const updateBulletItem = (
    id: string,
    updater: (item: BulletCoachItemState) => BulletCoachItemState,
  ) => {
    setBulletItems((prev) =>
      prev.map((item) => (item.id === id ? updater(item) : item)),
    );
  };

  const toggleSkillAddition = (skill: string) => {
    setAcceptedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill);
      else next.add(skill);
      return next;
    });
  };

  const acceptedBulletList = useMemo(
    () => bulletItems.filter((b) => b.decision === "ACCEPTED"),
    [bulletItems],
  );

  const vagueBulletsCount = useMemo(
    () => bulletItems.filter((b) => b.vaguePhrasesDetected.length > 0).length,
    [bulletItems],
  );

  const roleTitle =
    job?.title || tailoringData?.jobTitle || "Target Engineering Role";
  const companyName = job?.company || "Verified Employer";

  const excludedSkills = useMemo(() => {
    if (tailoringData?.notOnResume && tailoringData.notOnResume.length > 0) {
      return tailoringData.notOnResume.map((item) => item.skill);
    }
    return matchResult?.missingSkills ?? [];
  }, [tailoringData, matchResult]);

  const compiledTailoredDocument = useMemo(() => {
    const finalSkillsList = [
      ...(tailoringData?.currentSkills ?? []),
      ...(tailoringData?.addToSkills ?? [])
        .filter((s) => acceptedSkills.has(s.skill))
        .map((s) => s.skill),
    ];

    const lines = [
      `# Resume Bullet Coach & Truthful Alignment: ${roleTitle} at ${companyName}`,
      `Source Resume: ${activeResume?.fileName || activeResume?.title || "Active Resume"}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      `Policy: Strictly grounded in existing resume facts. Metrics added ONLY when supplied by candidate. Zero fabricated skills.`,
      "",
      "## Accepted Bullet Improvements",
      ...(acceptedBulletList.length === 0
        ? [
            "(No bullets accepted yet — review and click Accept on bullets in the Bullet Coach tab.)",
          ]
        : acceptedBulletList.map(
            (b, idx) =>
              `${idx + 1}. [${b.section}]\n   Original:  ${b.originalBullet}\n   Improved:  ${buildFinalBulletText(b)}`,
          )),
      "",
      "## Updated Skills Section (Evidenced Only)",
      finalSkillsList.join(", ") || "None",
      "",
      "## Excluded Missing Requirements (Never Fabricated)",
      ...excludedSkills.map(
        (m) =>
          `- ${m} (Absent from resume text — verify via project proof or interview first)`,
      ),
    ];
    return lines.join("\n");
  }, [
    roleTitle,
    companyName,
    activeResume,
    tailoringData,
    acceptedSkills,
    acceptedBulletList,
    excludedSkills,
  ]);

  const handleSaveAcceptedToResume = async () => {
    if (!activeResumeId || isSavingToResume) return;
    try {
      setIsSavingToResume(true);
      const res = await applyTailoredResume({
        resumeId: activeResumeId,
        acceptedSkills: [...acceptedSkills],
        acceptedBullets: acceptedBulletList.map((b) => ({
          originalBullet: b.originalBullet,
          finalBullet: buildFinalBulletText(b),
        })),
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["resumes"] }),
        queryClient.invalidateQueries({ queryKey: ["readiness"] }),
      ]);
      setToastMessage(
        `Saved ${res.appliedBulletsCount} bullet upgrade(s) and updated skills list (${res.totalSkillsCount} total skills) on your active resume.`,
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save accepted resume edits.",
      );
    } finally {
      setIsSavingToResume(false);
    }
  };

  const handleCopyTailored = async () => {
    try {
      await navigator.clipboard.writeText(compiledTailoredDocument);
      setToastMessage("Copied accepted bullet improvements to clipboard.");
    } catch {
      setToastMessage("Could not copy to clipboard.");
    }
  };

  const handleDownloadTailored = () => {
    const blob = new Blob([compiledTailoredDocument], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TrueHire-Bullet-Coach-${roleTitle.replace(/\s+/g, "-")}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToastMessage("Downloaded tailored resume markdown.");
  };

  return (
    <ContentContainer size="xl" className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Explore Jobs", href: "/jobs" },
          ...(jobId ? [{ label: roleTitle, href: `/matches/${jobId}` }] : []),
          { label: "Resume Bullet Coach" },
        ]}
        eyebrow={`Controlled Resume Improvement · ${companyName}`}
        title={`Resume Bullet Coach for ${roleTitle}`}
        description="Strengthen vague claims with stronger action verbs, add real metrics you supply yourself, and accept, edit, or reject every suggestion."
        primaryAction={
          <Button
            variant="primary"
            loading={isSavingToResume}
            disabled={
              acceptedBulletList.length === 0 && acceptedSkills.size === 0
            }
            onClick={() => void handleSaveAcceptedToResume()}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save accepted to resume ({acceptedBulletList.length} bullets)
          </Button>
        }
        secondaryActions={
          <>
            <Button
              variant="outline"
              onClick={() => void handleCopyTailored()}
              leftIcon={<Copy className="h-4 w-4" />}
            >
              Copy diff
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadTailored}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Export (.md)
            </Button>
            {jobId && (
              <Button
                variant="outline"
                onClick={() =>
                  navigate(
                    `/skill-gaps/${jobId}${
                      activeResumeId ? `?resumeId=${activeResumeId}` : ""
                    }`,
                  )
                }
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Practice missing skills
              </Button>
            )}
          </>
        }
      />

      {toastMessage && (
        <Toast
          tone="success"
          title="Resume Bullet Coach updated"
          description={toastMessage}
          onDismiss={() => setToastMessage(null)}
        />
      )}

      {/* Non-Fabrication & User-Supplied Metrics Policy */}
      <Card
        padding="md"
        className="border-primary/25 bg-primary-soft/60 space-y-2"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-content-heading">
              Controlled Coaching Policy: Zero Fabricated Metrics, Experience,
              or Skills
            </h2>
          </div>
          <Badge tone="primary" size="sm">
            Human-in-the-Loop
          </Badge>
        </div>
        <p className="text-xs leading-relaxed text-content-body">
          TrueHire flags vague phrasing (such as{" "}
          <strong className="font-semibold text-content-heading">
            "worked on"
          </strong>{" "}
          or{" "}
          <strong className="font-semibold text-content-heading">
            "responsible for"
          </strong>
          ) and upgrades weak verbs using only facts from{" "}
          <strong className="font-semibold text-content-heading">
            {activeResume?.fileName ||
              activeResume?.title ||
              "your active resume"}
          </strong>
          . Metrics are never guessed—quantified outcomes are inserted{" "}
          <strong className="font-semibold text-content-heading">
            only when you provide the real number
          </strong>
          .
        </p>
      </Card>

      {loading || resumesLoading ? (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : !activeResumeId ? (
        <EmptyState
          title="No active resume selected"
          description="Upload a PDF or DOCX resume first so the Resume Bullet Coach can analyze your experience bullets."
          icon={<FileText className="h-5 w-5" />}
          action={
            <Button variant="primary" onClick={() => navigate("/resume")}>
              Upload resume
            </Button>
          }
        />
      ) : error ? (
        <ErrorState
          title="Could not load Resume Bullet Coach"
          message={error}
          onRetry={() => void loadTailoringData()}
        />
      ) : (
        <>
          {/* Summary Telemetry Strip */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card padding="sm" className="space-y-1">
              <span className="text-xs font-medium text-content-secondary">
                Bullets Coached
              </span>
              <p className="text-2xl font-semibold text-content-heading tabular-nums">
                {bulletItems.length}
              </p>
              <p className="text-xs text-content-secondary">
                {vagueBulletsCount} with vague claims detected
              </p>
            </Card>

            <Card padding="sm" className="space-y-1">
              <span className="text-xs font-medium text-content-secondary">
                Accepted Improvements
              </span>
              <p className="text-2xl font-semibold text-status-success tabular-nums">
                {acceptedBulletList.length}
              </p>
              <p className="text-xs text-content-secondary">
                Ready to save to active resume
              </p>
            </Card>

            <Card padding="sm" className="space-y-1">
              <span className="text-xs font-medium text-content-secondary">
                Skills Found in Text
              </span>
              <p className="text-2xl font-semibold text-primary tabular-nums">
                {tailoringData?.addToSkills.length ?? 0}
              </p>
              <p className="text-xs text-content-secondary">
                Safe to add to Skills section
              </p>
            </Card>

            <Card padding="sm" className="space-y-1">
              <span className="text-xs font-medium text-content-secondary">
                Excluded Gaps
              </span>
              <p className="text-2xl font-semibold text-status-warning tabular-nums">
                {excludedSkills.length}
              </p>
              <p className="text-xs text-content-secondary">
                Blocked from fabrication
              </p>
            </Card>
          </section>

          <Tabs
            activeTab={activeTab}
            onChange={setActiveTab}
            items={[
              {
                id: "bullets",
                label: "Bullet Coach (Original vs. Suggested)",
                count: bulletItems.length,
              },
              {
                id: "skills",
                label: `Skills Alignment (${tailoringData?.addToSkills.length ?? 0} evidenced / ${excludedSkills.length} excluded)`,
              },
              {
                id: "preview",
                label: "Compiled Export Preview",
                count: acceptedBulletList.length,
              },
            ]}
          />

          {/* TAB 1: Controlled Bullet Coach (Accept / Edit / Reject + User Metrics) */}
          {activeTab === "bullets" && (
            <SectionCard
              eyebrow="Side-by-Side Bullet Diff"
              title="Resume Bullet Coach"
              description="Compare each original resume bullet against the strengthened phrasing. Provide your own real metrics where prompted, and Accept, Edit, or Reject each suggestion."
              action={
                bulletItems.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setBulletItems((prev) =>
                          prev.map((b) => ({ ...b, decision: "ACCEPTED" })),
                        )
                      }
                      leftIcon={<Check className="h-3.5 w-3.5" />}
                    >
                      Accept all ({bulletItems.length})
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setBulletItems((prev) =>
                          prev.map((b) => ({
                            ...b,
                            decision: "PENDING",
                            isEditing: false,
                          })),
                        )
                      }
                    >
                      Reset decisions
                    </Button>
                  </div>
                ) : undefined
              }
            >
              {bulletItems.length === 0 ? (
                <EmptyState
                  title="No vague or unquantified bullets detected"
                  description="Your resume bullets already use strong action verbs and quantified outcomes, or you can edit your resume sections directly on the Resumes page."
                  icon={<Sparkles className="h-5 w-5" />}
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/resume")}
                    >
                      Open Resume Editor
                    </Button>
                  }
                />
              ) : (
                <ul className="space-y-4">
                  {bulletItems.map((item) => {
                    const finalPreview = buildFinalBulletText(item);
                    return (
                      <li key={item.id}>
                        <Card
                          padding="md"
                          className={`space-y-4 transition-colors ${
                            item.decision === "ACCEPTED"
                              ? "border-status-success-border bg-status-success-soft/15"
                              : item.decision === "REJECTED"
                                ? "opacity-60 bg-muted/40"
                                : "border-border bg-surface"
                          }`}
                        >
                          {/* Top Metadata & Accept / Edit / Reject Controls */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge tone="neutral" size="sm">
                                {item.section}
                              </Badge>
                              {item.vaguePhrasesDetected.map((vp) => (
                                <Badge key={vp} tone="warning" size="sm">
                                  Vague claim: "{vp}"
                                </Badge>
                              ))}
                              {item.needsUserMetric && (
                                <Badge tone="primary" size="sm">
                                  Needs user metric
                                </Badge>
                              )}
                              {item.matchedJobSkillsInBullet.map((sk) => (
                                <Badge key={sk} tone="success" size="sm">
                                  Matches: {sk}
                                </Badge>
                              ))}
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              <Button
                                variant={
                                  item.decision === "ACCEPTED"
                                    ? "primary"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  updateBulletItem(item.id, (cur) => ({
                                    ...cur,
                                    decision:
                                      cur.decision === "ACCEPTED"
                                        ? "PENDING"
                                        : "ACCEPTED",
                                    isEditing: false,
                                  }))
                                }
                                leftIcon={<Check className="h-3.5 w-3.5" />}
                              >
                                {item.decision === "ACCEPTED"
                                  ? "Accepted"
                                  : "Accept"}
                              </Button>

                              <Button
                                variant={
                                  item.isEditing ? "secondary" : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  updateBulletItem(item.id, (cur) => ({
                                    ...cur,
                                    isEditing: !cur.isEditing,
                                  }))
                                }
                                leftIcon={<Edit3 className="h-3.5 w-3.5" />}
                              >
                                {item.isEditing ? "Done editing" : "Edit"}
                              </Button>

                              <Button
                                variant={
                                  item.decision === "REJECTED"
                                    ? "danger"
                                    : "ghost"
                                }
                                size="sm"
                                onClick={() =>
                                  updateBulletItem(item.id, (cur) => ({
                                    ...cur,
                                    decision:
                                      cur.decision === "REJECTED"
                                        ? "PENDING"
                                        : "REJECTED",
                                    isEditing: false,
                                  }))
                                }
                                leftIcon={<X className="h-3.5 w-3.5" />}
                              >
                                {item.decision === "REJECTED"
                                  ? "Rejected"
                                  : "Reject"}
                              </Button>
                            </div>
                          </div>

                          <p className="text-xs text-content-secondary">
                            {item.rationale}
                          </p>

                          {/* Original vs. Suggested Split View */}
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="rounded-input border border-border bg-muted/50 p-3.5 space-y-1.5">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-content-secondary">
                                Original Resume Bullet
                              </p>
                              <p className="text-xs leading-relaxed text-content-body">
                                {item.originalBullet}
                              </p>
                            </div>

                            <div className="rounded-input border border-status-success-border bg-status-success-soft/40 p-3.5 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-status-success">
                                  Suggested Bullet (Grounded in Your Facts)
                                </p>
                                {item.actionVerbUpgrade && (
                                  <span className="text-[11px] text-content-secondary">
                                    "{item.actionVerbUpgrade.from}" →{" "}
                                    <strong className="text-content-heading">
                                      "{item.actionVerbUpgrade.to}"
                                    </strong>
                                  </span>
                                )}
                              </div>

                              {item.isEditing ? (
                                <Textarea
                                  rows={3}
                                  value={item.editedText}
                                  onChange={(e) =>
                                    updateBulletItem(item.id, (cur) => ({
                                      ...cur,
                                      editedText: e.target.value,
                                      decision: "ACCEPTED",
                                    }))
                                  }
                                />
                              ) : (
                                <p className="text-xs leading-relaxed text-content-heading font-medium">
                                  {finalPreview}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Optional User-Supplied Metric Box (Never Fabricated) */}
                          {item.needsUserMetric &&
                            item.decision !== "REJECTED" && (
                              <div className="rounded-input border border-border bg-muted/30 p-3 space-y-2">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-content-heading">
                                  <Gauge className="h-3.5 w-3.5 text-primary" />
                                  <span>
                                    Add Your Real Metric (Optional · Never
                                    Auto-Invented)
                                  </span>
                                </div>
                                <p className="text-[11px] text-content-secondary">
                                  {item.metricPrompt}
                                </p>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                  <Input
                                    placeholder="e.g., reducing p95 latency by 38% across 10k req/min"
                                    value={item.userMetric}
                                    onChange={(e) =>
                                      updateBulletItem(item.id, (cur) => ({
                                        ...cur,
                                        userMetric: e.target.value,
                                        decision: e.target.value.trim()
                                          ? "ACCEPTED"
                                          : cur.decision,
                                      }))
                                    }
                                  />
                                  {item.userMetric && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        updateBulletItem(item.id, (cur) => ({
                                          ...cur,
                                          userMetric: "",
                                        }))
                                      }
                                    >
                                      Clear metric
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              )}
            </SectionCard>
          )}

          {/* TAB 2: Truthful Skills List Alignment vs. Excluded Missing Skills */}
          {activeTab === "skills" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card padding="md" className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-status-success">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      Skills Evidenced in Resume Text (
                      {tailoringData?.addToSkills.length ?? 0})
                    </span>
                  </span>
                  <Badge tone="success" size="sm">
                    Safe to Add
                  </Badge>
                </div>
                <p className="text-xs text-content-secondary">
                  Mentioned in your project/experience text, but missing from
                  your Skills section:
                </p>
                {(tailoringData?.addToSkills ?? []).length === 0 ? (
                  <p className="text-xs text-content-secondary">
                    Your Skills section already includes all required skills
                    mentioned in your resume text.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {tailoringData!.addToSkills.map((item) => {
                      const checked = acceptedSkills.has(item.skill);
                      const isVerified = verifiedSkillSet.has(
                        item.skill.toLowerCase().trim(),
                      );
                      return (
                        <li
                          key={item.skill}
                          className="flex items-center justify-between gap-2 rounded-input border border-border bg-muted/40 p-2.5 text-xs"
                        >
                          <div>
                            <SkillBadge
                              skill={item.skill}
                              level={isVerified ? "VERIFIED" : "PRACTICED"}
                            />
                            <p className="mt-1 text-content-secondary">
                              {item.evidence}
                            </p>
                          </div>
                          <Button
                            variant={checked ? "primary" : "outline"}
                            size="sm"
                            onClick={() => toggleSkillAddition(item.skill)}
                          >
                            {checked ? "Included" : "Include"}
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>

              <Card padding="md" className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-status-warning">
                    <AlertTriangle className="h-4 w-4" />
                    <span>
                      Missing Skills Blocked from Fabrication (
                      {excludedSkills.length})
                    </span>
                  </span>
                  <Badge tone="warning" size="sm">
                    Do Not Fabricate
                  </Badge>
                </div>
                <p className="text-xs text-content-secondary">
                  Required by {roleTitle}, but absent from your resume
                  text—never added automatically:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {excludedSkills.length === 0 ? (
                    <span className="text-xs text-status-success">
                      Zero missing skills for this role.
                    </span>
                  ) : (
                    excludedSkills.map((skill) => (
                      <SkillBadge key={skill} skill={skill} level="MISSING" />
                    ))
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* TAB 3: Compiled Export Preview */}
          {activeTab === "preview" && (
            <SectionCard
              eyebrow="Exportable Markdown"
              title="Compiled Tailoring & Bullet Coach Summary"
              description="Only your accepted/edited bullets and evidenced skills appear below."
            >
              <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-input border border-border bg-muted/50 p-4 font-mono text-xs leading-relaxed text-content-body">
                {compiledTailoredDocument}
              </pre>
            </SectionCard>
          )}
        </>
      )}
    </ContentContainer>
  );
};

export default TailoringPage;

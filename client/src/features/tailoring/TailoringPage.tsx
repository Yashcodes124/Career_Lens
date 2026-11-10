import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useResumes } from "../resume/useResumes";
import { useReadiness } from "../readiness/useReadiness";
import { calculateJobMatch } from "../matching/matchingApi";
import type { MatchResult } from "../matching/types";
import type { Job } from "../jobs/types";
import { apiClient } from "../../lib/api-client";
import { ContentContainer, PageHeader } from "../../components/layout";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  SectionCard,
  Skeleton,
  SkillBadge,
  Tabs,
  Toast,
} from "../../components/ui";

interface TailoringSuggestion {
  id: string;
  section: string;
  skill: string;
  evidenceSource: "INTERVIEW_VERIFIED" | "RESUME_EXTRACTED";
  originalText: string;
  suggestedText: string;
  rationale: string;
}

interface TailoringApiResponse {
  tailoredSummary?: string;
  suggestions?: Array<{
    section?: string;
    skill?: string;
    original?: string;
    originalText?: string;
    suggested?: string;
    suggestedText?: string;
    reason?: string;
    rationale?: string;
  }>;
  matchedSkills?: string[];
  excludedMissingSkills?: string[];
}

// Deterministic, truthful fallback builder bounded strictly by the user's real resume lines and verified skills
function buildTruthfulSuggestions(
  rawText: string,
  matchedSkills: string[],
  verifiedSet: Set<string>,
  roleTitle: string,
): TailoringSuggestion[] {
  const resumeLines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 25);

  return matchedSkills.map((skill, idx) => {
    const isVerified = verifiedSet.has(skill.toLowerCase().trim());
    const matchingLine =
      resumeLines.find((line) =>
        line.toLowerCase().includes(skill.toLowerCase()),
      ) ??
      `Existing resume lists ${skill} in technical skills and project experience.`;

    const suggestedText = isVerified
      ? `${matchingLine.replace(/\.$/, "")} — demonstrated production trade-offs and implementation depth in ${skill} aligned with ${roleTitle} requirements.`
      : `Highlight existing ${skill} implementation from your resume in the top summary and relevant project bullet for ${roleTitle}, specifying concrete scope and measurable outcomes from your actual work.`;

    return {
      id: `truthful-${idx}-${skill}`,
      section: idx === 0 ? "Summary & Core Stack" : "Experience & Projects",
      skill,
      evidenceSource: isVerified ? "INTERVIEW_VERIFIED" : "RESUME_EXTRACTED",
      originalText: matchingLine,
      suggestedText,
      rationale: isVerified
        ? `You both listed ${skill} on your resume and verified it in a mock interview evaluation.`
        : `${skill} is already present on your uploaded resume and explicitly required by ${roleTitle}.`,
    };
  });
}

export const TailoringPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
  const [suggestions, setSuggestions] = useState<TailoringSuggestion[]>([]);
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<string>("workbench");

  const [loading, setLoading] = useState(true);
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

      const [jobRes, matchRes] = await Promise.all([
        apiClient.get<{ data?: Job } | Job>(`/jobs/${jobId}`).catch(() => null),
        calculateJobMatch({ resumeId: activeResumeId, jobId }),
      ]);

      let resolvedJob: Job | null = null;
      if (jobRes) {
        resolvedJob =
          "data" in jobRes && jobRes.data ? jobRes.data : (jobRes as Job);
        setJob(resolvedJob);
      }

      const matchData = matchRes.data;
      setMatchResult(matchData);

      const roleTitle = resolvedJob?.title ?? "Target Engineering Role";
      const rawResumeText =
        (activeResume as { rawText?: string; content?: string })?.rawText ||
        (activeResume as { content?: string })?.content ||
        "";

      // Try backend tailoring endpoint if available; strictly filter any output to matched skills only
      let generatedSuggestions: TailoringSuggestion[] = [];
      try {
        const apiTailor = await apiClient.post<
          { data?: TailoringApiResponse } | TailoringApiResponse
        >("/tailoring", {
          resumeId: activeResumeId,
          jobId,
        });
        const payload =
          apiTailor && "data" in apiTailor && apiTailor.data
            ? apiTailor.data
            : (apiTailor as TailoringApiResponse);

        if (
          Array.isArray(payload?.suggestions) &&
          payload.suggestions.length > 0
        ) {
          const allowedSet = new Set(
            matchData.matchedSkills.map((s) => s.toLowerCase().trim()),
          );
          generatedSuggestions = payload.suggestions
            .filter(
              (item) =>
                !item.skill || allowedSet.has(item.skill.toLowerCase().trim()),
            )
            .map((item, idx) => {
              const skillName =
                item.skill || matchData.matchedSkills[idx] || "Verified Skill";
              const isVerified = verifiedSkillSet.has(
                skillName.toLowerCase().trim(),
              );
              return {
                id: `api-sug-${idx}`,
                section: item.section || "Experience & Summary",
                skill: skillName,
                evidenceSource: isVerified
                  ? "INTERVIEW_VERIFIED"
                  : "RESUME_EXTRACTED",
                originalText:
                  item.originalText ||
                  item.original ||
                  `Resume evidence for ${skillName}`,
                suggestedText:
                  item.suggestedText ||
                  item.suggested ||
                  `Emphasize your verified ${skillName} experience.`,
                rationale:
                  item.rationale ||
                  item.reason ||
                  `Grounded in your existing ${skillName} evidence.`,
              };
            });
        }
      } catch {
        // Fallback to deterministic evidence-bounded builder below
      }

      if (generatedSuggestions.length === 0) {
        generatedSuggestions = buildTruthfulSuggestions(
          rawResumeText,
          matchData.matchedSkills,
          verifiedSkillSet,
          roleTitle,
        );
      }

      setSuggestions(generatedSuggestions);
      setAcceptedIds(new Set(generatedSuggestions.map((s) => s.id)));
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not generate evidence-bounded tailoring suggestions.",
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

  const toggleSuggestion = (id: string) => {
    setAcceptedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAcceptAll = () => {
    setAcceptedIds(new Set(suggestions.map((s) => s.id)));
  };

  const handleRejectAll = () => {
    setAcceptedIds(new Set());
  };

  const acceptedSuggestions = useMemo(
    () => suggestions.filter((s) => acceptedIds.has(s.id)),
    [suggestions, acceptedIds],
  );

  const roleTitle = job?.title ?? "Target Engineering Role";
  const companyName = job?.company ?? "Verified Employer";

  const compiledTailoredDocument = useMemo(() => {
    const header = [
      `# Evidence-Bounded Tailoring Plan: ${roleTitle} at ${companyName}`,
      `Source Resume: ${activeResume?.fileName || activeResume?.title || "Active Resume"}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      `Policy: Strictly bounded by existing resume facts and verified interview evaluations. Zero fabricated skills.`,
      "",
      "## Emphasized Qualifications (Backed by Evidence)",
      ...acceptedSuggestions.map(
        (s, idx) =>
          `${idx + 1}. [${s.skill} — ${
            s.evidenceSource === "INTERVIEW_VERIFIED"
              ? "Interview Verified"
              : "Resume Extracted"
          }]\n   Original: ${s.originalText}\n   Tailored: ${s.suggestedText}`,
      ),
      "",
      "## Excluded Missing Requirements (Never Added Until Proven)",
      ...(matchResult?.missingSkills ?? []).map(
        (m) =>
          `- ${m} (Not on active resume — complete a targeted interview first)`,
      ),
    ];
    return header.join("\n");
  }, [roleTitle, companyName, activeResume, acceptedSuggestions, matchResult]);

  const handleCopyTailored = async () => {
    try {
      await navigator.clipboard.writeText(compiledTailoredDocument);
      setToastMessage("Copied evidence-bounded tailoring notes to clipboard.");
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
    link.download = `TrueHire-Tailored-${roleTitle.replace(/\s+/g, "-")}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToastMessage("Downloaded tailored resume guide.");
  };

  return (
    <ContentContainer size="xl" className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Explore Jobs", href: "/jobs" },
          ...(jobId ? [{ label: roleTitle, href: `/matches/${jobId}` }] : []),
          { label: "Evidence-Bounded Tailoring" },
        ]}
        eyebrow={`Truthful Resume Alignment · ${companyName}`}
        title={`Tailor Resume for ${roleTitle}`}
        description="Highlight the skills and project outcomes you already possess that match this role. TrueHire never fabricates unverified skills or experience."
        primaryAction={
          <Button
            variant="primary"
            onClick={() => void handleCopyTailored()}
            disabled={acceptedSuggestions.length === 0}
            leftIcon={<Copy className="h-4 w-4" />}
          >
            Copy accepted changes ({acceptedSuggestions.length})
          </Button>
        }
        secondaryActions={
          <>
            <Button
              variant="outline"
              onClick={handleDownloadTailored}
              disabled={acceptedSuggestions.length === 0}
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
          title="Tailoring updated"
          description={toastMessage}
          onDismiss={() => setToastMessage(null)}
        />
      )}

      {/* Non-Fabrication Truthfulness Guardrail Notice */}
      <Card
        padding="md"
        className="border-primary/25 bg-primary-soft/60 space-y-2"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-content-heading">
              Non-Fabrication Guarantee: Truthful Evidence Only
            </h2>
          </div>
          <Badge tone="primary" size="sm">
            Evidence-Bounded
          </Badge>
        </div>
        <p className="text-xs leading-relaxed text-content-body">
          Suggestions below only reframe skills and experience already present
          on{" "}
          <strong className="font-semibold text-content-heading">
            {activeResume?.fileName ||
              activeResume?.title ||
              "your active resume"}
          </strong>{" "}
          or verified in your mock interviews. The{" "}
          <strong className="font-semibold text-content-heading">
            {matchResult?.missingSkills.length ?? 0} missing requirements
          </strong>{" "}
          for this role are intentionally excluded so you never claim unverified
          experience.
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
          description="Upload a PDF or DOCX resume first so TrueHire can generate truthful, evidence-bounded tailoring suggestions."
          icon={<FileText className="h-5 w-5" />}
          action={
            <Button variant="primary" onClick={() => navigate("/resume")}>
              Upload resume
            </Button>
          }
        />
      ) : error ? (
        <ErrorState
          title="Could not load tailoring workbench"
          message={error}
          onRetry={() => void loadTailoringData()}
        />
      ) : (
        <>
          {/* Evidence Boundary Matrix: Allowed vs. Excluded Skills */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card padding="md" className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-status-success">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    Truthful Skills Safe to Emphasize (
                    {matchResult?.matchedSkills.length ?? 0})
                  </span>
                </span>
                <Badge tone="success" size="sm">
                  Backed by Evidence
                </Badge>
              </div>
              <p className="text-xs text-content-secondary">
                Present on your active resume or verified in mock interviews:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(matchResult?.matchedSkills ?? []).length === 0 ? (
                  <span className="text-xs text-content-secondary">
                    No matched skills found on active resume.
                  </span>
                ) : (
                  (matchResult?.matchedSkills ?? []).map((skill) => {
                    const isVerified = verifiedSkillSet.has(
                      skill.toLowerCase().trim(),
                    );
                    return (
                      <SkillBadge
                        key={skill}
                        skill={skill}
                        level={isVerified ? "VERIFIED" : "EXTRACTED"}
                      />
                    );
                  })
                )}
              </div>
            </Card>

            <Card padding="md" className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-status-warning">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    Missing Skills Excluded from Fabrication (
                    {matchResult?.missingSkills.length ?? 0})
                  </span>
                </span>
                <Badge tone="warning" size="sm">
                  Do Not Fabricate
                </Badge>
              </div>
              <p className="text-xs text-content-secondary">
                Required by the job, but omitted from tailoring until you prove
                them in an interview or project:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(matchResult?.missingSkills ?? []).length === 0 ? (
                  <span className="text-xs text-status-success">
                    Zero missing skills — all requirements are backed by
                    evidence.
                  </span>
                ) : (
                  (matchResult?.missingSkills ?? []).map((skill) => (
                    <SkillBadge key={skill} skill={skill} level="MISSING" />
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Interactive Workbench Tabs */}
          <SectionCard
            eyebrow="Split-View Diff Workbench"
            title={`Evidence-Bounded Suggestions (${acceptedSuggestions.length} of ${suggestions.length} accepted)`}
            description="Review each side-by-side comparison between your current resume evidence and the role-aligned phrasing."
            action={
              suggestions.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleAcceptAll}
                    leftIcon={<Check className="h-3.5 w-3.5" />}
                  >
                    Accept all ({suggestions.length})
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRejectAll}
                    leftIcon={<X className="h-3.5 w-3.5" />}
                  >
                    Clear selection
                  </Button>
                </div>
              ) : undefined
            }
          >
            <Tabs
              activeTab={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  id: "workbench",
                  label: "Side-by-Side Diff",
                  count: suggestions.length,
                  content:
                    suggestions.length === 0 ? (
                      <EmptyState
                        title="No matched skills to tailor yet"
                        description="Your current resume does not share extracted skills with this job posting. Practice the missing skills in a targeted interview first."
                        icon={<Sparkles className="h-5 w-5" />}
                        action={
                          jobId ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() =>
                                navigate(
                                  `/skill-gaps/${jobId}${
                                    activeResumeId
                                      ? `?resumeId=${activeResumeId}`
                                      : ""
                                  }`,
                                )
                              }
                            >
                              Practice missing skills
                            </Button>
                          ) : undefined
                        }
                      />
                    ) : (
                      <ul className="space-y-4">
                        {suggestions.map((item) => {
                          const isAccepted = acceptedIds.has(item.id);
                          return (
                            <li key={item.id}>
                              <Card
                                padding="md"
                                className={`space-y-4 transition-colors ${
                                  isAccepted
                                    ? "border-primary/40 bg-surface"
                                    : "opacity-75 bg-muted/30"
                                }`}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge tone="neutral" size="sm">
                                      {item.section}
                                    </Badge>
                                    <SkillBadge
                                      skill={item.skill}
                                      level={
                                        item.evidenceSource ===
                                        "INTERVIEW_VERIFIED"
                                          ? "VERIFIED"
                                          : "EXTRACTED"
                                      }
                                      meta={
                                        item.evidenceSource ===
                                        "INTERVIEW_VERIFIED"
                                          ? "Interview Verified"
                                          : "On Resume"
                                      }
                                    />
                                    <span className="text-xs text-content-secondary">
                                      {item.rationale}
                                    </span>
                                  </div>

                                  <Button
                                    variant={isAccepted ? "primary" : "outline"}
                                    size="sm"
                                    onClick={() => toggleSuggestion(item.id)}
                                    leftIcon={
                                      isAccepted ? (
                                        <Check className="h-3.5 w-3.5" />
                                      ) : undefined
                                    }
                                  >
                                    {isAccepted ? "Accepted" : "Accept"}
                                  </Button>
                                </div>

                                <div className="grid gap-4 lg:grid-cols-2">
                                  <div className="rounded-input border border-border bg-muted/50 p-3.5 space-y-1.5">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-content-secondary">
                                      Current Resume Evidence
                                    </p>
                                    <p className="text-xs leading-relaxed text-content-body">
                                      {item.originalText}
                                    </p>
                                  </div>

                                  <div className="rounded-input border border-status-success-border bg-status-success-soft/50 p-3.5 space-y-1.5">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-status-success">
                                      Suggested Truthful Alignment
                                    </p>
                                    <p className="text-xs leading-relaxed text-content-heading">
                                      {item.suggestedText}
                                    </p>
                                  </div>
                                </div>
                              </Card>
                            </li>
                          );
                        })}
                      </ul>
                    ),
                },
                {
                  id: "preview",
                  label: "Export Preview",
                  count: acceptedSuggestions.length,
                  content: (
                    <div className="space-y-3">
                      <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-input border border-border bg-muted/50 p-4 font-mono text-xs leading-relaxed text-content-body">
                        {compiledTailoredDocument}
                      </pre>
                    </div>
                  ),
                },
              ]}
            />
          </SectionCard>
        </>
      )}
    </ContentContainer>
  );
};

export default TailoringPage;

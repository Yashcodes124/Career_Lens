import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Crosshair,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  NextAction,
  ReadinessSkill,
  GlobalOffenseTarget,
} from "./readinessApi";
import { useReadiness } from "./useReadiness";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  SkillBadge,
} from "../../components/ui";

const getActionConfig = (
  action: NextAction,
): { to: string; label: string; contextLabel: string } => {
  switch (action.type) {
    case "UPLOAD_RESUME":
      return {
        to: "/resume",
        label: "Upload a resume",
        contextLabel: "Step 1 · Baseline Skill Extraction",
      };
    case "PRACTICE_SKILL":
      return {
        to: "/jobs",
        label: `Practice ${action.skill}`,
        contextLabel: `Targeted Skill Gap · ${action.skill}`,
      };
    case "EXPLORE_JOBS":
      return {
        to: "/jobs",
        label: "Browse verified jobs",
        contextLabel: "Role Discovery · Verified ATS Postings",
      };
    case "START_INTERVIEW":
      return {
        to: "/jobs",
        label: "Start targeted interview",
        contextLabel: "Interview Verification · Rubric Assessment",
      };
  }
};

export function ReadinessPanel() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useReadiness();

  if (isLoading) {
    return (
      <Card padding="md" className="space-y-4" aria-busy="true">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-6 w-28" />
        </div>
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load your next best action"
        message="We could not retrieve your latest readiness recommendation."
        onRetry={() => void refetch()}
      />
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="No readiness recommendation yet"
        description="Upload your resume to get your first personalized next step."
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate("/resume")}
          >
            Upload resume
          </Button>
        }
      />
    );
  }

  const weakSkills: ReadinessSkill[] = data.skills.filter(
    (s: ReadinessSkill) => s.status === "WEAK",
  );
  const strongSkills: ReadinessSkill[] = data.skills.filter(
    (s: ReadinessSkill) => s.status === "STRONG",
  );
  const defense = data.defenseSummary;
  const offenseTargets: GlobalOffenseTarget[] = data.offenseTargets ?? [];
  const cta = getActionConfig(data.nextAction);

  return (
    <Card
      padding="md"
      aria-labelledby="next-best-action-heading"
      className="space-y-5"
    >
      {/* Primary Next Best Action Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-card border border-primary/20 bg-primary-soft/60 p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              tone="primary"
              size="sm"
              icon={<Sparkles className="h-3 w-3" />}
            >
              Next Best Action
            </Badge>
            <span className="text-xs font-medium text-content-secondary">
              {cta.contextLabel}
            </span>
          </div>
          <h2
            id="next-best-action-heading"
            className="text-base font-semibold text-content-heading sm:text-lg"
          >
            {data.nextAction.reason}
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate(cta.to)}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            {cta.label}
          </Button>
        </div>
      </div>

      {/* Evidence Summary Strip: Resume Claims vs. Priority Strike Targets */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left: Skill Verification & Weak Evidence */}
        <Card muted padding="sm" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              {weakSkills.length > 0 ? (
                <ShieldAlert className="h-4 w-4 text-status-warning" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-status-success" />
              )}
              <h3 className="text-xs font-semibold uppercase tracking-wider text-content-heading">
                Skill Evidence Status
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {defense && (
                <Badge
                  tone={
                    defense.defensibilityPct >= 70
                      ? "success"
                      : defense.defensibilityPct >= 40
                        ? "primary"
                        : "warning"
                  }
                  size="sm"
                >
                  {defense.defensibilityPct}% verified
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/readiness")}
              >
                Full ledger
              </Button>
            </div>
          </div>

          {weakSkills.length > 0 ? (
            <ul className="divide-y divide-border">
              {weakSkills.slice(0, 3).map((s: ReadinessSkill) => (
                <li
                  key={s.skill}
                  className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-semibold text-content-heading">
                      {s.skill}
                    </p>
                    <p className="text-xs text-content-secondary">
                      {s.evidence ||
                        "Flagged for practice in mock interview evaluation"}
                    </p>
                  </div>
                  <Badge tone="warning" size="sm">
                    Needs practice
                  </Badge>
                </li>
              ))}
            </ul>
          ) : strongSkills.length > 0 ? (
            <ul className="divide-y divide-border">
              {strongSkills.slice(0, 3).map((s: ReadinessSkill) => (
                <li
                  key={s.skill}
                  className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-semibold text-content-heading">
                      {s.skill}
                    </p>
                    <p className="text-xs text-content-secondary">
                      {s.evidence ||
                        "Demonstrated in a targeted mock interview"}
                    </p>
                  </div>
                  <Badge
                    tone="success"
                    size="sm"
                    icon={<CheckCircle2 className="h-3 w-3" />}
                  >
                    Verified
                  </Badge>
                </li>
              ))}
            </ul>
          ) : defense && defense.unverifiedSkills.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-content-secondary">
                Extracted from your resume — complete a mock interview to
                verify:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {defense.unverifiedSkills.slice(0, 6).map((skill: string) => (
                  <SkillBadge key={skill} skill={skill} level="EXTRACTED" />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-content-secondary">
              No interview evaluations recorded yet. Start a mock interview on
              any matched role to verify your resume skills.
            </p>
          )}
        </Card>

        {/* Right: High-Impact Missing Skills Across Tracked Jobs */}
        <Card muted padding="sm" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-content-heading">
                Highest-Impact Skill Gaps
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/skills")}
            >
              View all skills
            </Button>
          </div>

          {offenseTargets.length > 0 ? (
            <ul className="divide-y divide-border">
              {offenseTargets.slice(0, 3).map((target: GlobalOffenseTarget) => (
                <li
                  key={target.skill}
                  className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-semibold text-content-heading">
                      {target.skill}
                    </p>
                    <p className="text-xs text-content-secondary">
                      {target.isExposedWeakness
                        ? "Flagged weak in a prior interview — practice to recover credit"
                        : `Required in ${target.blockedApplicationsCount} tracked ${
                            target.blockedApplicationsCount === 1
                              ? "role"
                              : "roles"
                          }`}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/jobs")}
                  >
                    Practice
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-content-secondary">
              Compare your resume against verified jobs to see which missing
              skills appear most often across your target roles.
            </p>
          )}
        </Card>
      </div>
    </Card>
  );
}

export default ReadinessPanel;

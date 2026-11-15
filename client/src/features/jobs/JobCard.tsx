import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Bookmark,
  Building2,
  Check,
  Clock,
  MapPin,
} from "lucide-react";
import type { Job } from "./types";
import { Badge, Button, Card } from "../../components/ui";

export interface JobCardProps {
  job: Job;
  resumeId?: string;
  resumeSkills?: string[];
  matchScore?: number | null;
  matchedSkills?: string[];
  missingSkills?: string[];
  isSaved?: boolean;
  isSelected?: boolean;
  onSelect: (job: Job) => void;
  onToggleSave?: (job: Job) => void;
}

const getCompanyInitials = (company: string): string => {
  const words = company
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "CO";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
};

const SOURCE_DISPLAY_LABEL: Record<string, string> = {
  GREENHOUSE: "Source: Greenhouse",
  LEVER: "Source: Lever",
  ASHBY: "Source: Ashby",
  LINKEDIN: "Source: LinkedIn",
  MANUAL: "Source: Verified Direct",
};

export const formatJobSourceLabel = (source?: string): string => {
  const key = (source || "GREENHOUSE").toUpperCase().trim();
  return SOURCE_DISPLAY_LABEL[key] ?? `Source: ${source || "Greenhouse"}`;
};

export const getJobFreshness = (
  job: Job,
): {
  state: "ACTIVE" | "POSSIBLY_STALE" | "CLOSED";
  label: string;
  tone: "success" | "warning" | "danger";
} => {
  if (job.isActive === false) {
    return { state: "CLOSED", label: "Closed", tone: "danger" };
  }
  const syncTime = job.lastSyncedAt ? new Date(job.lastSyncedAt).getTime() : 0;
  const ageHours = syncTime ? (Date.now() - syncTime) / (1000 * 60 * 60) : 0;

  if (ageHours > 72) {
    return {
      state: "POSSIBLY_STALE",
      label: "Possibly stale",
      tone: "warning",
    };
  }
  return { state: "ACTIVE", label: "Active", tone: "success" };
};

const getCompanyLogoUrl = (company: string): string => {
  const slug = company
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
  return slug
    ? `https://www.google.com/s2/favicons?domain=${slug}.com&sz=64`
    : "";
};

const formatShortDate = (iso?: string): string => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "—";
  }
};

export const JobCard: React.FC<JobCardProps> = ({
  job,
  resumeId,
  resumeSkills = [],
  matchScore: propMatchScore,
  matchedSkills: propMatchedSkills,
  missingSkills: propMissingSkills,
  isSaved = false,
  isSelected = false,
  onSelect,
  onToggleSave,
}) => {
  const navigate = useNavigate();
  const [logoFailed, setLogoFailed] = useState(false);
  const freshness = useMemo(() => getJobFreshness(job), [job]);
  const logoUrl = useMemo(() => getCompanyLogoUrl(job.company), [job.company]);

  const { computedScore, matched, missing } = useMemo(() => {
    const reqs = job.requirements ?? [];
    if (propMatchedSkills && propMissingSkills) {
      return {
        computedScore: propMatchScore ?? null,
        matched: propMatchedSkills,
        missing: propMissingSkills,
      };
    }

    if (reqs.length === 0 || resumeSkills.length === 0) {
      return {
        computedScore: propMatchScore ?? null,
        matched: [] as string[],
        missing: reqs,
      };
    }

    const normalizedResumeSet = new Set(
      resumeSkills.map((s) => s.toLowerCase().trim()),
    );

    const matchedList: string[] = [];
    const missingList: string[] = [];

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

      if (isHit) {
        matchedList.push(req);
      } else {
        missingList.push(req);
      }
    }

    const score =
      propMatchScore !== undefined
        ? propMatchScore
        : Math.round((matchedList.length / reqs.length) * 100);

    return {
      computedScore: score,
      matched: matchedList,
      missing: missingList,
    };
  }, [
    job.requirements,
    resumeSkills,
    propMatchScore,
    propMatchedSkills,
    propMissingSkills,
  ]);

  const isRemote = useMemo(
    () => /remote|anywhere|work from home|wfh/i.test(job.location ?? ""),
    [job.location],
  );

  return (
    <Card
      padding="md"
      interactive
      onClick={() => onSelect(job)}
      className={`flex flex-col justify-between gap-4 cursor-pointer ${
        isSelected ? "border-primary ring-1 ring-primary" : ""
      }`}
    >
      <div className="space-y-3">
        {/* Top Row: Company Initials + Title + Source Badge + Match Score */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-input border border-border bg-muted text-xs font-bold text-content-heading"
            >
              {logoUrl && !logoFailed ? (
                <img
                  src={logoUrl}
                  alt={`${job.company} logo`}
                  className="h-6 w-6 object-contain"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                getCompanyInitials(job.company)
              )}
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-content-body">
                  <Building2 className="h-3.5 w-3.5 text-content-secondary" />
                  {job.company}
                </span>
                <Badge tone="neutral" size="sm">
                  {formatJobSourceLabel(job.source)}
                </Badge>
                <Badge tone={freshness.tone} size="sm">
                  {freshness.label}
                </Badge>
                {job.duplicateSources && job.duplicateSources.length > 1 && (
                  <Badge tone="primary" size="sm">
                    Deduplicated ({job.duplicateSources.join(" + ")})
                  </Badge>
                )}
                {isRemote && (
                  <Badge tone="primary" size="sm">
                    Remote
                  </Badge>
                )}
              </div>

              <h3 className="text-base font-semibold leading-snug text-content-heading hover:text-primary">
                {job.title}
              </h3>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-content-secondary">
                {job.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {job.location}
                  </span>
                )}
                {job.salaryRange && (
                  <span className="font-medium text-content-body tabular-nums">
                    {job.salaryRange}
                  </span>
                )}
              </div>

              {/* Posted, Updated, and Last Synced Timestamps */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-[11px] text-content-secondary tabular-nums">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Posted {formatShortDate(job.createdAt)}
                </span>
                <span>·</span>
                <span>Updated {formatShortDate(job.updatedAt)}</span>
                <span>·</span>
                <span>Synced {formatShortDate(job.lastSyncedAt)}</span>
              </div>
            </div>
          </div>

          <div
            className="flex shrink-0 items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {computedScore !== null && (
              <Badge
                tone={
                  computedScore >= 75
                    ? "success"
                    : computedScore >= 50
                      ? "primary"
                      : "warning"
                }
              >
                {computedScore}% match
              </Badge>
            )}
            {onToggleSave && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleSave(job)}
                aria-label={isSaved ? "Unsave job" : "Save job"}
                aria-pressed={isSaved}
              >
                <Bookmark
                  className={`h-4 w-4 ${
                    isSaved ? "fill-primary text-primary" : ""
                  }`}
                />
              </Button>
            )}
          </div>
        </div>

        {/* Matched & Missing Skills Breakdown */}
        <div className="space-y-2 border-t border-border pt-3">
          {matched.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-status-success">
                Matched ({matched.length}):
              </span>
              {matched.slice(0, 4).map((skill) => (
                <Badge
                  key={skill}
                  tone="success"
                  size="sm"
                  icon={<Check className="h-3 w-3" />}
                >
                  {skill}
                </Badge>
              ))}
              {matched.length > 4 && (
                <Badge tone="neutral" size="sm">
                  +{matched.length - 4} more
                </Badge>
              )}
            </div>
          )}

          {missing.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-status-warning">
                {resumeSkills.length > 0
                  ? `Missing (${missing.length}):`
                  : `Required (${missing.length}):`}
              </span>
              {missing.slice(0, 4).map((skill) => (
                <Badge
                  key={skill}
                  tone={resumeSkills.length > 0 ? "warning" : "neutral"}
                  size="sm"
                >
                  {skill}
                </Badge>
              ))}
              {missing.length > 4 && (
                <Badge tone="neutral" size="sm">
                  +{missing.length - 4} more
                </Badge>
              )}
            </div>
          ) : (
            (job.requirements?.length ?? 0) === 0 && (
              <p className="text-xs text-content-secondary">
                Click View details to read the full role requirements.
              </p>
            )
          )}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onSelect(job)}>
            View details
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              navigate(
                `/matches/${job.id}${resumeId ? `?resumeId=${resumeId}` : ""}`,
              )
            }
            rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />}
          >
            Match resume
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-content-body transition hover:border-primary hover:text-primary"
            >
              <span>Direct link</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              navigate(
                `/skill-gaps/${job.id}${resumeId ? `?resumeId=${resumeId}` : ""}`,
              )
            }
          >
            Start interview
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default JobCard;

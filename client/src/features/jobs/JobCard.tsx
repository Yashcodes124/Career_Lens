import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { Job } from "./types";

interface JobCardProps {
  job: Job;
  resumeId?: string;
  isSelected: boolean;
  onSelect: (job: Job) => void;
}

const cleanSnippet = (raw: string): string => {
  if (!raw) return "";
  const textarea = document.createElement("textarea");
  textarea.innerHTML = raw;
  const decoded = textarea.value;
  const plain = decoded
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > 150 ? `${plain.slice(0, 150)}...` : plain;
};

const getCompanyInitials = (company: string): string => {
  const parts = company.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return company.slice(0, 2).toUpperCase();
};

export const JobCard: React.FC<JobCardProps> = ({
  job,
  resumeId,
  isSelected = false,
  onSelect,
}) => {
  const navigate = useNavigate();
  const snippet = useMemo(
    () => cleanSnippet(job.description),
    [job.description],
  );
  const topSkills = (job.requirements ?? []).slice(0, 4);

  return (
    <article
      onClick={() => onSelect(job)}
      className={`group relative flex flex-col justify-between rounded-xl border bg-white p-5 transition-all duration-150 cursor-pointer ${
        isSelected
          ? "border-blue-600 ring-2 ring-blue-500/15 shadow-sm"
          : "border-slate-200 hover:border-slate-300 shadow-xs"
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
              {getCompanyInitials(job.company || "TH")}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-xs font-semibold text-slate-700">
                  {job.company}
                </span>
                <span className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                  {job.source}
                </span>
              </div>
              <h3 className="mt-1 text-base font-semibold leading-snug text-slate-900 group-hover:text-blue-600">
                {job.title}
              </h3>
            </div>
          </div>

          {job.isActive !== false && (
            <span className="shrink-0 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              Active
            </span>
          )}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {job.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {job.location}
            </span>
          )}
          {job.salaryRange && (
            <>
              <span>·</span>
              <span className="font-medium text-slate-700">
                {job.salaryRange}
              </span>
            </>
          )}
        </div>

        {snippet && (
          <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-slate-600">
            {snippet}
          </p>
        )}

        {topSkills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {topSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700"
              >
                {skill}
              </span>
            ))}
            {(job.requirements?.length ?? 0) > 4 && (
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
                +{(job.requirements?.length ?? 0) - 4}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-xs font-medium text-slate-500">
          {job.requirements?.length
            ? `${job.requirements.length} requirements listed`
            : "View full description"}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(job);
            }}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            View details
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(
                `/matches/${job.id}${resumeId ? `?resumeId=${resumeId}` : ""}`,
              );
            }}
            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-xs transition hover:bg-blue-700"
          >
            <span>Match resume</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};

import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
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
  return plain.length > 165 ? `${plain.slice(0, 165)}...` : plain;
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

  return (
    <article
      onClick={() => onSelect(job)}
      className={`group relative w-full cursor-pointer rounded-xl border p-5 transition-all duration-150 ${
        isSelected
          ? "border-teal-500/60 bg-zinc-900/90 shadow-sm"
          : "border-zinc-800/80 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-400">
              {job.source}
            </span>
            <span className="text-zinc-700">·</span>
            <span className="truncate text-xs font-medium text-zinc-300">
              {job.company}
            </span>
          </div>
          <h3 className="mt-1.5 text-base font-semibold leading-snug tracking-tight text-zinc-100 group-hover:text-white">
            {job.title}
          </h3>
        </div>

        {job.isActive !== false && (
          <span className="shrink-0 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-300">
            Active
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
        {job.location && <span>{job.location}</span>}
        {job.salaryRange && (
          <>
            <span className="text-zinc-700">·</span>
            <span className="font-mono text-zinc-300">{job.salaryRange}</span>
          </>
        )}
      </div>

      {snippet && (
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-zinc-400">
          {snippet}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-zinc-800/80 pt-3">
        <span className="font-mono text-[11px] text-zinc-500">
          {job.requirements?.length
            ? `${job.requirements.length} extracted skills`
            : "Inspect posting"}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(
              `/matches/${job.id}${resumeId ? `?resumeId=${resumeId}` : ""}`,
            );
          }}
          className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-950 transition hover:bg-teal-400 active:scale-[0.98]"
        >
          <span>Match Resume</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
};

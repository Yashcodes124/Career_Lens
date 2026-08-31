import type { Job } from "./types";
import { useNavigate } from "react-router-dom";

interface JobCardProps {
  job: Job;
  resumeId?: string;
  isSelected: boolean;
  onSelect: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  resumeId,
  isSelected = false,
  onSelect,
}) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => onSelect(job)}
      className={`w-full cursor-pointer rounded-2xl border p-5 transition-all duration-200 ${
        isSelected
          ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
          : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
            {job.source}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-100">
            {job.title}
          </h3>
        </div>

        {job.isActive !== false && (
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
            Active
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-300">
        <span>{job.company}</span>
        {job.location && (
          <>
            <span className="text-slate-500">•</span>
            <span>{job.location}</span>
          </>
        )}
      </div>

      {job.salaryRange && (
        <p className="mt-3 text-sm text-slate-400">{job.salaryRange}</p>
      )}

      <p className="mt-4 line-clamp-3 text-sm text-slate-400">
        {job.description.replace(/<[^>]+>/g, " ").slice(0, 180)}
        {job.description.length > 180 ? "..." : ""}
      </p>

      {/* Action Footer */}
      <div className="mt-5 flex items-center justify-end border-t border-slate-800/80 pt-4">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // Prevents triggering onSelect when clicking the match button
            if (resumeId) {
              navigate(`/matches/${job.id}?resumeId=${resumeId}`);
            }
          }}
          disabled={!resumeId}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Match Resume
        </button>
      </div>
    </div>
  );
};

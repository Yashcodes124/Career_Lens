import type { Job } from "./types";

interface JobCardProps {
  job: Job;
  isSelected: boolean;
  onSelect: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  isSelected = false,
  onSelect,
}) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(job)}
      className={`w-full text-left rounded-2xl border p-5 transition-all duration-200 ${
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
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
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
    </button>
  );
};

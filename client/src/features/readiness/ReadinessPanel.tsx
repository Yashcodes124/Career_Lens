import { Link } from "react-router-dom";
import { NextAction } from "./readinessApi";
import { useReadiness } from "./useReadiness";

// Each next step names one place to go. Upload is handled by the form directly below.
const actionLink = (action: NextAction): { to: string; label: string } | null => {
  switch (action.type) {
    case "UPLOAD_RESUME":
      return null;
    case "PRACTICE_SKILL":
      return { to: "/jobs", label: "Find a job to practise for" };
    case "EXPLORE_JOBS":
      return { to: "/jobs", label: "Browse verified jobs" };
    case "START_INTERVIEW":
      return { to: "/jobs", label: "Pick a matched job" };
  }
};

export function ReadinessPanel() {
  const { data, isLoading, isError, refetch } = useReadiness();

  return (
    <section
      aria-labelledby="next-step-heading"
      className="rounded-2xl border border-gray-800 bg-gray-900 p-6"
    >
      <h2 id="next-step-heading" className="text-lg font-semibold text-white">
        Your next step
      </h2>

      {isLoading && <p className="mt-3 text-gray-400">Checking your progress...</p>}

      {isError && (
        <div role="alert" className="mt-3 flex flex-wrap items-center gap-3 text-red-400">
          <span>We could not load your next step.</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-lg border border-red-500/40 px-3 py-1.5 text-sm text-red-200 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            Try again
          </button>
        </div>
      )}

      {data && (
        <>
          <p className="mt-3 text-gray-300">{data.nextAction.reason}</p>
          {actionLink(data.nextAction) && (
            <Link
              to={actionLink(data.nextAction)!.to}
              className="mt-4 inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              {actionLink(data.nextAction)!.label}
            </Link>
          )}

          {data.skills.some((s) => s.status === "WEAK") && (
            <div className="mt-5">
              <p className="text-sm text-gray-400">Flagged in mock interviews</p>
              <ul className="mt-2 space-y-2">
                {data.skills
                  .filter((s) => s.status === "WEAK")
                  .map((s) => (
                    <li
                      key={s.skill}
                      className="flex items-center justify-between gap-4 rounded-xl border border-gray-800 bg-gray-950 p-3"
                    >
                      <span className="font-medium text-white">{s.skill}</span>
                      <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase text-red-400">
                        Weak
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

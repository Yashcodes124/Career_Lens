import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Navbar } from "../../components/NavBar";
import { useResumes } from "../resume/useResumes";
import { fetchTailoring, type TailoringSuggestions } from "./tailoringApi";

const PRIORITY_CLASSES = {
  high: "bg-red-500/10 text-red-400",
  medium: "bg-amber-500/10 text-amber-400",
  low: "bg-blue-500/10 text-blue-400",
} as const;

const CARD = "rounded-2xl border border-gray-800 bg-gray-900 p-6";

export const TailoringPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [searchParams] = useSearchParams();
  const { data: resumes, isLoading: resumesLoading } = useResumes();
  const resumeId = searchParams.get("resumeId") ?? resumes?.[0]?.id ?? null;

  const [data, setData] = useState<TailoringSuggestions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!jobId || !resumeId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchTailoring(resumeId, jobId)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setAccepted(new Set());
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load suggestions");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [jobId, resumeId, attempt]);

  const toggle = (skill: string) =>
    setAccepted((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill);
      else next.add(skill);
      return next;
    });

  // Only the original list and the suggestions the candidate accepted are ever exported.
  const exportList = data
    ? [...data.currentSkills, ...data.addToSkills.filter((s) => accepted.has(s.skill)).map((s) => s.skill)]
    : [];

  const copyList = async () => {
    try {
      await navigator.clipboard.writeText(exportList.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copying is not available in this browser. Use Download instead.");
    }
  };

  const downloadList = () => {
    const blob = new Blob([exportList.join("\n") + "\n"], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "skills-list.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  const noSuggestions = data && data.addToSkills.length === 0 && data.notOnResume.length === 0;

  return (
    <div className="min-h-screen bg-gray-950 text-slate-100">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              {data ? `Tailor your skills for ${data.jobTitle}` : "Tailor your skills"}
            </h1>
            <p className="mt-1 max-w-2xl text-pretty text-sm text-gray-400">
              Suggestions come from your resume text and the job posting. Nothing is added to your list
              unless you accept it.
            </p>
          </div>
          {jobId && resumeId && (
            <Link
              to={`/matches/${jobId}?resumeId=${resumeId}`}
              className="text-sm text-teal-400 hover:text-teal-300"
            >
              Back to match details
            </Link>
          )}
        </header>

        {resumesLoading && <p className="text-gray-400">Loading your resumes...</p>}

        {!resumesLoading && !resumeId && (
          <div className={CARD}>
            <p className="text-gray-400">Upload a resume before tailoring it to a job.</p>
            <Link to="/resume" className="mt-3 inline-block text-teal-400 hover:text-teal-300">
              Upload a resume
            </Link>
          </div>
        )}

        {loading && <p className="text-gray-400">Checking your resume against this job...</p>}

        {error && (
          <div role="alert" className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-400">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="mt-3 rounded-lg border border-red-500/40 px-3 py-1.5 text-sm text-red-200 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              Try again
            </button>
          </div>
        )}

        {data && !loading && (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className={CARD} aria-labelledby="current-heading">
              <h2 id="current-heading" className="text-lg font-semibold text-white">
                Your skills list today
              </h2>
              {data.currentSkills.length === 0 ? (
                <p className="mt-4 text-sm text-gray-400">Your resume has no skills listed yet.</p>
              ) : (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {data.currentSkills.map((skill) => (
                    <li key={skill} className="rounded-full border border-gray-700 bg-gray-950 px-3 py-1 text-sm text-slate-200">
                      {skill}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={CARD} aria-labelledby="suggested-heading">
              <h2 id="suggested-heading" className="text-lg font-semibold text-white">
                Add to your skills list
              </h2>

              {noSuggestions && (
                <p className="mt-4 text-sm text-gray-400">
                  Nothing to add. Your skills list already covers the skills this posting names.
                </p>
              )}

              {data.addToSkills.length > 0 && (
                <ul className="mt-4 space-y-3">
                  {data.addToSkills.map((item) => (
                    <li key={item.skill}>
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-800 bg-gray-950 p-4 hover:border-gray-700 focus-within:ring-2 focus-within:ring-teal-300">
                        <input
                          type="checkbox"
                          checked={accepted.has(item.skill)}
                          onChange={() => toggle(item.skill)}
                          className="mt-1 h-4 w-4 accent-teal-600"
                        />
                        <span>
                          <span className="font-medium text-white">{item.skill}</span>
                          <span className="mt-1 block text-xs text-gray-400">{item.evidence}</span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}

              {data.notOnResume.length > 0 && (
                <div className="mt-6 border-t border-gray-800 pt-5">
                  <h3 className="text-sm font-semibold text-white">Not on your resume</h3>
                  <p className="mt-1 text-pretty text-xs text-gray-400">
                    These skills do not appear in your resume text, so they are not suggested for your
                    list. If you have this experience, describe it in your experience section with a real
                    example.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {data.notOnResume.map((gap) => (
                      <li key={gap.skill} className="flex items-center justify-between gap-3 rounded-lg bg-gray-950 px-3 py-2">
                        <span className="text-sm text-slate-200">{gap.skill}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PRIORITY_CLASSES[gap.priority]}`}>
                          {gap.priority} priority
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-800 pt-5">
                <button
                  type="button"
                  onClick={copyList}
                  className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
                >
                  {copied ? "Copied" : "Copy skills list"}
                </button>
                <button
                  type="button"
                  onClick={downloadList}
                  className="rounded-xl border border-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
                >
                  Download .txt
                </button>
                <span className="self-center text-xs text-gray-400">
                  {exportList.length} skills in the list
                </span>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default TailoringPage;

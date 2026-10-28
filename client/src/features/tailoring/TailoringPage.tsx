import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Copy, Download } from "lucide-react";
import { Navbar } from "../../components/NavBar";
import { useResumes } from "../resume/useResumes";
import { fetchTailoring, type TailoringSuggestions } from "./tailoringApi";

const PRIORITY_CLASSES = {
  high: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  low: "border-sky-500/30 bg-sky-500/10 text-sky-300",
} as const;

const CARD = "rounded-xl border border-zinc-800 bg-zinc-900/40 p-6";

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
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load suggestions",
          );
        }
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

  const acceptAll = () => {
    if (!data) return;
    if (accepted.size === data.addToSkills.length) {
      setAccepted(new Set());
    } else {
      setAccepted(new Set(data.addToSkills.map((s) => s.skill)));
    }
  };

  const exportList = data
    ? [
        ...data.currentSkills,
        ...data.addToSkills
          .filter((s) => accepted.has(s.skill))
          .map((s) => s.skill),
      ]
    : [];

  const copyList = async () => {
    try {
      await navigator.clipboard.writeText(exportList.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(
        "Copying is not available in this browser. Use Download instead.",
      );
    }
  };

  const downloadList = () => {
    const blob = new Blob([exportList.join("\n") + "\n"], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "skills-list.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  const noSuggestions =
    data && data.addToSkills.length === 0 && data.notOnResume.length === 0;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-teal-400">
              Evidence-Bounded Tailoring
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {data
                ? `Tailor your skills for ${data.jobTitle}`
                : "Tailor your skills"}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-zinc-400">
              Suggestions come strictly from your existing resume text and the
              job posting. Nothing is fabricated or added unless you accept it.
            </p>
          </div>
          {jobId && resumeId && (
            <Link
              to={`/matches/${jobId}?resumeId=${resumeId}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-400 hover:text-teal-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to match details</span>
            </Link>
          )}
        </header>

        {resumesLoading && (
          <p className="font-mono text-xs text-zinc-400">
            Loading your resumes...
          </p>
        )}

        {!resumesLoading && !resumeId && (
          <div className={CARD}>
            <p className="text-sm text-zinc-400">
              Upload a resume before tailoring it to a job.
            </p>
            <Link
              to="/resume"
              className="mt-3 inline-block text-sm text-teal-400 hover:text-teal-300"
            >
              Upload a resume
            </Link>
          </div>
        )}

        {loading && (
          <p className="font-mono text-xs text-zinc-400">
            Checking your resume against this job...
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-500/30 bg-red-950/20 p-5 text-sm text-red-300"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="mt-3 rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/10"
            >
              Try again
            </button>
          </div>
        )}

        {data && !loading && (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className={CARD} aria-labelledby="current-heading">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                <h2
                  id="current-heading"
                  className="text-base font-semibold text-white"
                >
                  Your skills list today
                </h2>
                <span className="font-mono text-xs text-zinc-500 tabular-nums">
                  {data.currentSkills.length} VERIFIED
                </span>
              </div>

              {data.currentSkills.length === 0 ? (
                <p className="mt-4 text-sm text-zinc-400">
                  Your resume has no skills listed yet.
                </p>
              ) : (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {data.currentSkills.map((skill) => (
                    <li
                      key={skill}
                      className="rounded-md border border-zinc-800 bg-[#09090b] px-3 py-1 font-mono text-xs text-zinc-200"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={CARD} aria-labelledby="suggested-heading">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                <h2
                  id="suggested-heading"
                  className="text-base font-semibold text-white"
                >
                  Add to your skills list
                </h2>
                {data.addToSkills.length > 1 && (
                  <button
                    type="button"
                    onClick={acceptAll}
                    className="font-mono text-xs text-teal-400 hover:text-teal-300"
                  >
                    {accepted.size === data.addToSkills.length
                      ? "Clear selection"
                      : "Select all"}
                  </button>
                )}
              </div>

              {noSuggestions && (
                <p className="mt-4 text-sm text-zinc-400">
                  Nothing to add. Your skills list already covers the skills
                  this posting names.
                </p>
              )}

              {data.addToSkills.length > 0 && (
                <ul className="mt-4 space-y-2.5">
                  {data.addToSkills.map((item) => {
                    const isChecked = accepted.has(item.skill);
                    return (
                      <li key={item.skill}>
                        <label
                          className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition ${
                            isChecked
                              ? "border-teal-500/40 bg-teal-500/5"
                              : "border-zinc-800 bg-[#09090b] hover:border-zinc-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggle(item.skill)}
                            className="mt-0.5 h-4 w-4 accent-teal-500"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-white">
                              {item.skill}
                            </span>
                            <span className="mt-1 block text-xs leading-relaxed text-zinc-400">
                              {item.evidence}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}

              {data.notOnResume.length > 0 && (
                <div className="mt-6 border-t border-zinc-800 pt-5">
                  <h3 className="text-sm font-semibold text-white">
                    Not on your resume
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                    These skills do not appear in your resume text, so they are
                    not suggested for your list. If you have this experience,
                    describe it in your experience section with a real example.
                  </p>
                  <ul className="mt-3 divide-y divide-zinc-800/70 rounded-lg border border-zinc-800 bg-[#09090b] px-3.5">
                    {data.notOnResume.map((gap) => (
                      <li
                        key={gap.skill}
                        className="flex items-center justify-between gap-3 py-2.5"
                      >
                        <span className="text-xs font-medium text-zinc-200">
                          {gap.skill}
                        </span>
                        <span
                          className={`rounded border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase ${PRIORITY_CLASSES[gap.priority]}`}
                        >
                          {gap.priority} priority
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-zinc-800 pt-5">
                <button
                  type="button"
                  onClick={() => void copyList()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500 px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-teal-400 active:scale-[0.98]"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{copied ? "Copied" : "Copy skills list"}</span>
                </button>
                <button
                  type="button"
                  onClick={downloadList}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-200 transition hover:border-zinc-600 hover:text-white"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download .txt</span>
                </button>
                <span className="ml-auto font-mono text-xs text-zinc-400 tabular-nums">
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

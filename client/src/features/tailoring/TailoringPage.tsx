import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Copy, Download } from "lucide-react";
import { Navbar } from "../../components/NavBar";
import { useResumes } from "../resume/useResumes";
import { fetchTailoring, type TailoringSuggestions } from "./tailoringApi";

const PRIORITY_CLASSES = {
  high: "border-red-200 bg-red-50 text-red-700",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-blue-200 bg-blue-50 text-blue-700",
} as const;

const CARD = "rounded-xl border border-slate-200 bg-white p-6 shadow-sm";

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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Evidence-Based Resume Tailoring
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {data
                ? `Tailor your skills for ${data.jobTitle}`
                : "Tailor your skills"}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-600">
              Suggestions come strictly from your existing resume text and the
              job posting. Nothing is fabricated or added unless you confirm it.
            </p>
          </div>
          {jobId && resumeId && (
            <Link
              to={`/matches/${jobId}?resumeId=${resumeId}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-600"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to match details</span>
            </Link>
          )}
        </header>

        {resumesLoading && (
          <div className={CARD}>
            <p className="text-sm text-slate-600">Loading your resumes...</p>
          </div>
        )}

        {!resumesLoading && !resumeId && (
          <div className={CARD}>
            <p className="text-sm text-slate-600">
              Upload a resume before tailoring it to a job.
            </p>
            <Link
              to="/resume"
              className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
            >
              Upload a resume
            </Link>
          </div>
        )}

        {loading && (
          <div className={CARD}>
            <p className="text-sm text-slate-600">
              Checking your resume text against this job’s requirements...
            </p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
            >
              Try again
            </button>
          </div>
        )}

        {data && !loading && (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className={CARD} aria-labelledby="current-heading">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <h2
                  id="current-heading"
                  className="text-base font-semibold text-slate-900"
                >
                  Your Current Skills List
                </h2>
                <span className="text-xs font-medium text-slate-500 tabular-nums">
                  {data.currentSkills.length} extracted
                </span>
              </div>

              {data.currentSkills.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">
                  Your resume has no skills listed yet.
                </p>
              ) : (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {data.currentSkills.map((skill) => (
                    <li
                      key={skill}
                      className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-800"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={CARD} aria-labelledby="suggested-heading">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <h2
                  id="suggested-heading"
                  className="text-base font-semibold text-slate-900"
                >
                  Backed by Your Resume Text
                </h2>
                {data.addToSkills.length > 1 && (
                  <button
                    type="button"
                    onClick={acceptAll}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    {accepted.size === data.addToSkills.length
                      ? "Clear selection"
                      : "Select all"}
                  </button>
                )}
              </div>

              {noSuggestions && (
                <p className="mt-4 text-sm text-slate-600">
                  Your structured skills list already includes every requirement
                  mentioned in your resume text.
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
                              ? "border-blue-300 bg-blue-50/60"
                              : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggle(item.skill)}
                            className="mt-0.5 h-4 w-4 accent-blue-600"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-slate-900">
                              {item.skill}
                            </span>
                            <span className="mt-1 block text-xs leading-relaxed text-slate-600">
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
                <div className="mt-6 border-t border-slate-200 pt-5">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Not Found on Your Resume (Excluded)
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    These job requirements do not appear in your resume text, so
                    TrueHire will not fabricate them. If you have experience
                    with them, add a real project example to your resume.
                  </p>
                  <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-slate-50/60 px-3.5">
                    {data.notOnResume.map((gap) => (
                      <li
                        key={gap.skill}
                        className="flex items-center justify-between gap-3 py-2.5"
                      >
                        <span className="text-xs font-medium text-slate-800">
                          {gap.skill}
                        </span>
                        <span
                          className={`rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${PRIORITY_CLASSES[gap.priority]}`}
                        >
                          {gap.priority} priority
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={() => void copyList()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
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
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download .txt</span>
                </button>
                <span className="ml-auto text-xs font-medium text-slate-500 tabular-nums">
                  {exportList.length} skills in list
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

import React, { useState } from "react";
import { Navbar } from "../../components/NavBar";
import { ResumeParsedPreview } from "./ResumeParsedPreview";
import { ResumeUploader } from "./ResumeUploader";
import { useDeleteResume, useResumes } from "./useResumes";

export const ResumePage: React.FC = () => {
  const { data: resumes, isLoading, isError, error, refetch } = useResumes();
  const deleteResume = useDeleteResume();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const active =
    resumes?.find((resume) => resume.id === selectedId) ?? resumes?.[0];

  const handleDelete = (id: string) => {
    deleteResume.mutate(id, {
      onSuccess: () => {
        setConfirmingId(null);
        if (selectedId === id) setSelectedId(null);
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-8 border-b border-zinc-800/80 pb-6">
          <p className="font-mono text-xs uppercase tracking-wider text-teal-400">
            Candidate Profile Source
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Resume
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Job matches and skill gaps are computed deterministically from the
            active resume below.
          </p>
        </header>

        {isLoading && (
          <div
            className="space-y-4"
            aria-busy="true"
            aria-label="Loading resumes"
          >
            <div className="h-40 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/40" />
            <div className="h-64 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/40" />
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-red-800/60 bg-red-950/20 p-6">
            <p className="text-sm text-red-300">
              {error instanceof Error
                ? error.message
                : "Could not load your resumes."}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-3 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-500"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && resumes && resumes.length === 0 && (
          <div className="mx-auto max-w-xl space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-8">
            <h2 className="text-lg font-semibold text-white">
              Upload your resume
            </h2>
            <p className="text-sm text-zinc-400">
              TrueHire reads your skills and experience so it can compare them
              with each verified job.
            </p>
            <ResumeUploader />
          </div>
        )}

        {!isLoading && !isError && active && (
          <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800/80 pb-4">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-teal-400">
                    Active resume
                  </p>
                  <h2 className="mt-1 truncate text-lg font-semibold text-white">
                    {active.fileName ?? active.title}
                  </h2>
                  <p className="mt-1 font-mono text-xs text-zinc-400 tabular-nums">
                    Uploaded {new Date(active.createdAt).toLocaleDateString()} ·{" "}
                    {active.experienceYrs} yr experience ·{" "}
                    {active.skills.length} skills
                  </p>
                </div>

                {confirmingId === active.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(active.id)}
                      disabled={deleteResume.isPending}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                    >
                      {deleteResume.isPending ? "Deleting..." : "Delete resume"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(null)}
                      className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingId(active.id)}
                    className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-red-500/50 hover:text-red-300"
                  >
                    Delete
                  </button>
                )}
              </div>

              {deleteResume.isError && (
                <p role="alert" className="mb-4 text-sm text-red-400">
                  {deleteResume.error instanceof Error
                    ? deleteResume.error.message
                    : "Delete failed."}
                </p>
              )}

              <ResumeParsedPreview resume={active} />
            </section>

            <aside className="space-y-6">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
                <h2 className="mb-3 text-sm font-semibold text-zinc-100">
                  Upload a new version
                </h2>
                <ResumeUploader />
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-zinc-100">
                    All resumes
                  </h2>
                  <span className="font-mono text-xs text-zinc-500 tabular-nums">
                    {resumes?.length ?? 0}
                  </span>
                </div>
                <ul className="space-y-2">
                  {resumes?.map((resume) => {
                    const isSelected = resume.id === active.id;
                    return (
                      <li key={resume.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(resume.id)}
                          aria-pressed={isSelected}
                          className={`w-full rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors ${
                            isSelected
                              ? "border-teal-500/40 bg-teal-500/10 text-teal-200"
                              : "border-zinc-800/80 bg-[#09090b] text-zinc-300 hover:border-zinc-700"
                          }`}
                        >
                          <span className="block truncate font-medium">
                            {resume.fileName ?? resume.title}
                          </span>
                          <span className="mt-0.5 block font-mono text-[11px] text-zinc-400 tabular-nums">
                            {new Date(resume.createdAt).toLocaleDateString()} ·{" "}
                            {resume.skills.length} skills
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
};

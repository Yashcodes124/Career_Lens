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

  const active = resumes?.find((resume) => resume.id === selectedId) ?? resumes?.[0];

  const handleDelete = (id: string) => {
    deleteResume.mutate(id, {
      onSuccess: () => {
        setConfirmingId(null);
        if (selectedId === id) setSelectedId(null);
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-white">Resume</h1>
          <p className="mt-1 text-sm text-slate-400">
            Job matches and skill gaps are based on the active resume below.
          </p>

        </header>

        {isLoading && (
          <div className="space-y-4" aria-busy="true" aria-label="Loading resumes">
            <div className="h-40 animate-pulse rounded-2xl bg-slate-900" />
            <div className="h-64 animate-pulse rounded-2xl bg-slate-900" />
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-red-800/60 bg-red-950/30 p-6">
            <p className="text-sm text-red-300">
              {error instanceof Error ? error.message : "Could not load your resumes."}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-3 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-500"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && resumes && resumes.length === 0 && (
          <div className="mx-auto max-w-xl space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
            <h2 className="text-lg font-medium text-white">Upload your resume</h2>
            <p className="text-sm text-slate-400">
              TrueHire reads your skills and experience so it can compare them with each job.
            </p>
            <ResumeUploader />
          </div>
        )}

        {!isLoading && !isError && active && (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Active resume</p>
                  <h2 className="truncate text-lg font-medium text-white">
                    {active.fileName ?? active.title}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Uploaded {new Date(active.createdAt).toLocaleDateString()} ·{" "}
                    {active.experienceYrs} yr experience
                  </p>
                </div>

                {confirmingId === active.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(active.id)}
                      disabled={deleteResume.isPending}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
                    >
                      {deleteResume.isPending ? "Deleting..." : "Delete resume"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(null)}
                      className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingId(active.id)}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-red-500/50 hover:text-red-300"
                  >
                    Delete
                  </button>
                )}
              </div>

              {deleteResume.isError && (
                <p role="alert" className="mb-4 text-sm text-red-400">
                  {deleteResume.error instanceof Error ? deleteResume.error.message : "Delete failed."}
                </p>
              )}

              <ResumeParsedPreview resume={active} />
            </section>

            <aside className="space-y-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <h2 className="mb-3 text-sm font-semibold text-slate-200">Upload a new version</h2>
                <ResumeUploader />
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <h2 className="mb-3 text-sm font-semibold text-slate-200">All resumes</h2>
                <ul className="space-y-2">
                  {resumes?.map((resume) => (
                    <li key={resume.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(resume.id)}
                        aria-pressed={resume.id === active.id}
                        className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                          resume.id === active.id
                            ? "border-indigo-500/60 bg-indigo-500/10 text-indigo-200"
                            : "border-slate-800 text-slate-300 hover:border-slate-600"
                        }`}
                      >
                        <span className="block truncate">{resume.fileName ?? resume.title}</span>
                        <span className="text-xs text-slate-500">
                          {new Date(resume.createdAt).toLocaleDateString()} · {resume.skills.length} skills
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
};

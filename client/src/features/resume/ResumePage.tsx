import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, FileText, Trash2 } from "lucide-react";
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Resume Management
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Resumes
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Upload and manage the resumes used for job matching.
            </p>
          </div>
          {active && (
            <div className="flex flex-wrap gap-2.5">
              <Link
                to="/jobs"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
              >
                <span>Use for matching</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/readiness"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Confirm extracted skills
              </Link>
            </div>
          )}
        </header>

        {isLoading && (
          <div
            className="space-y-4"
            aria-busy="true"
            aria-label="Loading resumes"
          >
            <div className="h-40 animate-pulse rounded-xl border border-slate-200 bg-white" />
            <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white" />
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm text-red-800">
              {error instanceof Error
                ? error.message
                : "Could not load your resumes."}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && resumes && resumes.length === 0 && (
          <div className="mx-auto max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              No resumes yet
            </h2>
            <p className="text-sm text-slate-600">
              Upload your resume to get personalized job matches and interview
              preparation.
            </p>
            <div className="pt-2 text-left">
              <ResumeUploader />
            </div>
          </div>
        )}

        {!isLoading && !isError && active && (
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      Parsed
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      Active for job matching
                    </span>
                  </div>
                  <h2 className="mt-2 truncate text-lg font-semibold text-slate-900">
                    {active.fileName ?? active.title}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 tabular-nums">
                    Uploaded {new Date(active.createdAt).toLocaleDateString()} ·{" "}
                    {active.experienceYrs} yr experience ·{" "}
                    {active.skills.length} extracted skills
                  </p>
                </div>

                {confirmingId === active.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(active.id)}
                      disabled={deleteResume.isPending}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {deleteResume.isPending
                        ? "Deleting..."
                        : "Confirm delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(null)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingId(active.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>

              {deleteResume.isError && (
                <p role="alert" className="mb-4 text-sm text-red-600">
                  {deleteResume.error instanceof Error
                    ? deleteResume.error.message
                    : "Delete failed."}
                </p>
              )}

              <ResumeParsedPreview resume={active} />
            </section>

            <aside className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-1 text-sm font-semibold text-slate-900">
                  Upload resume
                </h2>
                <p className="mb-3 text-xs text-slate-500">
                  Upload a new PDF or DOCX to update your extracted skill
                  profile.
                </p>
                <ResumeUploader />
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Uploaded Resumes
                  </h2>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 tabular-nums">
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
                              ? "border-blue-300 bg-blue-50/70 text-blue-900"
                              : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="block truncate font-medium">
                              {resume.fileName ?? resume.title}
                            </span>
                            <span className="shrink-0 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                              Parsed
                            </span>
                          </div>
                          <span className="mt-1 block text-xs text-slate-500 tabular-nums">
                            {new Date(resume.createdAt).toLocaleDateString()} ·{" "}
                            {resume.skills.length} skills ·{" "}
                            {resume.experienceYrs} yr exp
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

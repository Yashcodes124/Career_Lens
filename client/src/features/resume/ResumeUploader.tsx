import React, { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileUp, Loader2 } from "lucide-react";
import { useUploadResume } from "./useResumes";
import { MAX_RESUME_MB, RESUME_ACCEPT, validateResumeFile } from "./resumeFile";

export const ResumeUploader: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const upload = useUploadResume();

  const startUpload = (file: File | undefined) => {
    if (!file) return;

    const problem = validateResumeFile(file);
    setClientError(problem);
    if (problem) return;

    upload.mutate(file);
  };

  const serverError = upload.isError
    ? upload.error instanceof Error
      ? upload.error.message
      : "Upload failed. Try again."
    : null;
  const errorMessage = clientError ?? serverError;
  const isBusy = upload.isPending;

  const borderClass = isDragging
    ? "border-blue-500 bg-blue-50/60"
    : errorMessage
      ? "border-red-300 bg-red-50/50"
      : "border-slate-300 bg-slate-50/60 hover:border-slate-400";

  return (
    <div className="space-y-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!isBusy) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          startUpload(event.dataTransfer.files[0]);
        }}
        className={`rounded-xl border border-dashed p-6 text-center transition ${borderClass}`}
      >
        {isBusy ? (
          <div className="flex flex-col items-center gap-2" role="status">
            <Loader2
              className="h-7 w-7 animate-spin text-blue-600"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-slate-900">
              Reading and analyzing your resume
            </p>
            <p className="text-xs text-slate-500">
              Extracting skills, experience, and project details...
            </p>
          </div>
        ) : upload.isSuccess && !errorMessage ? (
          <div className="flex flex-col items-center gap-2" role="status">
            <CheckCircle2
              className="h-7 w-7 text-emerald-600"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-slate-900">
              Extracted {upload.data.skills.length} skills from{" "}
              {upload.data.fileName ?? upload.data.title}
            </p>
            <p className="text-xs text-slate-500">
              Upload another file anytime to update your active resume.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {errorMessage ? (
              <AlertCircle
                className="h-7 w-7 text-red-600"
                aria-hidden="true"
              />
            ) : (
              <FileUp className="h-7 w-7 text-blue-600" aria-hidden="true" />
            )}
            <p className="text-sm font-medium text-slate-900">
              Drag and drop your PDF or DOCX resume here
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isBusy}
              className="mt-1 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
            >
              Choose file
            </button>
            <p className="text-xs text-slate-500">
              Maximum size {MAX_RESUME_MB} MB · Selectable text PDF or DOCX
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={RESUME_ACCEPT}
          aria-label="Upload resume"
          className="sr-only"
          disabled={isBusy}
          onChange={(event) => {
            startUpload(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>

      {errorMessage && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

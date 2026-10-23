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
    ? "border-indigo-400 bg-indigo-500/10"
    : errorMessage
      ? "border-red-700/60 bg-red-950/20"
      : "border-slate-700 bg-slate-950/50";

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
        className={`rounded-2xl border border-dashed p-6 text-center transition ${borderClass}`}
      >
        {isBusy ? (
          <div className="flex flex-col items-center gap-2" role="status">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-200">Reading your resume</p>
            <p className="text-xs text-slate-500">This usually takes under a minute.</p>
          </div>
        ) : upload.isSuccess && !errorMessage ? (
          <div className="flex flex-col items-center gap-2" role="status">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-200">
              Parsed {upload.data.skills.length} skills from {upload.data.fileName ?? upload.data.title}
            </p>
            <p className="text-xs text-slate-500">Upload another file to replace the active resume.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {errorMessage ? (
              <AlertCircle className="h-8 w-8 text-red-400" aria-hidden="true" />
            ) : (
              <FileUp className="h-8 w-8 text-indigo-400" aria-hidden="true" />
            )}
            <p className="text-sm font-medium text-slate-200">Drop a PDF or DOCX here</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isBusy}
              className="mt-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 transition hover:border-indigo-500/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:opacity-50"
            >
              Choose file
            </button>
            <p className="text-xs text-slate-500">
              Up to {MAX_RESUME_MB} MB. Use a file with selectable text, not a scan.
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
        <p role="alert" className="text-sm text-red-400">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

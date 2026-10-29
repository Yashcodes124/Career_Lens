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
    ? "border-teal-400 bg-teal-500/10"
    : errorMessage
      ? "border-red-700/60 bg-red-950/20"
      : "border-zinc-800 bg-[#09090b]/60 hover:border-zinc-700";

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
              className="h-7 w-7 animate-spin text-teal-400"
              aria-hidden="true"
            />
            <p className="text-xs font-medium text-zinc-200">
              Reading your resume
            </p>
            <p className="text-[11px] text-zinc-400">
              This usually takes under a minute.
            </p>
          </div>
        ) : upload.isSuccess && !errorMessage ? (
          <div className="flex flex-col items-center gap-2" role="status">
            <CheckCircle2
              className="h-7 w-7 text-emerald-400"
              aria-hidden="true"
            />
            <p className="text-xs font-medium text-zinc-200">
              Parsed {upload.data.skills.length} skills from{" "}
              {upload.data.fileName ?? upload.data.title}
            </p>
            <p className="text-[11px] text-zinc-400">
              Upload another file to replace the active resume.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {errorMessage ? (
              <AlertCircle
                className="h-7 w-7 text-red-400"
                aria-hidden="true"
              />
            ) : (
              <FileUp className="h-7 w-7 text-teal-400" aria-hidden="true" />
            )}
            <p className="text-xs font-medium text-zinc-200">
              Drop a PDF or DOCX here
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isBusy}
              className="mt-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-teal-500/50 hover:text-white disabled:opacity-50"
            >
              Choose file
            </button>
            <p className="text-[11px] text-zinc-500">
              Up to {MAX_RESUME_MB} MB. Use a file with selectable text, not a
              scan.
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
        <p role="alert" className="text-xs text-red-400">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

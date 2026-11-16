import React, { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Upload, ClipboardPaste } from "lucide-react";
import { uploadResume } from "./resumeApi";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  ProgressBar,
  Skeleton,
  Input,
  Textarea,
  Toast,
} from "../../components/ui";
import { pasteResume } from "./resumeApi";

export interface ResumeUploaderProps {
  onUploadSuccess?: (resumeData?: unknown) => void;
  compact?: boolean;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ResumeUploader: React.FC<ResumeUploaderProps> = ({
  onUploadSuccess,
  compact = false,
}) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadStage, setUploadStage] = useState<
    "IDLE" | "UPLOADING" | "PARSING" | "SUCCESS"
  >("IDLE");
  const [progress, setProgress] = useState<number>(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPasteFallback, setShowPasteFallback] = useState(false);
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [isPasting, setIsPasting] = useState(false);

  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPasting || pasteText.trim().length < 40) {
      setError("Please paste at least 40 characters of your resume text.");
      return;
    }
    try {
      setIsPasting(true);
      setError(null);
      const resume = await pasteResume({
        title: pasteTitle.trim() || "Pasted_Resume.txt",
        rawText: pasteText,
      });
      setPasteTitle("");
      setPasteText("");
      setShowPasteFallback(false);
      setSuccessMessage(
        `Recovered and parsed ${resume.fileName || resume.title} (${resume.skills?.length ?? 0} skills extracted).`,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["resumes"] }),
        queryClient.invalidateQueries({ queryKey: ["readiness"] }),
      ]);
      onUploadSuccess?.(resume);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not analyze pasted resume text.",
      );
    } finally {
      setIsPasting(false);
    }
  };

  const validateFile = (file: File): string | null => {
    const validExtension = /\.(pdf|docx)$/i.test(file.name);
    if (!validExtension) {
      return "Unsupported file format. Please upload a PDF or DOCX resume.";
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return "File exceeds the 5 MB size limit. Please upload a smaller PDF or DOCX file.";
    }
    return null;
  };

  const processUpload = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSuccessMessage(null);
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setSelectedFile(file);
    setUploadStage("UPLOADING");
    setProgress(35);

    try {
      const progressTimer = window.setTimeout(() => {
        setUploadStage("PARSING");
        setProgress(75);
      }, 350);

      const resume = await uploadResume(file);
      window.clearTimeout(progressTimer);

      setProgress(100);
      setUploadStage("SUCCESS");

      const skillsCount = Array.isArray(resume?.skills)
        ? resume.skills.length
        : null;

      setSuccessMessage(
        skillsCount !== null
          ? `Parsed ${file.name} and extracted ${skillsCount} skills.`
          : `Successfully uploaded and parsed ${file.name}.`,
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["resumes"] }),
        queryClient.invalidateQueries({ queryKey: ["readiness"] }),
      ]);

      onUploadSuccess?.(resume);
    } catch (err: unknown) {
      setUploadStage("IDLE");
      setProgress(0);
      setError(
        err instanceof Error
          ? err.message
          : "Could not upload and parse this resume. Please try again.",
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void processUpload(file);
    }
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processUpload(file);
    }
  };

  const isBusy = uploadStage === "UPLOADING" || uploadStage === "PARSING";

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileChange}
        className="sr-only"
        aria-label="Upload resume file"
      />

      {error && (
        <ErrorState
          title="Resume upload failed"
          message={error}
          onRetry={() => fileInputRef.current?.click()}
        />
      )}

      {successMessage && !isBusy && (
        <Toast
          tone="success"
          title="Resume ready for matching"
          description={successMessage}
          onDismiss={() => setSuccessMessage(null)}
        />
      )}

      <Card
        muted={!isDragging}
        padding={compact ? "sm" : "md"}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`transition-colors ${
          isDragging ? "border-primary bg-primary-soft/50" : "border-dashed"
        }`}
      >
        {isBusy ? (
          <div className="space-y-3 py-2" aria-live="polite" aria-busy="true">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-content-heading">
                <FileText className="h-4 w-4 text-primary" />
                <span>
                  {uploadStage === "UPLOADING"
                    ? `Uploading ${selectedFile?.name ?? "resume"}...`
                    : `Extracting skills and sections from ${selectedFile?.name ?? "resume"}...`}
                </span>
              </div>
              <Badge tone="primary" size="sm">
                {uploadStage === "UPLOADING" ? "Uploading" : "Parsing"}
              </Badge>
            </div>

            <ProgressBar value={progress} tone="primary" showValue />

            <div className="grid grid-cols-3 gap-2 pt-1">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input border border-border bg-surface text-primary">
                <Upload className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-content-heading">
                  Drop your resume here, or browse files
                </p>
                <p className="text-xs text-content-secondary">
                  Supports PDF and DOCX up to 5 MB. Extracts technical skills,
                  experience, projects, and raw text.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setError(null);
                  setShowPasteFallback((v) => !v);
                }}
                leftIcon={<ClipboardPaste className="h-4 w-4" />}
              >
                {showPasteFallback
                  ? "Hide paste fallback"
                  : "Paste resume text"}
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<Upload className="h-4 w-4" />}
              >
                Upload resume
              </Button>
            </div>
          </div>
        )}
      </Card>
      {showPasteFallback && (
        <Card padding="md" className="space-y-4 border-primary/40">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Manual Recovery Fallback
            </p>
            <h3 className="text-sm font-semibold text-content-heading">
              Paste Resume Text Directly
            </h3>
            <p className="text-xs text-content-secondary">
              Use this if your PDF is scanned, uses complex multi-column tables,
              or if AI extraction failed. TrueHire will extract your sections
              with a deterministic skill fallback so your resume never fails to
              save.
            </p>
          </div>

          <form onSubmit={handlePasteSubmit} className="space-y-3">
            <Input
              label="Resume version title"
              placeholder="e.g., Full_Stack_Resume_2026"
              value={pasteTitle}
              onChange={(e) => setPasteTitle(e.target.value)}
            />
            <Textarea
              label="Full resume text *"
              rows={7}
              placeholder="Paste your summary, skills, work experience, projects, and education text here..."
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
            />
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-xs text-content-secondary tabular-nums">
                {pasteText.trim().length} characters (min 40)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPasteFallback(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={isPasting}
                >
                  Analyze & save pasted resume
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};

export default ResumeUploader;

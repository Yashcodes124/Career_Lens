import React, { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Upload } from "lucide-react";
import { apiClient } from "../../lib/api-client";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  ProgressBar,
  Skeleton,
  Toast,
} from "../../components/ui";

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
      const formData = new FormData();
      formData.append("resume", file);

      const progressTimer = window.setTimeout(() => {
        setUploadStage("PARSING");
        setProgress(75);
      }, 350);

      const response = await apiClient.post("/resumes/upload", formData);
      window.clearTimeout(progressTimer);

      setProgress(100);
      setUploadStage("SUCCESS");

      const payload =
        (response as { data?: { data?: unknown } })?.data?.data ??
        (response as { data?: unknown })?.data ??
        response;

      const skillsCount = Array.isArray(
        (payload as { skills?: unknown[]; parsedSkills?: unknown[] })?.skills,
      )
        ? (payload as { skills: unknown[] }).skills.length
        : Array.isArray((payload as { parsedSkills?: unknown[] })?.parsedSkills)
          ? (payload as { parsedSkills: unknown[] }).parsedSkills.length
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

      onUploadSuccess?.(payload);
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

            <Button
              variant="primary"
              size="md"
              onClick={() => fileInputRef.current?.click()}
              leftIcon={<Upload className="h-4 w-4" />}
            >
              Upload resume
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ResumeUploader;

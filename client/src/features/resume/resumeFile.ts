// Mirrors the server limits in server/src/middleware/uploadMiddleware.ts.
// The server still checks everything; this only gives faster, clearer feedback.
export const MAX_RESUME_MB = 5;
export const MAX_RESUME_BYTES = MAX_RESUME_MB * 1024 * 1024;

export const RESUME_ACCEPT =
  ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// Returns a message for the user, or null when the file can be uploaded.
export const validateResumeFile = (file: { name: string; size: number }): string | null => {
  const name = file.name.toLowerCase();
  if (!name.endsWith(".pdf") && !name.endsWith(".docx")) {
    return "Choose a PDF or DOCX file.";
  }
  if (file.size === 0) {
    return "This file is empty. Choose a different resume.";
  }
  if (file.size > MAX_RESUME_BYTES) {
    return `This file is larger than ${MAX_RESUME_MB} MB. Export a smaller PDF and try again.`;
  }
  return null;
};

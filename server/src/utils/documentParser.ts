import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import path from "path";
import { AppError } from "./appError";

export const RESUME_MIME_TYPES = {
  pdf: "application/pdf",
  docx:
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;

export type ResumeFormat = keyof typeof RESUME_MIME_TYPES;

// The extension decides the format. Returns null for anything we do not accept.
export const getResumeFormat = (fileName: string): ResumeFormat | null => {
  const extension = path.extname(fileName).toLowerCase();
  if (extension === ".pdf") return "pdf";
  if (extension === ".docx") return "docx";
  return null;
};

// Checks the first bytes, so a renamed file cannot pass as a PDF or DOCX.
// PDF starts with "%PDF-". DOCX is a ZIP archive, which starts with "PK\x03\x04".
export const hasValidSignature = (buffer: Buffer, format: ResumeFormat): boolean => {
  if (format === "pdf") {
    return buffer.subarray(0, 5).toString("latin1") === "%PDF-";
  }
  return buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
};

export const extractTextFromDocument = async (
  buffer: Buffer,
  fileName: string,
): Promise<string> => {
  const format = getResumeFormat(fileName);
  if (!format) {
    throw new AppError(400, "Only PDF and DOCX files are allowed", "UNSUPPORTED_FILE_TYPE");
  }

  if (!hasValidSignature(buffer, format)) {
    throw new AppError(
      400,
      "The file contents do not match its extension. Upload the original PDF or DOCX.",
      "INVALID_FILE_CONTENT",
    );
  }

  try {
    if (format === "pdf") {
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        return result.text.trim();
      } finally {
        await parser.destroy();
      }
    }

    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  } catch {
    throw new AppError(
      422,
      "This file could not be read. Check that it is not corrupted or password-protected.",
      "UNREADABLE_FILE",
    );
  }
};

import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { AppError } from "../utils/appError";
import { getResumeFormat } from "../utils/documentParser";

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // Some browsers and operating systems send this for PDF and DOCX files.
  // The extension and the file signature still decide what is accepted.
  "application/octet-stream",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RESUME_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    const formatAllowed = getResumeFormat(file.originalname) !== null;
    const mimeAllowed = ALLOWED_MIME_TYPES.has(file.mimetype);

    if (formatAllowed && mimeAllowed) {
      cb(null, true);
      return;
    }
    cb(
      new AppError(400, "Only PDF and DOCX files are allowed", "UNSUPPORTED_FILE_TYPE"),
    );
  },
});

// Wraps multer so its errors reach the global error handler as AppError,
// giving the client the same JSON shape as every other failure.
export const uploadResumeFile = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  upload.single("resume")(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        next(new AppError(413, "Resume must be 5 MB or smaller", "FILE_TOO_LARGE"));
        return;
      }
      if (error.code === "LIMIT_UNEXPECTED_FILE") {
        next(
          new AppError(400, 'Upload the file in the "resume" field', "UNEXPECTED_FIELD"),
        );
        return;
      }
      next(new AppError(400, error.message, "UPLOAD_ERROR"));
      return;
    }

    next(error);
  });
};

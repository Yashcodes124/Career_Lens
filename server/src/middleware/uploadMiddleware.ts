import multer from "multer";

const storage = multer.memoryStorage(); //we haven't decided on persistent file storage yet.

export const uploadResume = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const isAllowedMimeType = allowedTypes.includes(file.mimetype);

    const isAllowedExtension =
      file.originalname.toLowerCase().endsWith(".pdf") ||
      file.originalname.toLowerCase().endsWith(".docx");

    if (isAllowedMimeType || isAllowedExtension) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and DOCX files are allowed"));
    }
  },
});

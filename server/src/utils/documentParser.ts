import {PDFParse} from "pdf-parse";
import mammoth from "mammoth";
import path from "path";

export const extractTextFromDocument = async (
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<string> => {
  const extension = path.extname(fileName).toLowerCase();

  const isPdf = mimeType === "application/pdf" || extension === ".pdf";

  const isDocx =
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === ".docx";

  if (isPdf) {
    const parser = new PDFParse({ data: buffer });
   
  try {
    const result = await parser.getText();
    return result.text.trim();
  } finally {
    await parser.destroy();
  }
  }

  if (isDocx) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  throw new Error("Unsupported document type");
};

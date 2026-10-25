// Parses the job list query string into safe, bounded values.
export interface JobQuery {
  q?: string;
  location?: string;
  source?: string;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;
const MAX_TEXT_LENGTH = 100;

const toPositiveInt = (value: unknown, fallback: number): number => {
  const parsed = parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const cleanText = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, MAX_TEXT_LENGTH);
  return trimmed.length > 0 ? trimmed : undefined;
};

export const parseJobQuery = (query: Record<string, unknown>): JobQuery => {
  const source = cleanText(query.source);
  return {
    q: cleanText(query.q),
    location: cleanText(query.location),
    source: source?.toUpperCase(),
    page: toPositiveInt(query.page, 1),
    pageSize: Math.min(toPositiveInt(query.pageSize, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE),
  };
};

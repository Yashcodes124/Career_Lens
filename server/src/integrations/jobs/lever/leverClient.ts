import { LeverJob, leverJobsResponseSchema } from "./leverSchema";

const LEVER_BASE_URL = "https://api.lever.co/v0/postings";

export const fetchLeverJobs = async (
  siteToken: string,
): Promise<LeverJob[]> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(`${LEVER_BASE_URL}/${siteToken}?mode=json`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Lever API request failed for ${siteToken}: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return leverJobsResponseSchema.parse(data);
  } finally {
    clearTimeout(timeout);
  }
};

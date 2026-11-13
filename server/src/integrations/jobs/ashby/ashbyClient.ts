import { AshbyJobsResponse, ashbyJobsResponseSchema } from "./ashbySchema";

const ASHBY_BASE_URL = "https://api.ashbyhq.com/posting-api/job-board";

export const fetchAshbyJobs = async (
  boardName: string,
): Promise<AshbyJobsResponse> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(
      `${ASHBY_BASE_URL}/${boardName}?includeCompensation=true`,
      { signal: controller.signal },
    );

    if (!response.ok) {
      throw new Error(
        `Ashby API request failed for ${boardName}: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return ashbyJobsResponseSchema.parse(data);
  } finally {
    clearTimeout(timeout);
  }
};

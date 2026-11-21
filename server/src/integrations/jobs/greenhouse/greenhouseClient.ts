//src\integrations\jobs\greenhouse\greenhouseClient.ts

import {
  GreenhouseJobsResponse,
  greenhouseJobsResponseSchema,
} from "./greenhouseSchema";
import { AppError } from "../../../utils/appError";

// Greenhouse public job boards API
const GREENHOUSE_BASE_URL = "https://boards-api.greenhouse.io/v1/boards";
const BOARD_TOKEN_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/i;
const REQUEST_TIMEOUT_MS = 12_000;

export const isValidGreenhouseBoardToken = (token: string): boolean =>
  BOARD_TOKEN_PATTERN.test(token.trim());

export const fetchGreenhouseJobs = async (
  boardToken: string,
): Promise<GreenhouseJobsResponse> => {
  const cleanedToken = boardToken.trim();
  if (!isValidGreenhouseBoardToken(cleanedToken)) {
    throw new AppError(
      400,
      "Invalid Greenhouse board token. Use only letters, numbers, hyphens, or underscores.",
      "INVALID_BOARD_TOKEN",
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${GREENHOUSE_BASE_URL}/${encodeURIComponent(cleanedToken)}/jobs?content=true`,
      { signal: controller.signal },
    );

    if (!response.ok) {
      throw new Error(
        `Greenhouse API request failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    // Validated response payload
    return greenhouseJobsResponseSchema.parse(data);
  } finally {
    clearTimeout(timeout);
  }
};

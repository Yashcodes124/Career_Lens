//src\integrations\jobs\greenhouse\greenhouseClient.ts

import {
  GreenhouseJobsResponse,
  greenhouseJobsResponseSchema,
} from "./greenhouseSchema";

//Green house Client
const GREENHOUSE_BASE_URL = "https://boards-api.greenhouse.io/v1/boards";

export const fetchGreenhouseJobs = async (
  boardToken: string,
): Promise<GreenhouseJobsResponse> => {
  const response = await fetch(
    `${GREENHOUSE_BASE_URL}/${boardToken}/jobs?content=true`,
  );

  if (!response.ok) {
    throw new Error(
      `Greenhouse API request failed: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();

  //validated data
  return greenhouseJobsResponseSchema.parse(data);
};

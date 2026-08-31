// client / src / features / matching / matchingApi.ts;

import { MatchResponse } from "./types";
import { apiClient } from "@/lib/api-client";

interface MatchRequest {
  resumeId: string;
  jobId: string;
}

export const calculateJobMatch = async (
  data: MatchRequest,
): Promise<MatchResponse> => {
  const response = await apiClient<MatchResponse>("/matches", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return response;
};

import { apiRequest } from "./api.js";

export async function completeInterviewViaApi(params: {
  token: string;
  applicationId: string;
  answerTag?: string;
}) {
  const created = await apiRequest<{ data: { id: string } }>("/interviews", {
    method: "POST",
    token: params.token,
    body: {
      applicationId: params.applicationId,
      durationMinutes: 15,
      difficulty: "MEDIUM",
      focusTopics: ["docker", "postgresql"],
    },
  });
  const interviewId = created.data.data.id;

  const started = await apiRequest<{
    data: { interview: { questions: Array<{ id: string; order: number }> } };
  }>(`/interviews/${interviewId}/start`, {
    method: "POST",
    token: params.token,
  });

  const questions = started.data.data.interview.questions;
  for (const q of questions) {
    await apiRequest(`/interviews/${interviewId}/questions/${q.id}/answer`, {
      method: "POST",
      token: params.token,
      body: {
        answer: `${params.answerTag ?? "E2E_STRONG"} Detailed architectural explanation using Docker multi-stage builds, PostgreSQL indexing, and p95 latency monitoring.`,
      },
    });
  }

  const evalRes = await apiRequest(`/interviews/${interviewId}/evaluation`, {
    method: "POST",
    token: params.token,
  });

  return { interviewId, evaluationStatus: evalRes.status };
}

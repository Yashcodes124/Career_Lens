import { describe, expect, it, vi, beforeEach } from "vitest";

const m = vi.hoisted(() => ({
  prisma: {
    application: { findFirst: vi.fn() },
    resume: { findFirst: vi.fn() },
    interview: { findUnique: vi.fn() },
  },
  repo: {
    createInterviewWithQuestions: vi.fn(),
    getInterviewSessionById: vi.fn(),
    updateInterviewStatus: vi.fn(),
    getQuestionById: vi.fn(),
    saveAnswer: vi.fn(),
    saveQuestionAnswerAndFeedback: vi.fn(),
    countUnfinishedQuestions: vi.fn(),
    getFirstUnfinishedQuestion: vi.fn(),
    getEvaluationByInterviewId: vi.fn(),
    saveFinalEvaluation: vi.fn(),
  },
  saveEvaluationWithSkillEvidence: vi.fn(),
  analyzeResume: vi.fn(),
  evaluateQuestionAnswer: vi.fn(),
}));

vi.mock("../config/db", () => ({ prisma: m.prisma }));
vi.mock("../repositories/interviewRepository", () => m.repo);
vi.mock("../repositories/skillRepository", () => ({ saveEvaluationWithSkillEvidence: m.saveEvaluationWithSkillEvidence }));
vi.mock("../integrations/ai/aiClient", () => ({ analyzeResume: m.analyzeResume }));
vi.mock("../modules/interview/interview.ai", () => ({ evaluateQuestionAnswer: m.evaluateQuestionAnswer }));

import { submitAnswerService, createInterviewService, generateFinalEvaluationService } from "../services/interviewService";

const question = (order: number, overrides: Partial<{ id: string; answer: string | null; feedback: string | null }> = {}) => ({
  id: `q${order}`,
  order,
  round: "Technical",
  question: `Question ${order}?`,
  answer: null,
  feedback: null,
  score: null,
  ...overrides,
});

const interviewWith = (questions: ReturnType<typeof question>[], status = "IN_PROGRESS") => ({
  id: "i1",
  userId: "u1",
  title: "Engineer at Acme",
  status,
  questions,
  evaluation: null,
  application: { matchScore: null, skillGaps: [], job: { title: "Engineer", company: "Acme", description: "", location: null, requirements: [] } },
});

describe("submitAnswerService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.repo.saveQuestionAnswerAndFeedback.mockResolvedValue({ id: "q1" });
    m.repo.countUnfinishedQuestions.mockResolvedValue(0);
    m.evaluateQuestionAnswer.mockResolvedValue({ score: 80, feedback: "ok" });
  });

  it("saves the answer before calling the evaluator", async () => {
    const q1 = question(1);
    m.repo.getInterviewSessionById.mockResolvedValue(interviewWith([q1, question(2)]));
    m.repo.getQuestionById.mockResolvedValue(q1);
    const order: string[] = [];
    m.repo.saveAnswer.mockImplementation(async () => order.push("save"));
    m.evaluateQuestionAnswer.mockImplementation(async () => {
      order.push("evaluate");
      return { score: 70, feedback: "fine" };
    });

    await submitAnswerService("i1", "q1", "u1", "my answer");

    expect(order).toEqual(["save", "evaluate"]);
  });

  it("keeps the answer and asks for a retry when evaluation fails", async () => {
    const q1 = question(1);
    m.repo.getInterviewSessionById.mockResolvedValue(interviewWith([q1]));
    m.repo.getQuestionById.mockResolvedValue(q1);
    m.evaluateQuestionAnswer.mockRejectedValue(new Error("provider down"));

    await expect(submitAnswerService("i1", "q1", "u1", "my answer")).rejects.toMatchObject({
      status: 503,
      code: "EVALUATION_PENDING",
    });
    expect(m.repo.saveAnswer).toHaveBeenCalledWith("q1", "my answer");
    expect(m.repo.saveQuestionAnswerAndFeedback).not.toHaveBeenCalled();
  });

  it("allows the retry of a pending answer, because it has no feedback yet", async () => {
    const q1 = question(1, { answer: "my answer", feedback: null });
    m.repo.getInterviewSessionById.mockResolvedValue(interviewWith([q1]));
    m.repo.getQuestionById.mockResolvedValue(q1);

    await expect(submitAnswerService("i1", "q1", "u1", "my answer")).resolves.toMatchObject({ completed: true });
    expect(m.evaluateQuestionAnswer).toHaveBeenCalled();
  });

  it("refuses to re-answer a question that already has feedback", async () => {
    const q1 = question(1, { answer: "old", feedback: '{"score":60}' });
    m.repo.getInterviewSessionById.mockResolvedValue(interviewWith([q1, question(2)]));
    m.repo.getQuestionById.mockResolvedValue(q1);

    await expect(submitAnswerService("i1", "q1", "u1", "new")).rejects.toMatchObject({
      status: 409,
      code: "ALREADY_ANSWERED",
    });
    expect(m.repo.saveAnswer).not.toHaveBeenCalled();
  });

  it("refuses to skip ahead: question 2 cannot be answered while question 1 is open", async () => {
    const q1 = question(1);
    const q2 = question(2);
    m.repo.getInterviewSessionById.mockResolvedValue(interviewWith([q1, q2]));
    m.repo.getQuestionById.mockResolvedValue(q2);

    await expect(submitAnswerService("i1", "q2", "u1", "answer")).rejects.toMatchObject({
      status: 409,
      code: "OUT_OF_ORDER",
    });
    expect(m.evaluateQuestionAnswer).not.toHaveBeenCalled();
  });

  it("completes only when every question has feedback", async () => {
    const q1 = question(1);
    m.repo.getInterviewSessionById.mockResolvedValue(interviewWith([q1, question(2)]));
    m.repo.getQuestionById.mockResolvedValue(q1);
    m.repo.countUnfinishedQuestions.mockResolvedValue(1);
    m.repo.getFirstUnfinishedQuestion.mockResolvedValue(question(2));

    const result = await submitAnswerService("i1", "q1", "u1", "answer");

    expect(result.completed).toBe(false);
    expect(m.repo.updateInterviewStatus).not.toHaveBeenCalled();
    expect(result.nextQuestion?.order).toBe(2);
  });

  it("marks the interview COMPLETED after the last answer", async () => {
    const q1 = question(1, { answer: "a", feedback: '{"score":80}' });
    const q2 = question(2);
    m.repo.getInterviewSessionById.mockResolvedValue(interviewWith([q1, q2]));
    m.repo.getQuestionById.mockResolvedValue(q2);
    m.repo.countUnfinishedQuestions.mockResolvedValue(0);

    const result = await submitAnswerService("i1", "q2", "u1", "answer");

    expect(result.completed).toBe(true);
    expect(m.repo.updateInterviewStatus).toHaveBeenCalledWith("i1", "u1", "COMPLETED");
  });
});

describe("createInterviewService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.prisma.application.findFirst.mockResolvedValue({
      id: "a1", matchScore: null, skillGaps: [],
      job: { title: "Engineer", company: "Acme", description: "d", location: null, requirements: [] },
    });
    m.prisma.resume.findFirst.mockResolvedValue({ id: "r1", rawText: "text", skills: ["React"], experienceYrs: 2 });
  });

  it("writes nothing when the AI plan fails", async () => {
    m.analyzeResume.mockRejectedValue(Object.assign(new Error("down"), { status: 503, code: "AI_UNAVAILABLE" }));

    await expect(createInterviewService("u1", "a1")).rejects.toMatchObject({ code: "AI_UNAVAILABLE" });
    expect(m.repo.createInterviewWithQuestions).not.toHaveBeenCalled();
  });

  it("sends 'not available' to the model when there is no match score, never 0", async () => {
    m.analyzeResume.mockRejectedValue(new Error("stop after prompt"));

    await createInterviewService("u1", "a1").catch(() => undefined);

    const prompt = m.analyzeResume.mock.calls[0][0] as string;
    expect(prompt).toContain("not available");
    expect(prompt).not.toContain("Match Score: 0/100");
  });

  it("requires a resume with a clear 400 error", async () => {
    m.prisma.resume.findFirst.mockResolvedValue(null);

    await expect(createInterviewService("u1", "a1")).rejects.toMatchObject({
      status: 400,
      code: "RESUME_REQUIRED",
    });
  });
});

describe("generateFinalEvaluationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.repo.getEvaluationByInterviewId.mockResolvedValue(null);
  });

  it("does not invent a match score of 80 when none is stored", async () => {
    m.repo.getInterviewSessionById.mockResolvedValue({
      ...interviewWith([question(1, { answer: "a", feedback: '{"score":70}' })], "COMPLETED"),
    });
    m.analyzeResume.mockRejectedValue(new Error("stop after prompt"));

    await generateFinalEvaluationService("i1", "u1").catch(() => undefined);

    const prompt = m.analyzeResume.mock.calls[0][0] as string;
    expect(prompt).toContain("not available");
    expect(prompt).not.toContain("80%");
  });

  it("refuses to report on an interview that is not complete", async () => {
    m.repo.getInterviewSessionById.mockResolvedValue(interviewWith([question(1)], "IN_PROGRESS"));

    await expect(generateFinalEvaluationService("i1", "u1")).rejects.toMatchObject({
      status: 409,
      code: "INTERVIEW_NOT_COMPLETE",
    });
  });
});

describe("final report saves skill evidence with the report", () => {
  it("passes WEAK and STRONG evidence from the report to the transactional save", async () => {
    vi.clearAllMocks();
    m.repo.getEvaluationByInterviewId.mockResolvedValue(null);
    m.repo.getInterviewSessionById.mockResolvedValue(
      interviewWith([question(1, { answer: "a", feedback: '{"score":70}' })], "COMPLETED"),
    );
    m.analyzeResume.mockResolvedValue(
      JSON.stringify({
        score: 70,
        feedback: "Solid overall.",
        breakdown: { communication: 60, technicalKnowledge: 70, problemSolving: 60, relevance: 65, confidence: 80 },
        strengths: ["Clear React explanations"],
        improvements: ["Docker deployment answers were vague"],
        recommendation: "Practise Docker before the next round.",
      }),
    );
    m.saveEvaluationWithSkillEvidence.mockResolvedValue({ id: "e1" });

    await generateFinalEvaluationService("i1", "u1");

    const evidence = m.saveEvaluationWithSkillEvidence.mock.calls[0][3];
    expect(evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ skill: "docker", status: "WEAK" }),
        expect.objectContaining({ skill: "react", status: "STRONG" }),
      ]),
    );
  });
});

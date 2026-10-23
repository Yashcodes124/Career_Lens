// Chooses one next step. The rules run in order, so the first match wins and the reason is always visible.
export type NextAction =
  | { type: "UPLOAD_RESUME"; reason: string }
  | { type: "PRACTICE_SKILL"; skill: string; reason: string }
  | { type: "EXPLORE_JOBS"; reason: string }
  | { type: "START_INTERVIEW"; reason: string };

export interface ReadinessFacts {
  hasResume: boolean;
  weakSkills: { skill: string; evidence: string }[]; // most recent first
  hasScoredApplication: boolean;
}

export const decideNextAction = (facts: ReadinessFacts): NextAction => {
  if (!facts.hasResume) {
    return {
      type: "UPLOAD_RESUME",
      reason: "Upload a resume so TrueHire can compare your skills with real jobs.",
    };
  }
  const [weakest] = facts.weakSkills;
  if (weakest) {
    return {
      type: "PRACTICE_SKILL",
      skill: weakest.skill,
      reason: `${weakest.skill} was flagged in your last mock interview. Practise it before the next one.`,
    };
  }
  if (!facts.hasScoredApplication) {
    return {
      type: "EXPLORE_JOBS",
      reason: "Match a verified job to see your score and the gaps for that role.",
    };
  }
  return {
    type: "START_INTERVIEW",
    reason: "Start a mock interview for a role you have matched.",
  };
};

// Deterministic resume-to-job matching + Offense & Defense Tactical Matrix + Evidence Audit.
// Every number can be traced to a skill name, a count of mentions in the job description,
// a resume snippet, or an interview question evaluation. No model is involved.
import { normalizeSkill, normalizeSkills } from "./skillNormalizer";
import { countSkillMentions, SKILL_DICTIONARY } from "./skillDictionary";

export type GapPriority = "high" | "medium" | "low";

export interface SkillGap {
  skill: string;
  priority: GapPriority;
  evidence: string;
}

export interface MatchResult {
  status: "OK" | "INSUFFICIENT_DATA";
  score: number | null;
  matchedSkills: string[];
  missingSkills: string[];
  skillGaps: SkillGap[];
}

export type DefenseStatus =
  "FORTIFIED" | "UNVERIFIED_CLAIM" | "EXPOSED_WEAKNESS";

export interface DefenseSkillAudit {
  skill: string;
  status: DefenseStatus;
  note: string;
}

export interface OffenseStrikeTarget {
  skill: string;
  priority: GapPriority;
  scoreGainPct: number;
  ProjectedScore: number;
  rationale: string;
}

export interface TacticalMatrix {
  defense: {
    defensibilityScore: number;
    posture: "FORTIFIED" | "EXPOSED" | "UNPROVEN";
    fortifiedSkills: string[];
    unverifiedClaims: string[];
    exposedWeaknesses: string[];
    auditTrail: DefenseSkillAudit[];
  };
  offense: {
    singleSkillGainPct: number;
    projectedScoreAfterTop3: number;
    strikeTargets: OffenseStrikeTarget[];
  };
}

export type SkillConfidence =
  | "EXACT_MATCH"
  | "ALIAS_MATCH"
  | "PARTIAL_MATCH"
  | "INFERRED_MATCH"
  | "MISSING";

export type SkillVerificationState =
  "VERIFIED_STRONG" | "WEAK" | "UNVERIFIED" | "MISSING";

export interface SkillEvidenceAuditItem {
  skill: string;
  verificationState: SkillVerificationState;
  confidence: SkillConfidence;
  impactPct: number;
  credited: boolean;
  priority: GapPriority;
  resumeEvidence: {
    found: boolean;
    section: string | null;
    matchedTerm: string | null;
    snippet: string | null;
  };
  jobEvidence: {
    mentionCount: number;
    summary: string;
    snippet: string | null;
  };
  interviewEvidence: {
    status: "STRONG" | "WEAK" | "UNVERIFIED" | "MISSING";
    citation: string | null;
    summary: string;
  };
  recommendedAction: string;
}

// Interview evidence from earlier mock interviews. It changes what the candidate is credited with.
export interface InterviewEvidence {
  strongSkills: string[];
  weakSkills: Map<string, string>; // skill -> evidence text
  strongCitations?: Map<string, string>; // skill -> "Interview 3, Q2: ..."
  weakCitations?: Map<string, string>; // skill -> "Interview 1, Q4: ..."
}

const PRIORITY_ORDER: Record<GapPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

// A skill named three or more times in the posting is core to the role.
const priorityFromMentions = (mentions: number): GapPriority => {
  if (mentions >= 3) return "high";
  if (mentions === 2) return "medium";
  return "low";
};

const normalizeInterviewEvidence = (interview?: InterviewEvidence) => {
  const normalizedStrong = new Set(
    normalizeSkills(interview?.strongSkills ?? []),
  );
  const normalizedWeak = new Map<string, string>();
  const normalizedStrongCitations = new Map<string, string>();
  const normalizedWeakCitations = new Map<string, string>();

  if (interview?.strongCitations) {
    for (const [rawSkill, citation] of interview.strongCitations.entries()) {
      const [norm] = normalizeSkills([rawSkill]);
      const key = norm ?? rawSkill.toLowerCase().trim();
      if (key) normalizedStrongCitations.set(key, citation);
    }
  }

  if (interview?.weakCitations) {
    for (const [rawSkill, citation] of interview.weakCitations.entries()) {
      const [norm] = normalizeSkills([rawSkill]);
      const key = norm ?? rawSkill.toLowerCase().trim();
      if (key) normalizedWeakCitations.set(key, citation);
    }
  }

  if (interview?.weakSkills) {
    for (const [rawSkill, evidence] of interview.weakSkills.entries()) {
      const [norm] = normalizeSkills([rawSkill]);
      const key = norm ?? rawSkill.toLowerCase().trim();
      if (key) {
        normalizedWeak.set(key, evidence);
        normalizedStrong.delete(key);
      }
    }
  }

  return {
    normalizedStrong,
    normalizedWeak,
    normalizedStrongCitations,
    normalizedWeakCitations,
  };
};

export const calculateMatch = (
  resumeSkills: string[],
  jobSkills: string[],
  jobDescription?: string,
  interview?: InterviewEvidence,
): MatchResult => {
  const requiredSkills = normalizeSkills(jobSkills);

  if (requiredSkills.length === 0) {
    return {
      status: "INSUFFICIENT_DATA",
      score: null,
      matchedSkills: [],
      missingSkills: [],
      skillGaps: [],
    };
  }

  const { normalizedStrong, normalizedWeak } =
    normalizeInterviewEvidence(interview);

  // Credit comes from the resume and from strong interview evidence.
  // A skill flagged as weak in an interview is not credited, even if the resume lists it.
  const candidateSkills = new Set(normalizeSkills(resumeSkills));
  for (const skill of normalizedStrong) candidateSkills.add(skill);
  for (const skill of normalizedWeak.keys()) candidateSkills.delete(skill);

  const matchedSkills = requiredSkills.filter((skill) =>
    candidateSkills.has(skill),
  );
  const missingSkills = requiredSkills.filter(
    (skill) => !candidateSkills.has(skill),
  );

  const mentions = jobDescription ? countSkillMentions(jobDescription) : null;

  const skillGaps: SkillGap[] = missingSkills
    .map((skill) => {
      if (normalizedWeak.has(skill)) {
        return {
          skill,
          priority: "high" as const,
          evidence:
            "Weak in a mock interview. Practise it before the next interview.",
        };
      }
      const count = mentions?.get(skill) ?? 0;
      const priority: GapPriority = mentions
        ? priorityFromMentions(count)
        : "medium";
      const evidence =
        count > 0
          ? `Named ${count} ${count === 1 ? "time" : "times"} in the job description`
          : "Listed in the job requirements";
      return { skill, priority, evidence };
    })
    .sort(
      (a, b) =>
        PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
        a.skill.localeCompare(b.skill),
    );

  return {
    status: "OK",
    score: Math.round((matchedSkills.length / requiredSkills.length) * 100),
    matchedSkills,
    missingSkills,
    skillGaps,
  };
};

export const calculateTacticalMatrix = (
  resumeSkills: string[],
  jobSkills: string[],
  jobDescription?: string,
  interview?: InterviewEvidence,
): TacticalMatrix | null => {
  const match = calculateMatch(
    resumeSkills,
    jobSkills,
    jobDescription,
    interview,
  );
  if (match.status !== "OK" || match.score === null) {
    return null;
  }

  const requiredSkills = normalizeSkills(jobSkills);
  const parsedResumeSkills = new Set(normalizeSkills(resumeSkills));
  const { normalizedStrong, normalizedWeak } =
    normalizeInterviewEvidence(interview);

  const fortifiedSkills: string[] = [];
  const unverifiedClaims: string[] = [];
  const exposedWeaknesses: string[] = [];
  const auditTrail: DefenseSkillAudit[] = [];

  for (const skill of requiredSkills) {
    if (normalizedWeak.has(skill)) {
      exposedWeaknesses.push(skill);
      auditTrail.push({
        skill,
        status: "EXPOSED_WEAKNESS",
        note: parsedResumeSkills.has(skill)
          ? "Claimed on resume but flagged weak in mock interview interrogation."
          : "Required by role and flagged weak in mock interview.",
      });
    } else if (normalizedStrong.has(skill)) {
      fortifiedSkills.push(skill);
      auditTrail.push({
        skill,
        status: "FORTIFIED",
        note: "Verified strong under rubric-graded mock interview interrogation.",
      });
    } else if (parsedResumeSkills.has(skill)) {
      unverifiedClaims.push(skill);
      auditTrail.push({
        skill,
        status: "UNVERIFIED_CLAIM",
        note: "Listed on resume with zero mock interview verification.",
      });
    }
  }

  const totalDefensiveClaims =
    fortifiedSkills.length + unverifiedClaims.length + exposedWeaknesses.length;

  const defensibilityScore =
    totalDefensiveClaims > 0
      ? Math.round(
          ((fortifiedSkills.length * 1.0 + unverifiedClaims.length * 0.5) /
            totalDefensiveClaims) *
            100,
        )
      : 0;

  const posture: "FORTIFIED" | "EXPOSED" | "UNPROVEN" =
    exposedWeaknesses.length > 0
      ? "EXPOSED"
      : fortifiedSkills.length > 0 &&
          fortifiedSkills.length >= unverifiedClaims.length
        ? "FORTIFIED"
        : "UNPROVEN";

  const singleSkillGainPct =
    requiredSkills.length > 0
      ? Math.round((1 / requiredSkills.length) * 100)
      : 0;

  const strikeTargets: OffenseStrikeTarget[] = match.skillGaps
    .slice(0, 5)
    .map((gap, index) => {
      const cumulativeMatched = Math.min(
        requiredSkills.length,
        match.matchedSkills.length + (index + 1),
      );
      const projectedScore = Math.round(
        (cumulativeMatched / requiredSkills.length) * 100,
      );
      return {
        skill: gap.skill,
        priority: gap.priority,
        scoreGainPct: singleSkillGainPct,
        ProjectedScore: projectedScore,
        rationale: normalizedWeak.has(gap.skill)
          ? `Reclaim +${singleSkillGainPct}% match credit lost to earlier interview weakness.`
          : `Capture +${singleSkillGainPct}% match credit (${gap.evidence}).`,
      };
    });

  const top3Matched = Math.min(
    requiredSkills.length,
    match.matchedSkills.length + Math.min(3, match.skillGaps.length),
  );
  const projectedScoreAfterTop3 = Math.round(
    (top3Matched / requiredSkills.length) * 100,
  );

  return {
    defense: {
      defensibilityScore,
      posture,
      fortifiedSkills,
      unverifiedClaims,
      exposedWeaknesses,
      auditTrail,
    },
    offense: {
      singleSkillGainPct,
      projectedScoreAfterTop3,
      strikeTargets,
    },
  };
};

const escapeRegex = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getAliasesForSkill = (canonicalSkill: string): string[] => {
  const entry = SKILL_DICTIONARY.find((e) => e.canonical === canonicalSkill);
  const names = entry ? [entry.canonical, ...entry.aliases] : [canonicalSkill];
  return [...new Set(names)].sort((a, b) => b.length - a.length);
};

const extractSnippetForTerms = (
  text: string | undefined | null,
  terms: string[],
): { snippet: string | null; matchedTerm: string | null } => {
  if (!text || !text.trim()) {
    return { snippet: null, matchedTerm: null };
  }

  const segments = text
    .split(/(?:\r?\n|(?<=[.!?])\s+|•|\u2022)/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 6);

  for (const term of terms) {
    const pattern = new RegExp(
      `(?<![a-z0-9])${escapeRegex(term)}(?![a-z0-9])`,
      "i",
    );
    for (const seg of segments) {
      const match = seg.match(pattern);
      if (match) {
        const cleaned =
          seg.length > 160 ? `${seg.slice(0, 157).trim()}...` : seg;
        return { snippet: cleaned, matchedTerm: match[0] };
      }
    }
  }

  return { snippet: null, matchedTerm: null };
};

const findResumeSectionAndSnippet = (
  canonicalSkill: string,
  terms: string[],
  resumeSkills: string[],
  resumeRawText?: string | null,
  resumeParsedData?: unknown,
): {
  found: boolean;
  section: string | null;
  matchedTerm: string | null;
  snippet: string | null;
  isExactTerm: boolean;
} => {
  // Check raw resumeSkills array first for exact vs alias match
  let matchedRawSkill: string | null = null;
  for (const raw of resumeSkills) {
    if (normalizeSkill(raw) === canonicalSkill) {
      matchedRawSkill = raw.trim();
      break;
    }
  }

  // Check structured parsedData sections if available
  if (resumeParsedData && typeof resumeParsedData === "object") {
    const parsed = resumeParsedData as Record<string, unknown>;
    const candidateSections: Array<{ label: string; value: unknown }> = [
      {
        label: "Experience",
        value: parsed.experience ?? parsed.workExperience,
      },
      { label: "Projects", value: parsed.projects },
      { label: "Summary", value: parsed.summary ?? parsed.objective },
      { label: "Technical Skills", value: parsed.skills },
      { label: "Education", value: parsed.education },
    ];

    for (const sec of candidateSections) {
      if (!sec.value) continue;
      const serialized =
        typeof sec.value === "string"
          ? sec.value
          : JSON.stringify(sec.value).replace(/[{"[\]}]/g, " ");
      const hit = extractSnippetForTerms(serialized, terms);
      if (hit.snippet) {
        const termUsed = matchedRawSkill || hit.matchedTerm || canonicalSkill;
        return {
          found: true,
          section: sec.label,
          matchedTerm: termUsed,
          snippet: hit.snippet,
          isExactTerm: termUsed.toLowerCase() === canonicalSkill,
        };
      }
    }
  }

  // Check rawText lines/sentences
  const rawHit = extractSnippetForTerms(resumeRawText, terms);
  if (rawHit.snippet) {
    const termUsed = matchedRawSkill || rawHit.matchedTerm || canonicalSkill;
    return {
      found: true,
      section: "Resume Text",
      matchedTerm: termUsed,
      snippet: rawHit.snippet,
      isExactTerm: termUsed.toLowerCase() === canonicalSkill,
    };
  }

  if (matchedRawSkill) {
    return {
      found: true,
      section: "Skills Section",
      matchedTerm: matchedRawSkill,
      snippet: `Listed in parsed resume skills as "${matchedRawSkill}"`,
      isExactTerm: matchedRawSkill.toLowerCase() === canonicalSkill,
    };
  }

  return {
    found: false,
    section: null,
    matchedTerm: null,
    snippet: null,
    isExactTerm: false,
  };
};

export const buildSkillEvidenceAudit = (params: {
  resumeSkills: string[];
  resumeRawText?: string | null;
  resumeParsedData?: unknown;
  jobSkills: string[];
  jobDescription?: string;
  interview?: InterviewEvidence;
}): SkillEvidenceAuditItem[] => {
  const requiredSkills = normalizeSkills(params.jobSkills);
  if (requiredSkills.length === 0) return [];

  const {
    normalizedStrong,
    normalizedWeak,
    normalizedStrongCitations,
    normalizedWeakCitations,
  } = normalizeInterviewEvidence(params.interview);

  const mentions = params.jobDescription
    ? countSkillMentions(params.jobDescription)
    : null;

  const impactPct = Math.max(1, Math.round((1 / requiredSkills.length) * 100));

  const items: SkillEvidenceAuditItem[] = requiredSkills.map((skill) => {
    const terms = getAliasesForSkill(skill);
    const resumeInfo = findResumeSectionAndSnippet(
      skill,
      terms,
      params.resumeSkills,
      params.resumeRawText,
      params.resumeParsedData,
    );

    const jobHit = extractSnippetForTerms(params.jobDescription, terms);
    const mentionCount = Math.max(
      mentions?.get(skill) ?? 0,
      jobHit.snippet ? 1 : 0,
    );
    const priority: GapPriority = normalizedWeak.has(skill)
      ? "high"
      : mentions
        ? priorityFromMentions(mentionCount)
        : "medium";

    const jobSummary =
      mentionCount > 0
        ? `Mentioned ${mentionCount} ${mentionCount === 1 ? "time" : "times"} in job posting`
        : "Listed in extracted job requirements";

    const isStrong = normalizedStrong.has(skill);
    const isWeak = normalizedWeak.has(skill);

    let verificationState: SkillVerificationState;
    let credited: boolean;
    let interviewStatus: "STRONG" | "WEAK" | "UNVERIFIED" | "MISSING";
    let interviewCitation: string | null = null;
    let interviewSummary: string;

    if (isWeak) {
      verificationState = "WEAK";
      credited = false;
      interviewStatus = "WEAK";
      interviewCitation =
        normalizedWeakCitations.get(skill) ?? normalizedWeak.get(skill) ?? null;
      interviewSummary =
        interviewCitation ||
        "Flagged weak in mock interview evaluation — credit withheld until re-verified.";
    } else if (isStrong) {
      verificationState = "VERIFIED_STRONG";
      credited = true;
      interviewStatus = "STRONG";
      interviewCitation =
        normalizedStrongCitations.get(skill) ??
        "Verified strong in rubric-scored mock interview evaluation";
      interviewSummary = interviewCitation;
    } else if (resumeInfo.found) {
      verificationState = "UNVERIFIED";
      credited = true;
      interviewStatus = "UNVERIFIED";
      interviewCitation = null;
      interviewSummary =
        "Unverified resume claim — not yet interrogated in a mock interview.";
    } else {
      verificationState = "MISSING";
      credited = false;
      interviewStatus = "MISSING";
      interviewCitation = null;
      interviewSummary = "Not present on resume and not tested in interviews.";
    }

    let confidence: SkillConfidence;
    if (isWeak) {
      confidence = "PARTIAL_MATCH";
    } else if (resumeInfo.found && resumeInfo.isExactTerm) {
      confidence = "EXACT_MATCH";
    } else if (resumeInfo.found && !resumeInfo.isExactTerm) {
      confidence = "ALIAS_MATCH";
    } else if (!resumeInfo.found && isStrong) {
      confidence = "INFERRED_MATCH";
    } else {
      confidence = "MISSING";
    }

    let recommendedAction: string;
    if (verificationState === "VERIFIED_STRONG") {
      recommendedAction = `Verified strong (+${impactPct}% match score) — keep ${skill} prominent in your tailored summary.`;
    } else if (verificationState === "UNVERIFIED") {
      recommendedAction = `Start a targeted interview on ${skill} to upgrade this resume claim to Verified Strong.`;
    } else if (verificationState === "WEAK") {
      recommendedAction = `Retake a targeted interview on ${skill} to reclaim +${impactPct}% match score lost to prior weakness.`;
    } else {
      recommendedAction = `Complete a focused implementation project + targeted interview on ${skill} (+${impactPct}% match score).`;
    }

    return {
      skill,
      verificationState,
      confidence,
      impactPct,
      credited,
      priority,
      resumeEvidence: {
        found: resumeInfo.found,
        section: resumeInfo.section,
        matchedTerm: resumeInfo.matchedTerm,
        snippet: resumeInfo.snippet,
      },
      jobEvidence: {
        mentionCount,
        summary: jobSummary,
        snippet: jobHit.snippet,
      },
      interviewEvidence: {
        status: interviewStatus,
        citation: interviewCitation,
        summary: interviewSummary,
      },
      recommendedAction,
    };
  });

  const STATE_ORDER: Record<SkillVerificationState, number> = {
    VERIFIED_STRONG: 0,
    UNVERIFIED: 1,
    WEAK: 2,
    MISSING: 3,
  };

  return items.sort(
    (a, b) =>
      STATE_ORDER[a.verificationState] - STATE_ORDER[b.verificationState] ||
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
      b.jobEvidence.mentionCount - a.jobEvidence.mentionCount ||
      a.skill.localeCompare(b.skill),
  );
};

export interface ScoreDecomposition {
  headlineScores: {
    matchScore: {
      score: number;
      question: string;
      summary: string;
    };
    readinessScore: {
      score: number;
      question: string;
      summary: string;
    };
    preparationScore: {
      score: number;
      question: string;
      summary: string;
    };
  };
  factors: {
    requiredSkillCoverage: {
      score: number;
      met: number;
      total: number;
      detail: string;
    };
    preferredSkillCoverage: {
      score: number;
      met: number;
      total: number;
      detail: string;
    };
    interviewVerifiedCoverage: {
      score: number;
      verified: number;
      total: number;
      detail: string;
    };
    resumeEvidenceQuality: {
      score: number;
      contextualCount: number;
      totalMatched: number;
      detail: string;
    };
    experienceAlignment: {
      score: number;
      candidateYears: number | null;
      requiredYears: number | null;
      detail: string;
    };
    criticalGapPenalty: {
      penaltyPct: number;
      criticalGaps: number;
      weakSkills: number;
      detail: string;
    };
    jobDescriptionConfidence: {
      score: number;
      level: "HIGH" | "MEDIUM" | "LOW";
      extractedSkillCount: number;
      detail: string;
    };
  };
}

const parseRequiredYearsFromJob = (
  jobTitle?: string,
  jobDescription?: string,
): number | null => {
  const text = `${jobTitle ?? ""}\n${jobDescription ?? ""}`;
  const match = text.match(/(\d{1,2})\s*\+?\s*(?:-\s*\d{1,2}\s*)?years?/i);
  if (match) {
    const yrs = parseInt(match[1], 10);
    if (yrs > 0 && yrs <= 20) return yrs;
  }
  if (/\b(principal|staff|architect|lead)\b/i.test(jobTitle ?? "")) return 6;
  if (/\b(senior|sr\.?|sde\s*iii|sde-3)\b/i.test(jobTitle ?? "")) return 4;
  if (/\b(sde\s*ii|sde-2|mid)\b/i.test(jobTitle ?? "")) return 2;
  if (/\b(intern|graduate|fresher|junior|entry)\b/i.test(jobTitle ?? ""))
    return 0;
  return null;
};

export const buildScoreDecomposition = (params: {
  match: MatchResult;
  skillAudit: SkillEvidenceAuditItem[];
  candidateExperienceYrs?: number | null;
  jobTitle?: string;
  jobDescription?: string;
}): ScoreDecomposition | null => {
  const { match, skillAudit } = params;
  if (
    match.status !== "OK" ||
    match.score === null ||
    skillAudit.length === 0
  ) {
    return null;
  }

  const totalSkills = skillAudit.length;

  // 1. Split Required (high/medium mention priority) vs Preferred (low priority)
  const coreItems = skillAudit.filter((i) => i.priority !== "low");
  const preferredItems = skillAudit.filter((i) => i.priority === "low");

  const effectiveCore = coreItems.length > 0 ? coreItems : skillAudit;
  const coreMet = effectiveCore.filter((i) => i.credited).length;
  const requiredSkillScore = Math.round((coreMet / effectiveCore.length) * 100);

  const preferredMet = preferredItems.filter((i) => i.credited).length;
  const preferredSkillScore =
    preferredItems.length > 0
      ? Math.round((preferredMet / preferredItems.length) * 100)
      : requiredSkillScore;

  // 2. Interview-verified skill coverage
  const verifiedItems = skillAudit.filter(
    (i) => i.verificationState === "VERIFIED_STRONG",
  );
  const unverifiedItems = skillAudit.filter(
    (i) => i.verificationState === "UNVERIFIED",
  );
  const weakItems = skillAudit.filter((i) => i.verificationState === "WEAK");

  const interviewVerifiedScore = Math.round(
    (verifiedItems.length / totalSkills) * 100,
  );

  // 3. Resume-evidence quality (contextual section snippets vs bare skill tags)
  const creditedItems = skillAudit.filter((i) => i.credited);
  const contextualItems = creditedItems.filter(
    (i) =>
      i.resumeEvidence.found &&
      i.resumeEvidence.section &&
      i.resumeEvidence.section !== "Skills Section" &&
      i.confidence === "EXACT_MATCH",
  );
  const resumeQualityScore =
    creditedItems.length > 0
      ? Math.round(
          ((contextualItems.length * 1.0 +
            (creditedItems.length - contextualItems.length) * 0.65) /
            creditedItems.length) *
            100,
        )
      : 0;

  // 4. Experience-level alignment
  const requiredYears = parseRequiredYearsFromJob(
    params.jobTitle,
    params.jobDescription,
  );
  const candidateYears =
    typeof params.candidateExperienceYrs === "number"
      ? params.candidateExperienceYrs
      : null;

  let experienceScore = 85;
  let experienceDetail =
    "Job posting does not specify a strict minimum year threshold.";

  if (requiredYears !== null && candidateYears !== null) {
    if (candidateYears >= requiredYears) {
      experienceScore = 100;
      experienceDetail = `Resume shows ${candidateYears} yr(s) vs ${requiredYears}+ yr(s) target.`;
    } else {
      const diff = requiredYears - candidateYears;
      experienceScore = Math.max(35, 100 - diff * 20);
      experienceDetail = `Resume shows ${candidateYears} yr(s) vs ${requiredYears}+ yr(s) target (-${diff} yr gap).`;
    }
  } else if (candidateYears !== null) {
    experienceScore = candidateYears > 0 ? 90 : 75;
    experienceDetail = `Resume lists ${candidateYears} yr(s) of experience; role level is flexible.`;
  }

  // 5. Critical-gap penalty
  const criticalMissing = skillAudit.filter(
    (i) => !i.credited && i.priority === "high",
  );
  const singleWeight = Math.max(1, Math.round((1 / totalSkills) * 100));
  const penaltyPct = Math.min(
    100,
    criticalMissing.length * singleWeight + weakItems.length * singleWeight,
  );

  // 6. Job-description confidence
  const wordCount = (params.jobDescription ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const jdScore = Math.min(
    100,
    Math.round(Math.min(60, totalSkills * 8) + Math.min(40, wordCount / 5)),
  );
  const jdLevel: "HIGH" | "MEDIUM" | "LOW" =
    jdScore >= 75 ? "HIGH" : jdScore >= 45 ? "MEDIUM" : "LOW";

  // 7. Three distinct top-level scores
  const matchScore = match.score;

  // Readiness: Verified = 100% credit, Unverified resume claim = 50% credit, Weak/Missing = 0%
  const readinessScore = Math.round(
    ((verifiedItems.length * 1.0 + unverifiedItems.length * 0.5) /
      totalSkills) *
      100,
  );

  // Preparation: High-impact (high/medium priority) requirements completed or verified
  const highImpactItems = coreItems.length > 0 ? coreItems : skillAudit;
  const highImpactPrepared = highImpactItems.filter(
    (i) =>
      i.verificationState === "VERIFIED_STRONG" ||
      (i.verificationState === "UNVERIFIED" && i.resumeEvidence.found),
  ).length;
  const preparationScore = Math.round(
    (highImpactPrepared / highImpactItems.length) * 100,
  );

  return {
    headlineScores: {
      matchScore: {
        score: matchScore,
        question: "Can this resume satisfy the stated job requirements?",
        summary: `${match.matchedSkills.length} of ${totalSkills} required skills present on resume or verified.`,
      },
      readinessScore: {
        score: readinessScore,
        question:
          "Can this candidate credibly demonstrate the required skills in an interview?",
        summary: `${verifiedItems.length} verified strong, ${unverifiedItems.length} unverified resume claims (50% weight), ${weakItems.length} weak.`,
      },
      preparationScore: {
        score: preparationScore,
        question: "How much of the highest-impact gap work has been completed?",
        summary: `${highImpactPrepared} of ${highImpactItems.length} core role requirements covered (${criticalMissing.length} high-priority gaps left).`,
      },
    },
    factors: {
      requiredSkillCoverage: {
        score: requiredSkillScore,
        met: coreMet,
        total: effectiveCore.length,
        detail: `${coreMet} of ${effectiveCore.length} core requirements met`,
      },
      preferredSkillCoverage: {
        score: preferredSkillScore,
        met: preferredItems.length > 0 ? preferredMet : coreMet,
        total:
          preferredItems.length > 0
            ? preferredItems.length
            : effectiveCore.length,
        detail:
          preferredItems.length > 0
            ? `${preferredMet} of ${preferredItems.length} secondary/preferred skills met`
            : "All extracted skills are core requirements",
      },
      interviewVerifiedCoverage: {
        score: interviewVerifiedScore,
        verified: verifiedItems.length,
        total: totalSkills,
        detail: `${verifiedItems.length} of ${totalSkills} role skills verified in mock interviews`,
      },
      resumeEvidenceQuality: {
        score: resumeQualityScore,
        contextualCount: contextualItems.length,
        totalMatched: creditedItems.length,
        detail:
          creditedItems.length > 0
            ? `${contextualItems.length} of ${creditedItems.length} matched skills backed by Experience/Project context`
            : "No matched skills on active resume yet",
      },
      experienceAlignment: {
        score: experienceScore,
        candidateYears,
        requiredYears,
        detail: experienceDetail,
      },
      criticalGapPenalty: {
        penaltyPct,
        criticalGaps: criticalMissing.length,
        weakSkills: weakItems.length,
        detail:
          penaltyPct > 0
            ? `-${penaltyPct}% match impact from ${criticalMissing.length} high-priority missing skill(s) and ${weakItems.length} weak interview skill(s)`
            : "0% penalty — no high-priority gaps or failed interview skills",
      },
      jobDescriptionConfidence: {
        score: jdScore,
        level: jdLevel,
        extractedSkillCount: totalSkills,
        detail: `${jdLevel} confidence (${totalSkills} canonical skills extracted from ${wordCount} words)`,
      },
    },
  };
};

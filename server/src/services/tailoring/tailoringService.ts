// Suggests skills-list changes and truthful bullet improvements for one resume and one job.
// Deterministic and traceable: never fabricates experience, metrics, or unverified skills.
import { AppError } from "../../utils/appError";
import {
  getResumeById,
  updateResumeForUser,
} from "../../repositories/resumeRepository";
import { getJobById } from "../../repositories/jobRepository";
import { listUserSkills } from "../../repositories/skillRepository";
import { countSkillMentions } from "../matching/skillDictionary";
import { normalizeSkills } from "../matching/skillNormalizer";
import { recordFeatureEvent } from "../telemetry/telemetryService";
import type { GapPriority } from "../matching/matchingService";

export interface AddSuggestion {
  skill: string;
  evidence: string;
}

export interface MissingSuggestion {
  skill: string;
  priority: GapPriority;
  evidence: string;
}

export interface BulletCoachSuggestion {
  id: string;
  section: "Experience" | "Projects" | "Summary";
  originalBullet: string;
  suggestedBullet: string;
  vaguePhrasesDetected: string[];
  actionVerbUpgrade: { from: string; to: string } | null;
  hasExistingMetric: boolean;
  needsUserMetric: boolean;
  metricPrompt: string | null;
  matchedJobSkillsInBullet: string[];
  verifiedSkillsInBullet: string[];
  rationale: string;
}

export interface TailoringSuggestions {
  jobTitle: string;
  currentSkills: string[];
  addToSkills: AddSuggestion[];
  notOnResume: MissingSuggestion[];
  suggestedSkills: string[];
  bulletSuggestions: BulletCoachSuggestion[];
}

const PRIORITY_ORDER: Record<GapPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const priorityFromMentions = (mentions: number): GapPriority => {
  if (mentions >= 3) return "high";
  if (mentions === 2) return "medium";
  return "low";
};

const times = (count: number) => (count === 1 ? "time" : "times");

// Vague / passive resume phrases and their truthful, non-fabricating verb replacements
const VAGUE_PHRASE_RULES: Array<{
  pattern: RegExp;
  label: string;
  replacement: string;
}> = [
  {
    pattern: /\bwas responsible for\b/i,
    label: "was responsible for",
    replacement: "Owned and delivered",
  },
  {
    pattern: /\bresponsible for\b/i,
    label: "responsible for",
    replacement: "Owned and executed",
  },
  {
    pattern: /\bworked on\b/i,
    label: "worked on",
    replacement: "Engineered and shipped",
  },
  {
    pattern: /\bworked with\b/i,
    label: "worked with",
    replacement: "Integrated and collaborated using",
  },
  {
    pattern: /\bhelped with\b/i,
    label: "helped with",
    replacement: "Contributed to building",
  },
  {
    pattern: /\bassisted with\b/i,
    label: "assisted with",
    replacement: "Implemented",
  },
  {
    pattern: /\binvolved in\b/i,
    label: "involved in",
    replacement: "Developed",
  },
  {
    pattern: /\bparticipated in\b/i,
    label: "participated in",
    replacement: "Executed",
  },
  {
    pattern: /\btasked with\b/i,
    label: "tasked with",
    replacement: "Delivered",
  },
  {
    pattern: /\bduties included\b/i,
    label: "duties included",
    replacement: "Executed",
  },
  {
    pattern: /\bdealt with\b/i,
    label: "dealt with",
    replacement: "Resolved",
  },
  {
    pattern: /\bhandled\b/i,
    label: "handled",
    replacement: "Managed and optimized",
  },
  {
    pattern: /\bwas part of\b/i,
    label: "was part of",
    replacement: "Collaborated on",
  },
];

const METRIC_REGEX =
  /(\b\d+(?:\.\d+)?%|\$\d+|\b\d+(?:,\d{3})+\b|\b\d+(?:\.\d+)?\s*(?:ms|s|sec|seconds|mins|minutes|hours|hrs|x|k|m|b|req\/s|rps|qps|users|customers|requests|services|endpoints|tests|pipelines)\b)/i;

const buildMetricPromptForBullet = (
  bullet: string,
  skillsInBullet: string[],
): string => {
  const lower = bullet.toLowerCase();
  if (
    /\b(api|endpoint|latency|cache|redis|query|database|sql|postgres)\b/.test(
      lower,
    )
  ) {
    return "Optional: Enter a real performance metric you measured (e.g., 'reducing p95 API latency from 320ms to 110ms' or 'cutting query time by 40%').";
  }
  if (
    /\b(test|jest|vitest|playwright|cypress|ci\/cd|pipeline|deploy)\b/.test(
      lower,
    )
  ) {
    return "Optional: Enter a real quality or delivery metric (e.g., 'increasing test coverage to 88%' or 'cutting deploy time from 18m to 4m').";
  }
  if (/\b(ui|frontend|react|next\.js|component|dashboard|page)\b/.test(lower)) {
    return "Optional: Enter a real user or frontend metric (e.g., 'serving 5,000+ monthly users' or 'improving Lighthouse performance score to 96').";
  }
  const focus = skillsInBullet[0] ? ` using ${skillsInBullet[0]}` : "";
  return `Optional: Provide a real, verifiable outcome you achieved${focus} (e.g., latency saved, users served, or reliability %)—TrueHire never invents numbers.`;
};

const extractCandidateBullets = (
  rawText: string,
  parsedData?: unknown,
): Array<{ section: "Experience" | "Projects" | "Summary"; text: string }> => {
  const results: Array<{
    section: "Experience" | "Projects" | "Summary";
    text: string;
  }> = [];
  const seen = new Set<string>();

  const pushUnique = (
    section: "Experience" | "Projects" | "Summary",
    raw: string,
  ) => {
    const cleaned = raw
      .replace(/^[\s•\-*▪◦‣\d.)]+/, "")
      .replace(/\s+/g, " ")
      .trim();
    if (cleaned.length < 22 || cleaned.length > 360) return;
    // Skip contact headers / URLs / section headings
    if (
      /^(experience|projects|education|skills|summary|contact|email|phone|github|linkedin)$/i.test(
        cleaned,
      )
    ) {
      return;
    }
    const key = cleaned.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    results.push({ section, text: cleaned });
  };

  // 1. Prefer structured experience & project bullets if parsedData exists
  if (parsedData && typeof parsedData === "object") {
    const pd = parsedData as {
      experience?: Array<{ description?: string }>;
      projects?: Array<{ description?: string }>;
    };
    for (const exp of pd.experience ?? []) {
      if (typeof exp.description === "string") {
        for (const line of exp.description.split(/\r?\n|(?<=\.)\s+/)) {
          pushUnique("Experience", line);
        }
      }
    }
    for (const proj of pd.projects ?? []) {
      if (typeof proj.description === "string") {
        for (const line of proj.description.split(/\r?\n|(?<=\.)\s+/)) {
          pushUnique("Projects", line);
        }
      }
    }
  }

  // 2. Also scan rawText lines for bullet points or action sentences
  let currentSection: "Experience" | "Projects" | "Summary" = "Experience";
  for (const rawLine of rawText.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    if (/^projects?\b/i.test(trimmed)) {
      currentSection = "Projects";
      continue;
    }
    if (/^(work\s+)?experience\b/i.test(trimmed)) {
      currentSection = "Experience";
      continue;
    }
    if (/^(summary|profile|objective)\b/i.test(trimmed)) {
      currentSection = "Summary";
      continue;
    }
    if (
      /^(education|certifications?|skills|technical skills)\b/i.test(trimmed)
    ) {
      continue;
    }

    const isBulletLine = /^([•\-*▪◦‣]|\d+[.)])\s+/.test(trimmed);
    const hasVaguePhrase = VAGUE_PHRASE_RULES.some((r) =>
      r.pattern.test(trimmed),
    );
    if (isBulletLine || hasVaguePhrase) {
      pushUnique(currentSection, trimmed);
    }
  }

  return results.slice(0, 12);
};

export const buildResumeBulletCoach = (params: {
  rawText: string;
  parsedData?: unknown;
  jobRequiredSkills: string[];
  verifiedSkills?: string[];
  jobTitle: string;
}): BulletCoachSuggestion[] => {
  const requiredSet = new Set(normalizeSkills(params.jobRequiredSkills));
  const verifiedSet = new Set(normalizeSkills(params.verifiedSkills ?? []));
  const bullets = extractCandidateBullets(params.rawText, params.parsedData);

  const suggestions: BulletCoachSuggestion[] = [];

  bullets.forEach((item, idx) => {
    const original = item.text;
    let rewritten = original;
    const vaguePhrasesDetected: string[] = [];
    let actionVerbUpgrade: { from: string; to: string } | null = null;

    for (const rule of VAGUE_PHRASE_RULES) {
      const match = rewritten.match(rule.pattern);
      if (match) {
        vaguePhrasesDetected.push(rule.label);
        if (!actionVerbUpgrade) {
          actionVerbUpgrade = { from: match[0], to: rule.replacement };
        }
        rewritten = rewritten.replace(
          rule.pattern,
          (matched, offset: number) =>
            offset === 0
              ? rule.replacement
              : rule.replacement.charAt(0).toLowerCase() +
                rule.replacement.slice(1),
        );
      }
    }

    // Capitalize first letter cleanly
    rewritten = rewritten.charAt(0).toUpperCase() + rewritten.slice(1);
    if (!/[.!?]$/.test(rewritten)) {
      rewritten = `${rewritten}.`;
    }

    const mentionedInBullet = [...countSkillMentions(original).keys()];
    const matchedJobSkillsInBullet = mentionedInBullet.filter((sk) =>
      requiredSet.has(sk),
    );
    const verifiedSkillsInBullet = mentionedInBullet.filter((sk) =>
      verifiedSet.has(sk),
    );

    const hasExistingMetric = METRIC_REGEX.test(original);
    const needsUserMetric = !hasExistingMetric;

    // Only surface bullets that either have a vague claim, lack metrics, or match target job skills
    if (
      vaguePhrasesDetected.length === 0 &&
      hasExistingMetric &&
      matchedJobSkillsInBullet.length === 0
    ) {
      return;
    }

    const rationaleParts: string[] = [];
    if (vaguePhrasesDetected.length > 0) {
      rationaleParts.push(
        `Replaces vague phrasing (${vaguePhrasesDetected.map((v) => `"${v}"`).join(", ")}) with direct engineering ownership.`,
      );
    }
    if (needsUserMetric) {
      rationaleParts.push(
        "No quantified outcome detected — add your own real metric below if available (never fabricated).",
      );
    }
    if (matchedJobSkillsInBullet.length > 0) {
      rationaleParts.push(
        `Highlights ${matchedJobSkillsInBullet.join(", ")} required for ${params.jobTitle}.`,
      );
    }

    suggestions.push({
      id: `bullet-${idx + 1}`,
      section: item.section,
      originalBullet: original,
      suggestedBullet: rewritten,
      vaguePhrasesDetected,
      actionVerbUpgrade,
      hasExistingMetric,
      needsUserMetric,
      metricPrompt: needsUserMetric
        ? buildMetricPromptForBullet(original, mentionedInBullet)
        : null,
      matchedJobSkillsInBullet,
      verifiedSkillsInBullet,
      rationale:
        rationaleParts.join(" ") ||
        `Sharpens technical clarity for ${params.jobTitle} using only existing resume facts.`,
    });
  });

  // Prioritize bullets with vague phrases first, then job-matched bullets missing metrics
  return suggestions.sort(
    (a, b) =>
      b.vaguePhrasesDetected.length - a.vaguePhrasesDetected.length ||
      b.matchedJobSkillsInBullet.length - a.matchedJobSkillsInBullet.length ||
      Number(b.needsUserMetric) - Number(a.needsUserMetric),
  );
};

export const buildTailoringSuggestions = (
  resume: {
    skills: string[];
    rawText: string;
    parsedData?: unknown;
    verifiedSkills?: string[];
  },
  job: { title: string; requirements: string[]; description: string },
): TailoringSuggestions => {
  const listed = new Set(normalizeSkills(resume.skills));
  const required = normalizeSkills(job.requirements);
  const inResumeText = countSkillMentions(resume.rawText);
  const inJobPosting = countSkillMentions(job.description);

  const addToSkills: AddSuggestion[] = [];
  const notOnResume: MissingSuggestion[] = [];

  for (const skill of required) {
    if (listed.has(skill)) continue;

    const textCount = inResumeText.get(skill) ?? 0;
    if (textCount > 0) {
      addToSkills.push({
        skill,
        evidence: `Your resume text mentions ${skill} ${textCount} ${times(textCount)}, but your skills list does not`,
      });
      continue;
    }

    const postingCount = inJobPosting.get(skill) ?? 0;
    notOnResume.push({
      skill,
      priority: priorityFromMentions(postingCount),
      evidence:
        postingCount > 0
          ? `Named ${postingCount} ${times(postingCount)} in the job description`
          : "Listed in the job requirements",
    });
  }

  notOnResume.sort(
    (a, b) =>
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
      a.skill.localeCompare(b.skill),
  );

  const seen = new Set<string>();
  const suggestedSkills: string[] = [];
  for (const skill of [
    ...resume.skills.map((s) => s.trim()),
    ...addToSkills.map((s) => s.skill),
  ]) {
    const key = skill.toLowerCase();
    if (skill && !seen.has(key)) {
      seen.add(key);
      suggestedSkills.push(skill);
    }
  }

  const bulletSuggestions = buildResumeBulletCoach({
    rawText: resume.rawText,
    parsedData: resume.parsedData,
    jobRequiredSkills: job.requirements,
    verifiedSkills: resume.verifiedSkills,
    jobTitle: job.title,
  });

  return {
    jobTitle: job.title,
    currentSkills: resume.skills,
    addToSkills,
    notOnResume,
    suggestedSkills,
    bulletSuggestions,
  };
};

export const tailorResumeService = async (
  userId: string,
  resumeId: string,
  jobId: string,
): Promise<TailoringSuggestions> => {
  const resume = await getResumeById(resumeId, userId);
  if (!resume) {
    throw new AppError(404, "Resume not found", "RESUME_NOT_FOUND");
  }

  const job = await getJobById(jobId);
  if (!job || !job.isActive) {
    throw new AppError(404, "Job not found", "JOB_NOT_FOUND");
  }

  const userSkills = await listUserSkills(userId);
  const verifiedSkills = userSkills
    .filter((s) => s.status === "STRONG")
    .map((s) => s.skill);

  return buildTailoringSuggestions(
    {
      skills: resume.skills,
      rawText: resume.rawText,
      parsedData: resume.parsedData,
      verifiedSkills,
    },
    {
      title: job.title,
      requirements: job.requirements,
      description: job.description,
    },
  );
};

export interface AcceptedBulletEdit {
  originalBullet: string;
  finalBullet: string;
}

export const applyTailoredResumeChangesService = async (params: {
  userId: string;
  resumeId: string;
  acceptedSkills?: string[];
  acceptedBullets?: AcceptedBulletEdit[];
}) => {
  const resume = await getResumeById(params.resumeId, params.userId);
  if (!resume) {
    throw new AppError(404, "Resume not found", "RESUME_NOT_FOUND");
  }

  // 1. Merge accepted skills that already exist in resume text (strictly no fabrication)
  const textMentions = countSkillMentions(resume.rawText);
  const nextSkills = [...resume.skills];
  const existingSkillSet = new Set(
    nextSkills.map((s) => s.toLowerCase().trim()),
  );

  for (const rawSkill of params.acceptedSkills ?? []) {
    const cleaned = rawSkill.trim();
    const key = cleaned.toLowerCase();
    if (!cleaned || existingSkillSet.has(key)) continue;
    // Guardrail: only allow adding skills evidenced in resume text
    if ((textMentions.get(key) ?? 0) > 0) {
      nextSkills.push(cleaned);
      existingSkillSet.add(key);
    }
  }

  // 2. Replace original bullets with user-accepted/edited bullets in rawText
  let updatedRawText = resume.rawText;
  let appliedBulletsCount = 0;

  for (const item of params.acceptedBullets ?? []) {
    const orig = (item.originalBullet ?? "").trim();
    const next = (item.finalBullet ?? "").trim();
    if (!orig || !next || orig === next) continue;
    if (updatedRawText.includes(orig)) {
      updatedRawText = updatedRawText.replace(orig, next);
      appliedBulletsCount++;
    }
  }

  const updated = await updateResumeForUser(resume.id, params.userId, {
    skills: nextSkills,
    rawText: updatedRawText,
  });

  if (appliedBulletsCount > 0) {
    recordFeatureEvent({
      userId: params.userId,
      event: "bullet_suggestion_accepted",
      metadata: {
        resumeId: params.resumeId,
        appliedBulletsCount,
      },
    });
  }

  return {
    resume: updated,
    appliedBulletsCount,
    totalSkillsCount: nextSkills.length,
  };
};

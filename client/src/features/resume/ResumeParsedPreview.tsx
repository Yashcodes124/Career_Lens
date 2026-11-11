import React, { useMemo, useState } from "react";
import {
  Briefcase,
  Check,
  CheckCircle2,
  FileCode2,
  FileText,
  FolderGit2,
  Plus,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  SectionCard,
  SkillBadge,
  Tabs,
} from "../../components/ui";

export interface ResumeRecord {
  id: string;
  title?: string;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  content?: string;
  rawText?: string;
  summary?: string | null;
  skills: string[];
  experience?: Array<
    | string
    | {
        role?: string;
        title?: string;
        company?: string;
        duration?: string;
        period?: string;
        highlights?: string[];
        description?: string;
      }
  >;
  projects?: Array<
    | string
    | {
        name?: string;
        title?: string;
        description?: string;
        technologies?: string[];
        highlights?: string[];
      }
  >;
  status?: "PARSED" | "PROCESSING" | "FAILED" | string;
  createdAt: string;
}

export interface ResumeParsedPreviewProps {
  resume: ResumeRecord;
  isActiveForMatching?: boolean;
  onSetActiveForMatching?: (resumeId: string) => void;
}

const CONFIRMED_SKILLS_KEY = "truehire_confirmed_resume_skills";
const DISMISSED_SKILLS_KEY = "truehire_dismissed_resume_skills";
const CUSTOM_RESUME_SKILLS_KEY = "truehire_custom_resume_skills";

const readSet = (key: string): Set<string> => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? new Set(parsed.map((item) => String(item).toLowerCase()))
      : new Set();
  } catch {
    return new Set();
  }
};

const writeSet = (key: string, set: Set<string>) => {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    // Ignore storage errors
  }
};

const readCustomList = (resumeId: string): string[] => {
  try {
    const raw = localStorage.getItem(`${CUSTOM_RESUME_SKILLS_KEY}_${resumeId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

const writeCustomList = (resumeId: string, list: string[]) => {
  try {
    localStorage.setItem(
      `${CUSTOM_RESUME_SKILLS_KEY}_${resumeId}`,
      JSON.stringify(list),
    );
  } catch {
    // Ignore storage errors
  }
};

// Extract structured sections deterministically from raw text if backend only stored raw text
function deriveSectionsFromRawText(rawText: string) {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const summaryLines = lines.slice(0, 4).join(" ");

  const experienceBlocks: string[] = [];
  const projectBlocks: string[] = [];

  let currentSection: "NONE" | "EXP" | "PROJ" = "NONE";
  for (const line of lines) {
    if (/^(work\s+)?experience|employment|career\s+history/i.test(line)) {
      currentSection = "EXP";
      continue;
    }
    if (
      /^projects?|personal\s+projects|academic\s+projects|key\s+projects/i.test(
        line,
      )
    ) {
      currentSection = "PROJ";
      continue;
    }
    if (
      /^education|certifications|skills|technical\s+skills|achievements/i.test(
        line,
      )
    ) {
      currentSection = "NONE";
      continue;
    }

    if (currentSection === "EXP" && line.length > 12) {
      experienceBlocks.push(line);
    } else if (currentSection === "PROJ" && line.length > 12) {
      projectBlocks.push(line);
    }
  }

  return {
    summary:
      summaryLines ||
      "Resume parsed and indexed for deterministic job requirement matching.",
    experienceLines: experienceBlocks.slice(0, 10),
    projectLines: projectBlocks.slice(0, 8),
  };
}

export const ResumeParsedPreview: React.FC<ResumeParsedPreviewProps> = ({
  resume,
  isActiveForMatching = false,
  onSetActiveForMatching,
}) => {
  const [activeTab, setActiveTab] = useState<string>("summary");
  const [confirmedSkills, setConfirmedSkills] = useState<Set<string>>(() =>
    readSet(CONFIRMED_SKILLS_KEY),
  );
  const [dismissedSkills, setDismissedSkills] = useState<Set<string>>(() =>
    readSet(DISMISSED_SKILLS_KEY),
  );
  const [customSkills, setCustomSkills] = useState<string[]>(() =>
    readCustomList(resume.id),
  );
  const [newSkill, setNewSkill] = useState("");

  const rawText = resume.rawText || resume.content || "";
  const derived = useMemo(() => deriveSectionsFromRawText(rawText), [rawText]);

  const allSkills = useMemo(() => {
    const combined = [...(resume.skills ?? []), ...customSkills];
    const unique: string[] = [];
    const seen = new Set<string>();
    for (const s of combined) {
      const key = s.toLowerCase().trim();
      if (key && !seen.has(key) && !dismissedSkills.has(key)) {
        seen.add(key);
        unique.push(s.trim());
      }
    }
    return unique;
  }, [resume.skills, customSkills, dismissedSkills]);

  const confirmedCount = useMemo(
    () =>
      allSkills.filter((s) => confirmedSkills.has(s.toLowerCase().trim()))
        .length,
    [allSkills, confirmedSkills],
  );

  const handleConfirmSkill = (skill: string) => {
    const key = skill.toLowerCase().trim();
    const next = new Set(confirmedSkills);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setConfirmedSkills(next);
    writeSet(CONFIRMED_SKILLS_KEY, next);
  };

  const handleConfirmAllSkills = () => {
    const next = new Set(confirmedSkills);
    for (const s of allSkills) {
      next.add(s.toLowerCase().trim());
    }
    setConfirmedSkills(next);
    writeSet(CONFIRMED_SKILLS_KEY, next);
  };

  const handleRemoveSkill = (skill: string) => {
    const key = skill.toLowerCase().trim();
    const nextDismissed = new Set(dismissedSkills);
    nextDismissed.add(key);
    setDismissedSkills(nextDismissed);
    writeSet(DISMISSED_SKILLS_KEY, nextDismissed);
  };

  const handleRestoreRemovedSkills = () => {
    const empty = new Set<string>();
    setDismissedSkills(empty);
    writeSet(DISMISSED_SKILLS_KEY, empty);
  };

  const handleAddCustomSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();

    if (dismissedSkills.has(key)) {
      const nextDismissed = new Set(dismissedSkills);
      nextDismissed.delete(key);
      setDismissedSkills(nextDismissed);
      writeSet(DISMISSED_SKILLS_KEY, nextDismissed);
    }

    if (!allSkills.some((s) => s.toLowerCase() === key)) {
      const updated = [...customSkills, trimmed];
      setCustomSkills(updated);
      writeCustomList(resume.id, updated);
    }

    const nextConfirmed = new Set(confirmedSkills);
    nextConfirmed.add(key);
    setConfirmedSkills(nextConfirmed);
    writeSet(CONFIRMED_SKILLS_KEY, nextConfirmed);
    setNewSkill("");
  };

  const experienceItems = useMemo(() => {
    if (Array.isArray(resume.experience) && resume.experience.length > 0) {
      return resume.experience;
    }
    return derived.experienceLines;
  }, [resume.experience, derived.experienceLines]);

  const projectItems = useMemo(() => {
    if (Array.isArray(resume.projects) && resume.projects.length > 0) {
      return resume.projects;
    }
    return derived.projectLines;
  }, [resume.projects, derived.projectLines]);

  const fileExtension = useMemo(() => {
    const name = resume.fileName || resume.title || "";
    if (/\.docx$/i.test(name)) return "DOCX";
    return resume.fileType?.toUpperCase() || "PDF";
  }, [resume]);

  return (
    <SectionCard
      eyebrow="Resume Detail"
      title={resume.fileName || resume.title || "Parsed Resume"}
      description={`Uploaded ${new Date(resume.createdAt).toLocaleDateString()} · ${fileExtension} · ${allSkills.length} active skills (${confirmedCount} confirmed)`}
      action={
        <div className="flex flex-wrap items-center gap-2">
          {isActiveForMatching ? (
            <Badge
              tone="success"
              icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            >
              Active for matching
            </Badge>
          ) : (
            onSetActiveForMatching && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onSetActiveForMatching(resume.id)}
              >
                Use for matching
              </Button>
            )
          )}
        </div>
      }
    >
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        items={[
          {
            id: "summary",
            label: "Summary",
            content: (
              <div className="space-y-4">
                <Card muted padding="md" className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-content-secondary">
                    Extracted Overview
                  </p>
                  <p className="text-sm leading-relaxed text-content-body">
                    {resume.summary || derived.summary}
                  </p>
                </Card>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Card padding="sm" className="space-y-1">
                    <p className="text-xs text-content-secondary">
                      Extracted Skills
                    </p>
                    <p className="text-xl font-semibold text-content-heading tabular-nums">
                      {allSkills.length}
                    </p>
                    <p className="text-xs text-content-secondary">
                      {confirmedCount} confirmed by you
                    </p>
                  </Card>

                  <Card padding="sm" className="space-y-1">
                    <p className="text-xs text-content-secondary">
                      Experience Entries
                    </p>
                    <p className="text-xl font-semibold text-content-heading tabular-nums">
                      {experienceItems.length}
                    </p>
                    <p className="text-xs text-content-secondary">
                      Parsed role & responsibility lines
                    </p>
                  </Card>

                  <Card padding="sm" className="space-y-1">
                    <p className="text-xs text-content-secondary">
                      Project Highlights
                    </p>
                    <p className="text-xl font-semibold text-content-heading tabular-nums">
                      {projectItems.length}
                    </p>
                    <p className="text-xs text-content-secondary">
                      Technical project references
                    </p>
                  </Card>
                </div>
              </div>
            ),
          },
          {
            id: "skills",
            label: "Skills",
            count: allSkills.length,
            content: (
              <div className="space-y-5">
                <Card
                  muted
                  padding="sm"
                  className="flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-content-heading">
                      Confirm or remove extracted skills
                    </p>
                    <p className="text-xs text-content-secondary">
                      Click a skill to toggle confirmation, or click the remove
                      icon (×) to exclude inaccurate keywords from job matching.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {dismissedSkills.size > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRestoreRemovedSkills}
                        leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                      >
                        Restore removed ({dismissedSkills.size})
                      </Button>
                    )}
                    {allSkills.length > 0 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleConfirmAllSkills}
                        leftIcon={<Check className="h-3.5 w-3.5" />}
                      >
                        Confirm all ({allSkills.length})
                      </Button>
                    )}
                  </div>
                </Card>

                {/* Add Skill Control */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <Input
                    label="Add a missing skill to this resume profile"
                    placeholder="e.g., PostgreSQL, GraphQL, Kubernetes"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomSkill();
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={handleAddCustomSkill}
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    Add skill
                  </Button>
                </div>

                {allSkills.length === 0 ? (
                  <EmptyState
                    title="No active skills on this resume"
                    description="Add technical skills above or restore any removed skills."
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {allSkills.map((skill) => {
                      const isConfirmed = confirmedSkills.has(
                        skill.toLowerCase().trim(),
                      );
                      return (
                        <div
                          key={skill}
                          className="inline-flex items-center gap-1 rounded-sm"
                        >
                          <SkillBadge
                            skill={skill}
                            level={isConfirmed ? "VERIFIED" : "EXTRACTED"}
                            meta={isConfirmed ? "Confirmed" : "Extracted"}
                            onRemove={() => handleRemoveSkill(skill)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleConfirmSkill(skill)}
                            aria-label={
                              isConfirmed
                                ? `Unconfirm ${skill}`
                                : `Confirm ${skill}`
                            }
                            title={
                              isConfirmed
                                ? "Confirmed skill (click to undo)"
                                : "Click to confirm this skill"
                            }
                            className="h-6 px-1.5 text-[11px]"
                          >
                            <Check
                              className={`h-3 w-3 ${
                                isConfirmed
                                  ? "text-status-success"
                                  : "text-content-secondary"
                              }`}
                            />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ),
          },
          {
            id: "experience",
            label: "Experience",
            count: experienceItems.length,
            content:
              experienceItems.length === 0 ? (
                <EmptyState
                  title="No structured experience sections detected"
                  description="Inspect the Raw text tab to view the full resume contents."
                />
              ) : (
                <ul className="space-y-3">
                  {experienceItems.map((item, idx) => {
                    if (typeof item === "string") {
                      return (
                        <li key={idx}>
                          <Card padding="sm" className="flex items-start gap-3">
                            <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <p className="text-sm leading-relaxed text-content-body">
                              {item}
                            </p>
                          </Card>
                        </li>
                      );
                    }
                    return (
                      <li key={idx}>
                        <Card padding="md" className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-sm font-semibold text-content-heading">
                              {item.role || item.title || "Engineering Role"}
                              {item.company ? ` · ${item.company}` : ""}
                            </h4>
                            {(item.duration || item.period) && (
                              <Badge tone="neutral" size="sm">
                                {item.duration || item.period}
                              </Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs leading-relaxed text-content-body">
                              {item.description}
                            </p>
                          )}
                          {Array.isArray(item.highlights) &&
                            item.highlights.length > 0 && (
                              <ul className="list-disc space-y-1 pl-4 text-xs text-content-body">
                                {item.highlights.map((h, hIdx) => (
                                  <li key={hIdx}>{h}</li>
                                ))}
                              </ul>
                            )}
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              ),
          },
          {
            id: "projects",
            label: "Projects",
            count: projectItems.length,
            content:
              projectItems.length === 0 ? (
                <EmptyState
                  title="No structured project entries detected"
                  description="Switch to the Raw text tab to inspect your complete project descriptions."
                />
              ) : (
                <ul className="space-y-3">
                  {projectItems.map((proj, idx) => {
                    if (typeof proj === "string") {
                      return (
                        <li key={idx}>
                          <Card padding="sm" className="flex items-start gap-3">
                            <FolderGit2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <p className="text-sm leading-relaxed text-content-body">
                              {proj}
                            </p>
                          </Card>
                        </li>
                      );
                    }
                    return (
                      <li key={idx}>
                        <Card padding="md" className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-sm font-semibold text-content-heading">
                              {proj.name || proj.title || "Technical Project"}
                            </h4>
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                          </div>
                          {proj.description && (
                            <p className="text-xs leading-relaxed text-content-body">
                              {proj.description}
                            </p>
                          )}
                          {Array.isArray(proj.technologies) &&
                            proj.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {proj.technologies.map((tech) => (
                                  <Badge key={tech} tone="neutral" size="sm">
                                    {tech}
                                  </Badge>
                                ))}
                              </div>
                            )}
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              ),
          },
          {
            id: "raw",
            label: "Raw text",
            content: rawText ? (
              <Card muted padding="md">
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-content-heading">
                    <FileCode2 className="h-3.5 w-3.5 text-primary" />
                    <span>Extracted Plain Text</span>
                  </span>
                  <span className="text-xs text-content-secondary tabular-nums">
                    {rawText.length.toLocaleString()} characters
                  </span>
                </div>
                <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-input border border-border bg-surface p-4 font-mono text-xs leading-relaxed text-content-body">
                  {rawText}
                </pre>
              </Card>
            ) : (
              <EmptyState
                title="Raw text unavailable"
                description="This resume record only contains extracted skill metadata."
                icon={<FileText className="h-5 w-5" />}
              />
            ),
          },
        ]}
      />
    </SectionCard>
  );
};

export default ResumeParsedPreview;

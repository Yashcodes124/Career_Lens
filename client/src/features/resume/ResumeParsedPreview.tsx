import React, { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Check,
  CheckCircle2,
  FileCode2,
  FileText,
  FolderGit2,
  GraduationCap,
  Plus,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { fetchResumeById } from "./resumeApi";
import type {
  ParsedEducation,
  ParsedExperience,
  ParsedProject,
  ResumeSummary,
} from "./types";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  SectionCard,
  Skeleton,
  SkillBadge,
  Tabs,
} from "../../components/ui";

export type ResumeRecord = ResumeSummary & {
  status?: "PARSED" | "PROCESSING" | "FAILED" | string;
};

export interface ResumeParsedPreviewProps {
  resume: ResumeRecord;
  isActiveForMatching?: boolean;
  onSetActiveForMatching?: (resumeId: string) => void;
  defaultTab?: string;
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

const formatDuration = (months: number | null | undefined): string | null => {
  if (months === null || months === undefined || months <= 0) return null;
  const years = Math.floor(months / 12);
  const remaining = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yr${years > 1 ? "s" : ""}`);
  if (remaining > 0) parts.push(`${remaining} mo`);
  return parts.join(" ");
};

export const ResumeParsedPreview: React.FC<ResumeParsedPreviewProps> = ({
  resume,
  isActiveForMatching = false,
  onSetActiveForMatching,
  defaultTab = "full",
}) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [fullResume, setFullResume] = useState<ResumeSummary>(resume);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

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

  // Fetch full resume by ID so rawText and complete parsedData are always loaded
  useEffect(() => {
    setFullResume(resume);
    let cancelled = false;
    setLoadingDetail(true);

    fetchResumeById(resume.id)
      .then((detail) => {
        if (!cancelled && detail) {
          setFullResume(detail);
        }
      })
      .catch(() => null)
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });

    return () => {
      cancelled = true;
    };
  }, [resume]);

  const parsed = fullResume.parsedData;
  const rawText = fullResume.rawText ?? "";

  const summaryText =
    parsed?.summary ||
    (rawText
      ? rawText.split(/\r?\n/).filter(Boolean).slice(0, 4).join(" ")
      : "Resume parsed and indexed for deterministic job requirement matching.");

  const experienceItems: ParsedExperience[] = useMemo(
    () => (Array.isArray(parsed?.experience) ? parsed.experience : []),
    [parsed],
  );

  const projectItems: ParsedProject[] = useMemo(
    () => (Array.isArray(parsed?.projects) ? parsed.projects : []),
    [parsed],
  );

  const educationItems: ParsedEducation[] = useMemo(
    () => (Array.isArray(parsed?.education) ? parsed.education : []),
    [parsed],
  );

  const allSkills = useMemo(() => {
    const combined = [
      ...(fullResume.skills ?? []),
      ...(parsed?.skills ?? []),
      ...customSkills,
    ];
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
  }, [fullResume.skills, parsed?.skills, customSkills, dismissedSkills]);

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

  const fileExtension = useMemo(() => {
    const name = fullResume.fileName || fullResume.title || "";
    if (/\.docx$/i.test(name)) return "DOCX";
    if (fullResume.mimeType?.includes("word")) return "DOCX";
    return "PDF";
  }, [fullResume]);

  const totalYears =
    parsed?.totalExperienceYears ?? fullResume.experienceYrs ?? 0;

  return (
    <SectionCard
      eyebrow="Resume Detail"
      title={fullResume.fileName || fullResume.title || "Parsed Resume"}
      description={`Uploaded ${new Date(fullResume.createdAt).toLocaleDateString()} · ${fileExtension} · ${allSkills.length} active skills (${confirmedCount} confirmed) · ${projectItems.length} projects · ${experienceItems.length} experience entries`}
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
                onClick={() => onSetActiveForMatching(fullResume.id)}
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
            id: "full",
            label: "Full Resume",
            content: (
              <div className="space-y-6">
                {/* Summary Banner */}
                <Card muted padding="md" className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Professional Summary
                    </p>
                    <Badge tone="neutral" size="sm">
                      {totalYears} {totalYears === 1 ? "yr" : "yrs"} experience
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-content-body">
                    {summaryText}
                  </p>
                </Card>

                {/* Projects Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-content-heading">
                      <FolderGit2 className="h-4 w-4 text-primary" />
                      <span>Projects ({projectItems.length})</span>
                    </h3>
                  </div>

                  {projectItems.length === 0 ? (
                    <p className="text-xs text-content-secondary">
                      No structured projects listed. Check the Raw text tab for
                      full document text.
                    </p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {projectItems.map((proj, idx) => (
                        <Card
                          key={`${proj.name}-${idx}`}
                          padding="md"
                          className="space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-content-heading">
                              {proj.name || "Technical Project"}
                            </h4>
                            <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
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
                                  <Badge key={tech} tone="primary" size="sm">
                                    {tech}
                                  </Badge>
                                ))}
                              </div>
                            )}
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Experience Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-content-heading">
                      <Briefcase className="h-4 w-4 text-primary" />
                      <span>Work Experience ({experienceItems.length})</span>
                    </h3>
                  </div>

                  {experienceItems.length === 0 ? (
                    <p className="text-xs text-content-secondary">
                      No work experience entries extracted.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {experienceItems.map((exp, idx) => (
                        <li key={`${exp.company}-${idx}`}>
                          <Card padding="md" className="space-y-1.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h4 className="text-sm font-semibold text-content-heading">
                                {exp.role || "Engineering Role"}
                                {exp.company ? ` · ${exp.company}` : ""}
                              </h4>
                              {formatDuration(exp.durationMonths) && (
                                <Badge tone="neutral" size="sm">
                                  {formatDuration(exp.durationMonths)}
                                </Badge>
                              )}
                            </div>
                            {exp.description && (
                              <p className="text-xs leading-relaxed text-content-body">
                                {exp.description}
                              </p>
                            )}
                          </Card>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Education Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-content-heading">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      <span>Education ({educationItems.length})</span>
                    </h3>
                  </div>

                  {educationItems.length === 0 ? (
                    <p className="text-xs text-content-secondary">
                      No education entries extracted.
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {educationItems.map((edu, idx) => (
                        <Card
                          key={`${edu.institution}-${idx}`}
                          padding="sm"
                          className="space-y-1"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-content-heading">
                              {edu.institution || "Institution"}
                            </h4>
                            {(edu.startYear || edu.endYear) && (
                              <Badge tone="neutral" size="sm">
                                {edu.startYear ?? ""}
                                {edu.endYear ? ` – ${edu.endYear}` : ""}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-content-body">
                            {[edu.degree, edu.field]
                              .filter(Boolean)
                              .join(" in ")}
                          </p>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Skills Snapshot */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h3 className="text-sm font-semibold text-content-heading">
                      Extracted Skills ({allSkills.length})
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("skills")}
                    >
                      Confirm or edit skills →
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {allSkills.map((skill) => {
                      const isConfirmed = confirmedSkills.has(
                        skill.toLowerCase().trim(),
                      );
                      return (
                        <SkillBadge
                          key={skill}
                          skill={skill}
                          level={isConfirmed ? "VERIFIED" : "EXTRACTED"}
                          meta={isConfirmed ? "Confirmed" : "Extracted"}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            ),
          },
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
                    {summaryText}
                  </p>
                </Card>

                <div className="grid gap-4 sm:grid-cols-4">
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
                    <p className="text-xs text-content-secondary">Projects</p>
                    <p className="text-xl font-semibold text-content-heading tabular-nums">
                      {projectItems.length}
                    </p>
                    <p className="text-xs text-content-secondary">
                      Parsed project entries
                    </p>
                  </Card>

                  <Card padding="sm" className="space-y-1">
                    <p className="text-xs text-content-secondary">Experience</p>
                    <p className="text-xl font-semibold text-content-heading tabular-nums">
                      {experienceItems.length}
                    </p>
                    <p className="text-xs text-content-secondary">
                      {totalYears} yrs total experience
                    </p>
                  </Card>

                  <Card padding="sm" className="space-y-1">
                    <p className="text-xs text-content-secondary">Education</p>
                    <p className="text-xl font-semibold text-content-heading tabular-nums">
                      {educationItems.length}
                    </p>
                    <p className="text-xs text-content-secondary">
                      Academic qualifications
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
                      Click the check icon (✓) to confirm a skill, or click the
                      remove icon (×) to exclude inaccurate keywords from job
                      matching.
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
                  {experienceItems.map((item, idx) => (
                    <li key={`${item.company}-${idx}`}>
                      <Card padding="md" className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-content-heading">
                            {item.role || "Engineering Role"}
                            {item.company ? ` · ${item.company}` : ""}
                          </h4>
                          {formatDuration(item.durationMonths) && (
                            <Badge tone="neutral" size="sm">
                              {formatDuration(item.durationMonths)}
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs leading-relaxed text-content-body">
                            {item.description}
                          </p>
                        )}
                      </Card>
                    </li>
                  ))}
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
                  {projectItems.map((proj, idx) => (
                    <li key={`${proj.name}-${idx}`}>
                      <Card padding="md" className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-content-heading">
                            {proj.name || "Technical Project"}
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
                                <Badge key={tech} tone="primary" size="sm">
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          )}
                      </Card>
                    </li>
                  ))}
                </ul>
              ),
          },
          {
            id: "education",
            label: "Education",
            count: educationItems.length,
            content:
              educationItems.length === 0 ? (
                <EmptyState
                  title="No structured education entries detected"
                  description="Switch to the Raw text tab to view your full academic details."
                />
              ) : (
                <ul className="space-y-3">
                  {educationItems.map((edu, idx) => (
                    <li key={`${edu.institution}-${idx}`}>
                      <Card padding="md" className="space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-content-heading">
                            {edu.institution || "Institution"}
                          </h4>
                          {(edu.startYear || edu.endYear) && (
                            <Badge tone="neutral" size="sm">
                              {edu.startYear ?? ""}
                              {edu.endYear ? ` – ${edu.endYear}` : ""}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-content-body">
                          {[edu.degree, edu.field].filter(Boolean).join(" in ")}
                        </p>
                      </Card>
                    </li>
                  ))}
                </ul>
              ),
          },
          {
            id: "raw",
            label: "Raw text",
            content:
              loadingDetail && !rawText ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : rawText ? (
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

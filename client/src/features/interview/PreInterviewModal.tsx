import React, { useEffect, useMemo, useState } from "react";
import {
  Sliders,
  Play,
  X,
  Clock,
  Target,
  Plus,
  Loader2,
  Layers,
} from "lucide-react";

interface PreInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartInterview: (config: InterviewConfig) => void | Promise<void>;
  jobTitle?: string;
  dynamicTopics?: string[];
  priorityGaps?: string[];
  matchedSkills?: string[];
  isStarting?: boolean;
}

export interface InterviewConfig {
  durationMinutes: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  focusTopics: string[];
}

const DEFAULT_FALLBACK_TOPICS = [
  "System Design & Architecture",
  "Backend & REST APIs",
  "Database & Data Modeling",
  "Problem Solving & DSA",
  "Debugging & Production Readiness",
];

const DURATION_PRESETS: Record<
  number,
  { rounds: string; questions: string; summary: string }
> = {
  15: {
    rounds: "2 Focused Rounds",
    questions: "3–4 Questions",
    summary: "Rapid skill check on your selected focus skills",
  },
  30: {
    rounds: "3 Balanced Rounds",
    questions: "5–6 Questions",
    summary: "Technical deep-dive + practical project & trade-off scenarios",
  },
  45: {
    rounds: "4 Comprehensive Rounds",
    questions: "7–8 Questions",
    summary: "Core skills, system architecture, debugging & behavioral",
  },
  60: {
    rounds: "4 Full Loop Rounds",
    questions: "9–10 Questions",
    summary: "End-to-end onsite simulation across all selected skills",
  },
};

export const PreInterviewModal: React.FC<PreInterviewModalProps> = ({
  isOpen,
  onClose,
  onStartInterview,
  jobTitle = "Target Role",
  dynamicTopics = [],
  priorityGaps = [],
  matchedSkills = [],
  isStarting = false,
}) => {
  // Combine job skill gaps + matched job skills + dynamicTopics without duplicates
  const availableSkills = useMemo(() => {
    const combined = [...priorityGaps, ...dynamicTopics, ...matchedSkills]
      .map((s) => s.trim())
      .filter(Boolean);

    const unique = Array.from(new Set(combined));
    return unique.length > 0 ? unique : DEFAULT_FALLBACK_TOPICS;
  }, [priorityGaps, dynamicTopics, matchedSkills]);

  const [duration, setDuration] = useState<number>(30);
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">(
    "MEDIUM",
  );
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState<string>("");
  const [extraSkills, setExtraSkills] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Pre-select up to 3 priority job skills by default when modal opens
      const initial =
        priorityGaps.length > 0
          ? priorityGaps.slice(0, 3)
          : availableSkills.slice(0, 3);
      setSelectedTopics(initial);
    }
  }, [isOpen, availableSkills, priorityGaps]);

  if (!isOpen) return null;

  const allDisplaySkills = Array.from(
    new Set([...availableSkills, ...extraSkills]),
  );

  const toggleTopic = (topic: string) => {
    if (isStarting) return;
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    );
  };

  const handleAddCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (!trimmed) return;
    if (!extraSkills.includes(trimmed)) {
      setExtraSkills((prev) => [...prev, trimmed]);
    }
    if (!selectedTopics.includes(trimmed)) {
      setSelectedTopics((prev) => [...prev, trimmed]);
    }
    setCustomSkill("");
  };

  const handleStart = () => {
    if (isStarting) return;
    const finalTopics =
      selectedTopics.length > 0 ? selectedTopics : allDisplaySkills.slice(0, 2);

    void onStartInterview({
      durationMinutes: duration,
      difficulty,
      focusTopics: finalTopics,
    });
  };

  const preset = DURATION_PRESETS[duration] ?? DURATION_PRESETS[30];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-xl border border-zinc-800 bg-[#09090b] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-teal-400">
              <Sliders className="h-3.5 w-3.5" />
              <span>Skill-Driven Interview Customizer</span>
            </div>
            <h2 className="mt-1 text-lg font-semibold text-white">
              Configure Mock Interview
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Role:{" "}
              <span className="font-medium text-zinc-200">{jobTitle}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isStarting}
            className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-1.5 text-zinc-400 transition hover:text-white disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* Duration & Structure Preview */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-zinc-300">
                <Clock className="h-3.5 w-3.5 text-teal-400" />
                <span>Session Duration</span>
              </label>
              <span className="font-mono text-[11px] text-teal-400">
                {preset.rounds} · {preset.questions}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  disabled={isStarting}
                  onClick={() => setDuration(mins)}
                  className={`rounded-lg border py-2 px-3 font-mono text-xs font-semibold transition ${
                    duration === mins
                      ? "border-teal-500/60 bg-teal-500/15 text-teal-300"
                      : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-zinc-500">{preset.summary}</p>
          </div>

          {/* Difficulty Selection */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-zinc-300">
              <Layers className="h-3.5 w-3.5 text-teal-400" />
              <span>Difficulty & Depth</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "EASY", desc: "Fundamentals & Concepts" },
                  { id: "MEDIUM", desc: "Production Scenarios" },
                  { id: "HARD", desc: "Deep Edge Cases & Scale" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={isStarting}
                  onClick={() => setDifficulty(item.id)}
                  className={`rounded-lg border p-2.5 text-left transition ${
                    difficulty === item.id
                      ? "border-teal-500/60 bg-teal-500/15 text-teal-300"
                      : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  <span className="block font-mono text-xs font-semibold">
                    {item.id}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-zinc-400">
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Job Skills & Gap Focus Selector */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-zinc-300">
                <Target className="h-3.5 w-3.5 text-teal-400" />
                <span>
                  Select Job Skills to Practice ({selectedTopics.length} chosen)
                </span>
              </label>
              <button
                type="button"
                disabled={isStarting}
                onClick={() =>
                  setSelectedTopics(
                    selectedTopics.length === allDisplaySkills.length
                      ? [allDisplaySkills[0]]
                      : allDisplaySkills,
                  )
                }
                className="font-mono text-[11px] text-teal-400 hover:text-teal-300"
              >
                {selectedTopics.length === allDisplaySkills.length
                  ? "Reset"
                  : "Select all"}
              </button>
            </div>

            <div className="max-h-40 overflow-y-auto rounded-lg border border-zinc-800/90 bg-zinc-900/30 p-3">
              <div className="flex flex-wrap gap-1.5">
                {allDisplaySkills.map((topic) => {
                  const isSelected = selectedTopics.includes(topic);
                  const isGap = priorityGaps.includes(topic);
                  return (
                    <button
                      key={topic}
                      type="button"
                      disabled={isStarting}
                      onClick={() => toggleTopic(topic)}
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-xs transition ${
                        isSelected
                          ? "border-teal-500/60 bg-teal-500/15 text-teal-200"
                          : "border-zinc-800 bg-[#09090b] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      <span>{topic}</span>
                      {isGap && (
                        <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] uppercase text-amber-300">
                          Gap
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add Any Custom Skill Input */}
            <div className="mt-2.5 flex gap-2">
              <input
                type="text"
                value={customSkill}
                disabled={isStarting}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomSkill();
                  }
                }}
                placeholder="Add any specific skill or topic (e.g., Java, Spring Boot, SQL)..."
                className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-teal-500"
              />
              <button
                type="button"
                disabled={isStarting || !customSkill.trim()}
                onClick={handleAddCustomSkill}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Skill</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between border-t border-zinc-800 pt-4">
          <span className="font-mono text-[11px] text-zinc-500">
            {isStarting
              ? "Building custom questions for your selected skills..."
              : `${selectedTopics.length} skill${selectedTopics.length === 1 ? "" : "s"} · ${duration}m · ${difficulty}`}
          </span>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isStarting}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStart}
              disabled={isStarting || selectedTopics.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-5 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-teal-400 active:scale-[0.98] disabled:opacity-50"
            >
              {isStarting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Generating Session...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Start Session</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

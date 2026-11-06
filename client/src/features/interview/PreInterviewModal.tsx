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
    summary: "Quick check on your selected focus skills",
  },
  30: {
    rounds: "3 Balanced Rounds",
    questions: "5–6 Questions",
    summary:
      "Technical deep-dive plus practical project and trade-off scenarios",
  },
  45: {
    rounds: "4 Comprehensive Rounds",
    questions: "7–8 Questions",
    summary: "Core skills, system architecture, debugging, and behavioral",
  },
  60: {
    rounds: "4 Full Loop Rounds",
    questions: "9–10 Questions",
    summary: "Full onsite simulation across all selected skills",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600">
              <Sliders className="h-3.5 w-3.5" />
              <span>Interview Configuration</span>
            </div>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              Prepare for Interview
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Role:{" "}
              <span className="font-medium text-slate-800">{jobTitle}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isStarting}
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* Duration & Structure Preview */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Clock className="h-3.5 w-3.5 text-blue-600" />
                <span>Duration</span>
              </label>
              <span className="text-xs font-medium text-blue-600">
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
                  className={`rounded-lg border py-2 px-3 text-xs font-semibold tabular-nums transition ${
                    duration === mins
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-slate-500">{preset.summary}</p>
          </div>

          {/* Difficulty Selection */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <Layers className="h-3.5 w-3.5 text-blue-600" />
              <span>Difficulty</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "EASY", label: "Easy", desc: "Core concepts" },
                  {
                    id: "MEDIUM",
                    label: "Medium",
                    desc: "Practical scenarios",
                  },
                  {
                    id: "HARD",
                    label: "Hard",
                    desc: "System scale & trade-offs",
                  },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={isStarting}
                  onClick={() => setDifficulty(item.id)}
                  className={`rounded-lg border p-2.5 text-left transition ${
                    difficulty === item.id
                      ? "border-blue-600 bg-blue-50/70 text-blue-900"
                      : "border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="block text-xs font-semibold">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-slate-500">
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Focus Skills Selector */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Target className="h-3.5 w-3.5 text-blue-600" />
                <span>Focus Skills ({selectedTopics.length} selected)</span>
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
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                {selectedTopics.length === allDisplaySkills.length
                  ? "Reset"
                  : "Select all"}
              </button>
            </div>

            <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
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
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition ${
                        isSelected
                          ? "border-blue-300 bg-blue-50 text-blue-800"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span>{topic}</span>
                      {isGap && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                          Gap
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Skill Input */}
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
                placeholder="Add custom skill (e.g., PostgreSQL, Redis, System Design)..."
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600"
              />
              <button
                type="button"
                disabled={isStarting || !customSkill.trim()}
                onClick={handleAddCustomSkill}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
          <span className="text-xs text-slate-500 tabular-nums">
            {isStarting
              ? "Preparing your targeted questions..."
              : `${selectedTopics.length} skill${
                  selectedTopics.length === 1 ? "" : "s"
                } · ${duration} min · ${difficulty}`}
          </span>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isStarting}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStart}
              disabled={isStarting || selectedTopics.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
            >
              {isStarting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Start interview</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

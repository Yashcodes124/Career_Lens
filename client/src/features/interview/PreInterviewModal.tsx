//PreInterviewModal.tsx

import React, { useEffect, useState } from "react";
import { Sliders, Play, X, Clock, Target, Sparkles, Brain } from "lucide-react";

interface PreInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartInterview: (config: InterviewConfig) => void;
  jobTitle?: string;
  dynamicTopics?: string[];
}

export interface InterviewConfig {
  durationMinutes: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  focusTopics: string[];
}

const AVAILABLE_TOPICS = [
  "System Architecture",
  "Frontend & UI Performance",
  "Backend & API Design",
  "Database & SQL",
  "computer Network Fundamentals",
  "Behavioral & Leadership",
  "Data Structures & Algorithms",
];

export const PreInterviewModal: React.FC<PreInterviewModalProps> = ({
  isOpen,
  onClose,
  onStartInterview,
  jobTitle = "Software Engineer",
  dynamicTopics = [],
}) => {
  //Use the passed backend topics otherwise fallback
  const topicsToDisplay =
    dynamicTopics.length > 0 ? dynamicTopics : AVAILABLE_TOPICS;

  const [duration, setDuration] = useState<number>(30);
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">(
    "MEDIUM",
  );
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  //Initialize the defaults when the model opens or topics load
  useEffect(() => {
    if (topicsToDisplay.length > 0 && selectedTopics.length === 0) {
      setSelectedTopics(topicsToDisplay.slice(0, 2));
    }
  }, [topicsToDisplay]);

  if (!isOpen) return null;

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    );
  };

  const handleStart = () => {
    onStartInterview({
      durationMinutes: duration,
      difficulty,
      focusTopics: selectedTopics,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 ">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-6 space-y-6">
        {/* Modal Header */}
        <div className="flex justify-between items-start border-b border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 mb-1">
              <Sliders className="w-3.5 h-3.5" /> Interview Customizer
            </div>
            <h2 className="text-lg font-bold text-slate-100">
              Configure AI Mock Session
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Target Role: {jobTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Duration Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-teal-400" /> Duration
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[15, 30, 45].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setDuration(mins)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors ${
                  duration === mins
                    ? "bg-teal-700 border-teal-600 text-white "
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                {mins} Mins
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-teal-400" /> Difficulty Level
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["EASY", "MEDIUM", "HARD"] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setDifficulty(level)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors ${
                  difficulty === level
                    ? "bg-teal-700 border-teal-600 text-white "
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Focus Area */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-teal-400" /> Focus Topics
          </label>
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
            {topicsToDisplay.map((topic) => {
              const isSelected = selectedTopics.includes(topic);
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                    isSelected
                      ? "bg-teal-700/20 border-teal-600/50 text-teal-300"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-teal-400" />
                  {topic}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStart}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-teal-700 hover:bg-teal-600 text-white flex items-center gap-2 transition-colors "
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Start Session
          </button>
        </div>
      </div>
    </div>
  );
};

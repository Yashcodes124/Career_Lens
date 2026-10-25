import React from "react";
import type { ResumeSummary } from "./types";

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-2">
    <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
    {children}
  </section>
);

const formatDuration = (months: number | null): string | null => {
  if (months === null || months <= 0) return null;
  const years = Math.floor(months / 12);
  const remaining = months % 12;
  const parts = [];
  if (years) parts.push(`${years} yr${years > 1 ? "s" : ""}`);
  if (remaining) parts.push(`${remaining} mo`);
  return parts.join(" ");
};

export const ResumeParsedPreview: React.FC<{ resume: ResumeSummary }> = ({ resume }) => {
  const parsed = resume.parsedData;

  if (!parsed) {
    return (
      <p className="text-sm text-slate-400">
        This resume was saved without parsed details. Upload it again to read it.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {parsed.summary && (
        <Section title="Summary">
          <p className="text-sm leading-relaxed text-slate-300">{parsed.summary}</p>
        </Section>
      )}

      <Section title={`Skills (${resume.skills.length})`}>
        {resume.skills.length === 0 ? (
          <p className="text-sm text-slate-400">No skills were found in this resume.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {resume.skills.map((skill) => (
              <li
                key={skill}
                className="rounded-lg border border-slate-700 bg-slate-800/70 px-2.5 py-1 text-xs text-slate-200"
              >
                {skill}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {parsed.experience.length > 0 && (
        <Section title="Experience">
          <ul className="space-y-3">
            {parsed.experience.map((item, index) => (
              <li key={`${item.company}-${index}`} className="text-sm">
                <p className="font-medium text-slate-200">
                  {item.role || "Role not listed"}
                  {item.company && <span className="text-slate-400"> at {item.company}</span>}
                </p>
                {formatDuration(item.durationMonths) && (
                  <p className="text-xs text-slate-400">{formatDuration(item.durationMonths)}</p>
                )}
                {item.description && <p className="mt-1 text-slate-400">{item.description}</p>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {parsed.education.length > 0 && (
        <Section title="Education">
          <ul className="space-y-2 text-sm">
            {parsed.education.map((item, index) => (
              <li key={`${item.institution}-${index}`}>
                <p className="font-medium text-slate-200">{item.institution || "Institution not listed"}</p>
                <p className="text-slate-400">
                  {[item.degree, item.field].filter(Boolean).join(", ")}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {parsed.projects.length > 0 && (
        <Section title="Projects">
          <ul className="space-y-3 text-sm">
            {parsed.projects.map((item, index) => (
              <li key={`${item.name}-${index}`}>
                <p className="font-medium text-slate-200">{item.name || "Untitled project"}</p>
                {item.description && <p className="text-slate-400">{item.description}</p>}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
};

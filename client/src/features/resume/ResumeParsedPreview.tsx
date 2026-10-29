import React from "react";
import type { ResumeSummary } from "./types";

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <section className="space-y-2.5 border-t border-zinc-800/80 pt-5 first:border-t-0 first:pt-0">
    <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400">
      {title}
    </h3>
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

export const ResumeParsedPreview: React.FC<{ resume: ResumeSummary }> = ({
  resume,
}) => {
  const parsed = resume.parsedData;

  if (!parsed) {
    return (
      <p className="text-sm text-zinc-400">
        This resume was saved without parsed details. Upload it again to read
        it.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {parsed.summary && (
        <Section title="Summary">
          <p className="text-sm leading-relaxed text-zinc-300">
            {parsed.summary}
          </p>
        </Section>
      )}

      <Section title={`Skills (${resume.skills.length})`}>
        {resume.skills.length === 0 ? (
          <p className="text-sm text-zinc-400">
            No skills were found in this resume.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {resume.skills.map((skill) => (
              <li
                key={skill}
                className="rounded border border-zinc-800 bg-[#09090b] px-2.5 py-1 font-mono text-xs text-zinc-200"
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
              <li
                key={`${item.company}-${index}`}
                className="rounded-lg border border-zinc-800/70 bg-[#09090b]/60 p-3.5 text-sm"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium text-zinc-100">
                    {item.role || "Role not listed"}
                    {item.company && (
                      <span className="text-zinc-400"> · {item.company}</span>
                    )}
                  </p>
                  {formatDuration(item.durationMonths) && (
                    <span className="font-mono text-xs text-zinc-500">
                      {formatDuration(item.durationMonths)}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                    {item.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {parsed.education.length > 0 && (
        <Section title="Education">
          <ul className="space-y-2 text-sm">
            {parsed.education.map((item, index) => (
              <li
                key={`${item.institution}-${index}`}
                className="rounded-lg border border-zinc-800/70 bg-[#09090b]/60 p-3"
              >
                <p className="font-medium text-zinc-100">
                  {item.institution || "Institution not listed"}
                </p>
                <p className="mt-0.5 text-xs text-zinc-400">
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
              <li
                key={`${item.name}-${index}`}
                className="rounded-lg border border-zinc-800/70 bg-[#09090b]/60 p-3.5"
              >
                <p className="font-medium text-zinc-100">
                  {item.name || "Untitled project"}
                </p>
                {item.description && (
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                    {item.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
};

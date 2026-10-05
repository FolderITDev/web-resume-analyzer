import { cn } from '@/lib/cn';
import { type DetectedSkill, type JobMatch } from '@/lib/validation/analysis';

type SkillsGridProps = { skills: readonly DetectedSkill[]; jobMatch: JobMatch | null };

/**
 * Detected skills as glyph cells. With a job description, skills the posting asks for are set
 * in the accent and the ones the resume lacks are added as outlined cells.
 */
export function SkillsGrid({ skills, jobMatch }: SkillsGridProps) {
  const wanted = new Set(jobMatch?.matchedSkills ?? []);
  const missing = jobMatch?.missingSkills ?? [];

  if (skills.length === 0 && missing.length === 0) {
    return (
      <p className="text-ink-2">
        No recognizable skills were found. Name your tools explicitly in each role.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {jobMatch ? (
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-2">
          <li className="flex items-center gap-2">
            <span aria-hidden className="size-2.5 bg-accent" /> Asked for by the job and found
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="size-2.5 border border-dashed border-ink-3" /> Asked for by
            the job, missing
          </li>
        </ul>
      ) : null}
      <ul className="grid grid-cols-2 border-t border-l border-rule sm:grid-cols-3 lg:grid-cols-5">
        {skills.map((skill) => {
          const matched = wanted.has(skill.name);
          return (
            <li
              key={skill.id}
              className="flex min-h-20 flex-col justify-between gap-2 border-r border-b border-rule px-3.5 py-3"
            >
              <span
                className={cn(
                  'text-[1.0625rem] leading-tight',
                  matched ? 'font-[640] text-accent' : 'font-[460]',
                )}
              >
                {skill.name}
                {matched ? <span className="sr-only"> (asked for by the job)</span> : null}
              </span>
              <span className="readout text-ink-3">
                {skill.category} · ×{skill.mentions}
              </span>
            </li>
          );
        })}
        {missing.map((name) => (
          <li
            key={`missing-${name}`}
            className="flex min-h-20 flex-col justify-between gap-2 border-r border-b border-rule px-3.5 py-3"
          >
            <span className="w-fit border-b border-dashed border-ink-3 text-[1.0625rem] leading-tight font-[300] text-ink-2">
              {name}
            </span>
            <span className="readout text-ink-3">Missing</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

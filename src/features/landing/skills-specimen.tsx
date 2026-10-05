'use client';

import { useState } from 'react';

import { cn } from '@/lib/cn';
import { type SkillCategory } from '@/lib/validation/analysis';

export type SpecimenSkill = { id: string; name: string; category: SkillCategory };

const MOBILE_PREVIEW = 16;

const FILTERS: readonly { id: SkillCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'language', label: 'Languages' },
  { id: 'frontend', label: 'Frontend' },
  { id: 'backend', label: 'Backend' },
  { id: 'data', label: 'Data' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'testing', label: 'Testing' },
  { id: 'practice', label: 'Practices' },
  { id: 'design', label: 'Design' },
];

/**
 * The recognized skills as a glyph grid. Filtering dims the other cells instead of removing
 * them, so the grid never reflows and every skill stays in the document for readers and crawlers.
 */
export function SkillsSpecimen({ skills }: { skills: readonly SpecimenSkill[] }) {
  const [filter, setFilter] = useState<SkillCategory | 'all'>('all');
  const [expanded, setExpanded] = useState(false);
  const visible =
    filter === 'all' ? skills.length : skills.filter((skill) => skill.category === filter).length;

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-4 border-b border-rule pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Filter skills by area" className="-mx-1 flex flex-wrap gap-1">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
              className={cn(
                'rounded-xs px-3 py-1.5 text-sm transition-[background-color,color] duration-150 ease-(--ease-out)',
                filter === item.id
                  ? 'bg-accent-soft font-[560] text-accent'
                  : 'text-ink-2 hover:bg-surface hover:text-ink',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="readout text-ink-2" aria-live="polite">
          {visible} of {skills.length} skills
        </p>
      </div>

      <ul className="grid grid-cols-2 border-l border-rule sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {skills.map((skill, index) => {
          const active = filter === 'all' || skill.category === filter;
          // On phones the full list is long; it stays in the document but folds after 16 cells.
          const folded = !expanded && filter === 'all' && index >= MOBILE_PREVIEW;
          return (
            <li
              key={skill.id}
              className={cn(
                'flex min-h-16 flex-col justify-between gap-2 border-r border-b border-rule px-3 py-2.5 transition-[opacity,color] duration-200 ease-(--ease-out) sm:min-h-20 sm:px-3.5 sm:py-3',
                active ? 'opacity-100' : 'opacity-25',
                folded && 'max-sm:hidden',
              )}
            >
              <span
                className={cn(
                  'text-[1.0625rem] leading-tight',
                  active && filter !== 'all' ? 'font-[600]' : 'font-[440]',
                )}
              >
                {skill.name}
              </span>
              <span className="readout text-ink-3">{skill.category}</span>
            </li>
          );
        })}
      </ul>
      {filter === 'all' && skills.length > MOBILE_PREVIEW ? (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className="mt-4 self-start text-sm text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink sm:hidden"
        >
          {expanded ? 'Show fewer skills' : `Show all ${skills.length} skills`}
        </button>
      ) : null}
    </div>
  );
}

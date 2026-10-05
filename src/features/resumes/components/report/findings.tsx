import { Minus, Plus } from 'lucide-react';

import { type Finding, type Recommendation } from '@/lib/validation/analysis';

const SEVERITY = { high: 'High', medium: 'Medium', low: 'Low' } as const;

export function FindingList({
  title,
  findings,
  kind,
  empty,
}: {
  title: string;
  findings: readonly Finding[];
  kind: 'strength' | 'issue';
  empty: string;
}) {
  const Icon = kind === 'strength' ? Plus : Minus;
  return (
    <section aria-label={title} className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-3">
        <h2 className="text-heading font-[540]">{title}</h2>
        <span className="readout text-ink-2">{findings.length}</span>
      </div>
      {findings.length === 0 ? (
        <p className="text-ink-3">{empty}</p>
      ) : (
        <ul className="flex flex-col">
          {findings.map((finding) => (
            <li
              key={finding.ruleId}
              className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3 border-b border-rule py-4"
            >
              <Icon aria-hidden className="mt-1 size-4 text-ink-2" strokeWidth={1.75} />
              <div className="flex flex-col gap-1.5">
                <p className="font-[580]">{finding.title}</p>
                <p className="text-[0.9375rem] leading-relaxed text-ink-2">{finding.detail}</p>
                <p className="readout text-ink-3">
                  {finding.ruleId} · {finding.category}
                  {kind === 'issue' ? ` · ${SEVERITY[finding.severity]} severity` : ''}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Recommendations in priority order; the first three carry the most weight in the score. */
export function RecommendationList({ items }: { items: readonly Recommendation[] }) {
  if (items.length === 0) {
    return (
      <p className="text-lead text-ink-2">Nothing to change: every rule is fully satisfied.</p>
    );
  }
  return (
    <ol className="border-t border-ink">
      {items.map((item, index) => (
        <li
          key={item.ruleId}
          className="grid gap-x-8 gap-y-2 border-b border-rule py-6 md:grid-cols-[3.5rem_minmax(0,1fr)_minmax(0,1.2fr)] md:items-baseline"
        >
          <span
            aria-hidden
            className="text-[2rem] leading-none font-[300] tracking-[-0.03em] text-ink-3 tabular"
          >
            {index + 1}
          </span>
          <p className="text-[1.125rem] leading-snug font-[600]">{item.title}</p>
          <div className="flex flex-col gap-2">
            <p className="leading-relaxed text-ink-2">{item.detail}</p>
            <p className="readout text-ink-3">
              {item.ruleId} · Priority {item.priority}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

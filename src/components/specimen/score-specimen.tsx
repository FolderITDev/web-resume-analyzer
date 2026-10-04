import { type CSSProperties } from 'react';

import { cn } from '@/lib/cn';
import { type Grade } from '@/lib/validation/analysis';

export const GRADE_LABEL: Record<Grade, string> = {
  excellent: 'Excellent',
  strong: 'Strong',
  fair: 'Fair',
  'needs-work': 'Needs work',
};

/** The score sets the numeral's weight: 0 draws at 260, 100 at 820. */
export function weightForScore(score: number): number {
  return Math.round(260 + Math.min(100, Math.max(0, score)) * 5.6);
}

type ScoreSpecimenProps = {
  score: number;
  grade: Grade;
  size?: 'hero' | 'report';
  caption?: string;
  className?: string;
};

/**
 * The score as a type specimen: the numeral's weight and the axis knob both encode the value.
 * On first paint the weight settles from hairline to its final value with @starting-style, so
 * the number itself is always readable and never counts up.
 */
export function ScoreSpecimen({
  score,
  grade,
  size = 'report',
  caption = 'Overall score, weighted across six categories',
  className,
}: ScoreSpecimenProps) {
  const weight = weightForScore(score);
  const style = { '--wght': weight, '--ratio': score / 100 } as CSSProperties;
  return (
    <figure
      className={cn('grid grid-cols-[1fr_auto] grid-rows-[1fr_auto] gap-x-6 gap-y-3', className)}
      style={style}
    >
      <div className="flex min-w-0 flex-col justify-between gap-4">
        <p className="readout text-ink-2">
          Score <span className="text-ink">{score}</span> / 100{' '}
          <span aria-hidden>· wght {weight}</span>
        </p>
        <span
          aria-hidden
          className={cn(
            'block leading-[0.8] tracking-[-0.05em] text-ink tabular',
            'font-(--wght) transition-[font-weight] duration-[1100ms] ease-(--ease-out) starting:font-[200]',
            size === 'hero'
              ? 'text-[clamp(7.5rem,3rem+16vw,17rem)]'
              : 'text-[clamp(6rem,4.5rem+7vw,9.5rem)]',
          )}
        >
          {score}
        </span>
      </div>

      <div aria-hidden className="flex w-9 flex-col items-center gap-2">
        <span className="readout text-ink-3">100</span>
        <div className="relative w-px flex-1 bg-rule">
          <div className="absolute inset-0 origin-bottom [transform:scaleY(var(--ratio))] bg-accent transition-transform duration-[1100ms] ease-(--ease-out) starting:[transform:scaleY(0)]" />
          <div className="absolute inset-0 [transform:translateY(calc(var(--ratio)*-100%))] transition-transform duration-[1100ms] ease-(--ease-out) starting:[transform:translateY(0)]">
            <div className="absolute bottom-0 left-1/2 size-3.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-accent shadow-[0_1px_3px_rgb(13_13_13/0.25)]" />
          </div>
        </div>
        <span className="readout text-ink-3">0</span>
      </div>

      <figcaption className="col-span-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-rule pt-3">
        <span className="text-lg font-[620]">{GRADE_LABEL[grade]}</span>
        <span className="text-sm text-ink-3">{caption}</span>
      </figcaption>
    </figure>
  );
}

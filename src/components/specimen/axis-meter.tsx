import { type CSSProperties } from 'react';

import { cn } from '@/lib/cn';

type AxisMeterProps = {
  label: string;
  value: number;
  max?: number;
  /** Small mono note under the label, such as the category weight. */
  detail?: string;
  /** Position in a list, used to stagger the first-paint sweep. */
  index?: number;
  className?: string;
};

/**
 * A read-only axis slider, as on a variable-font specimen, exposed to assistive tech as a meter.
 * The value lives in a CSS variable so @starting-style can sweep it in with transforms only.
 */
export function AxisMeter({
  label,
  value,
  max = 100,
  detail,
  index = 0,
  className,
}: AxisMeterProps) {
  const ratio = Math.min(max, Math.max(0, value)) / max;
  const style = { '--ratio': ratio, '--delay': `${index * 60}ms` } as CSSProperties;
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn('flex flex-col gap-2.5', className)}
      style={style}
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-[0.9375rem] font-[540]">{label}</span>
        <span className="readout text-ink">{value}</span>
      </div>
      {detail ? <span className="-mt-1 readout text-ink-3">{detail}</span> : null}
      {/* The track is a size container, so the knob travels in cqw without a full-width moving box. */}
      <div className="@container relative h-3.5" aria-hidden>
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-rule" />
        <div className="absolute inset-x-0 top-1/2 -mt-px h-0.5 origin-left [transform:scaleX(var(--ratio))] bg-accent transition-transform delay-(--delay) duration-700 ease-(--ease-out) starting:[transform:scaleX(0)]" />
        <div className="absolute top-1/2 left-0 size-3.5 -translate-1/2 [transform:translateX(calc(var(--ratio)*100cqw))] rounded-full bg-accent shadow-[0_1px_3px_rgb(13_13_13/0.25)] transition-transform delay-(--delay) duration-700 ease-(--ease-out) starting:[transform:translateX(0)]" />
      </div>
    </div>
  );
}

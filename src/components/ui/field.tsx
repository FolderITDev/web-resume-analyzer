import { type ComponentProps, type ReactNode, useId } from 'react';

import { cn } from '@/lib/cn';

const CONTROL =
  'w-full rounded-xs border border-rule-strong bg-raised px-3.5 text-[0.9375rem] text-ink placeholder:text-ink-3 ' +
  'transition-[border-color,box-shadow] duration-150 ease-(--ease-out) hover:border-ink-3 ' +
  'focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--color-accent-soft)] focus-visible:outline-none ' +
  'aria-invalid:border-danger aria-invalid:focus-visible:shadow-[0_0_0_3px_var(--color-danger-soft)]';

type FieldProps = {
  label: string;
  hint?: ReactNode;
  error?: string | undefined;
  optional?: boolean;
  className?: string;
  children: (control: {
    id: string;
    describedBy: string | undefined;
    invalid: boolean;
  }) => ReactNode;
};

/**
 * Label, hint and error wiring for one control. The error replaces the hint and is announced
 * through aria-describedby, so screen readers hear it when the field is focused.
 */
export function Field({ label, hint, error, optional, className, children }: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label
        htmlFor={id}
        className="flex items-baseline justify-between gap-3 text-sm font-[560] text-ink"
      >
        {label}
        {optional ? <span className="text-xs font-normal text-ink-3">Optional</span> : null}
      </label>
      {children({ id, describedBy: message ? messageId : undefined, invalid: Boolean(error) })}
      {message ? (
        <p
          id={messageId}
          className={cn('text-[0.8125rem] leading-snug', error ? 'text-danger' : 'text-ink-3')}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(CONTROL, 'h-11', className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(CONTROL, 'min-h-40 resize-y py-3 leading-relaxed', className)}
      {...props}
    />
  );
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(CONTROL, 'h-10 w-auto cursor-pointer pr-9 text-sm', className)}
      {...props}
    />
  );
}

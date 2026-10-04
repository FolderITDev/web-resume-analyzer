import { CircleAlert, Info } from 'lucide-react';
import { type ComponentProps, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-xs bg-surface motion-reduce:animate-none', className)}
      {...props}
    />
  );
}

type NoticeProps = {
  tone?: 'info' | 'error';
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
};

/** Inline message placed next to what it is about. Errors are announced as alerts. */
export function Notice({ tone = 'info', title, children, action, className }: NoticeProps) {
  const Icon = tone === 'error' ? CircleAlert : Info;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex gap-3 rounded-xs border px-4 py-3.5',
        tone === 'error' ? 'border-danger/30 bg-danger-soft' : 'border-rule bg-surface',
        className,
      )}
    >
      <Icon
        aria-hidden
        className={cn('mt-0.5 size-4 shrink-0', tone === 'error' ? 'text-danger' : 'text-ink-2')}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm font-[600] text-ink">{title}</p>
        {children ? <div className="text-sm leading-relaxed text-ink-2">{children}</div> : null}
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </div>
  );
}

type EmptyStateProps = { title: string; children?: ReactNode; action?: ReactNode };

export function EmptyState({ title, children, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-3 border-y border-rule py-14">
      <p className="text-heading font-[520]">{title}</p>
      {children ? <p className="max-w-[52ch] text-ink-2">{children}</p> : null}
      {action}
    </div>
  );
}

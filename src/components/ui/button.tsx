import Link from 'next/link';
import { type ComponentProps } from 'react';

import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger';
type Size = 'md' | 'sm';

const BASE =
  'inline-flex shrink-0 items-center justify-center gap-2.5 rounded-xs font-[560] whitespace-nowrap select-none ' +
  'transition-[background-color,border-color,color,transform] duration-150 ease-(--ease-out) ' +
  'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-strong',
  secondary: 'border border-ink text-ink hover:bg-surface',
  quiet: 'text-ink-2 hover:bg-surface hover:text-ink',
  danger: 'border border-danger/40 text-danger hover:border-danger hover:bg-danger-soft',
};

const SIZES: Record<Size, string> = {
  md: 'h-11 px-5 text-[0.9375rem]',
  sm: 'h-9 px-3.5 text-sm',
};

export function buttonStyles({
  variant = 'primary',
  size = 'md',
}: { variant?: Variant; size?: Size } = {}) {
  return cn(BASE, VARIANTS[variant], SIZES[size]);
}

type ButtonProps = ComponentProps<'button'> & { variant?: Variant; size?: Size };

export function Button({ variant, size, className, type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(buttonStyles({ variant, size }), className)} {...props} />
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}

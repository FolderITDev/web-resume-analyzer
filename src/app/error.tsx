'use client';

import { Button, ButtonLink } from '@/components/ui/button';

/** Route-level error boundary: explains the failure and offers a retry. */
export default function RouteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      id="main"
      className="mx-auto flex min-h-[60dvh] max-w-[90rem] flex-col justify-center gap-6 px-5 sm:px-8"
    >
      <h1 className="text-title font-[460]">Something went wrong</h1>
      <p className="max-w-[52ch] text-lead text-ink-2">
        The page could not be displayed. Your data is safe; try again, or go back to the analyzer.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/analyze" variant="quiet">
          Back to the analyzer
        </ButtonLink>
      </div>
    </main>
  );
}

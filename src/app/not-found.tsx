import { ArrowRight } from 'lucide-react';

import { ButtonLink } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main
      id="main"
      className="mx-auto flex min-h-dvh max-w-[90rem] flex-col justify-center gap-8 px-5 sm:px-8"
    >
      <p
        aria-hidden
        className="text-[clamp(6rem,4rem+8vw,11rem)] leading-[0.8] font-[220] tracking-[-0.05em] tabular"
      >
        404
      </p>
      <div className="flex max-w-xl flex-col gap-3">
        <h1 className="text-title font-[460]">This page does not exist</h1>
        <p className="text-lead text-ink-2">
          The link may be outdated. The analyzer and its documentation are one click away.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/analyze">
          Analyze a resume
          <ArrowRight aria-hidden />
        </ButtonLink>
        <ButtonLink href="/" variant="quiet">
          Go to the home page
        </ButtonLink>
      </div>
    </main>
  );
}

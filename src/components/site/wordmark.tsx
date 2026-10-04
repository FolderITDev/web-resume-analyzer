import Link from 'next/link';

import { siteConfig } from '@/config/site';

/** Product name with the specimen-style descriptor: who builds it. */
export function Wordmark() {
  return (
    <div className="flex items-center gap-4">
      <Link
        href="/"
        className="text-[1.0625rem] font-[640] tracking-[-0.02em] whitespace-nowrap [font-stretch:108%] sm:text-[1.3125rem]"
      >
        {siteConfig.name}
      </Link>
      <span aria-hidden className="hidden h-8 w-px bg-rule-strong sm:block" />
      <p className="hidden text-[0.8125rem] leading-snug text-ink-2 sm:block">
        Resume scoring
        <br />
        by{' '}
        <a
          href={siteConfig.company.url}
          className="underline decoration-rule-strong underline-offset-3 hover:decoration-ink"
        >
          {siteConfig.company.name}
        </a>
      </p>
    </div>
  );
}

import Link from 'next/link';

import { siteConfig } from '@/config/site';

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-ink">
      <div className="mx-auto grid max-w-[90rem] gap-12 px-5 py-14 sm:px-8 md:grid-cols-[2.3fr_1fr]">
        <div className="flex max-w-md flex-col gap-3">
          <p className="text-lg font-[620]">{siteConfig.company.name}</p>
          <p className="text-sm leading-relaxed text-ink-2">
            {siteConfig.name} is built and maintained by{' '}
            <a
              href={siteConfig.company.url}
              className="text-ink underline decoration-rule-strong underline-offset-3 hover:decoration-ink"
            >
              Folder IT
            </a>
            , a nearshore software development company that designs and builds custom web and mobile
            applications and business platforms.
          </p>
        </div>

        <nav aria-label="This application" className="flex flex-col gap-3 text-sm">
          <p className="font-[600]">{siteConfig.name}</p>
          <ul className="flex flex-col gap-2 text-ink-2">
            <li>
              <Link href="/analyze" className="hover:text-ink">
                Analyze a resume
              </Link>
            </li>
            <li>
              <Link href="/analyses" className="hover:text-ink">
                Analysis history
              </Link>
            </li>
            <li>
              <Link href="/docs/api" className="hover:text-ink">
                API reference
              </Link>
            </li>
            <li>
              <a href={siteConfig.repositoryUrl} className="hover:text-ink">
                Source code on GitHub
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-rule">
        <p className="mx-auto max-w-[90rem] px-5 py-5 text-[0.8125rem] text-ink-3 sm:px-8">
          © 2026 Folder IT · Released under the MIT License
        </p>
      </div>
    </footer>
  );
}

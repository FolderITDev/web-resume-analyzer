import { type Metadata } from 'next';
import { Suspense } from 'react';

import { QueryProvider } from '@/components/providers/query-provider';
import { AppNav } from '@/components/site/app-nav';
import { Wordmark } from '@/components/site/wordmark';

/** The working tool is useful to people, not to search results: it is excluded from the index. */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function ToolLayout({ children }: LayoutProps<'/'>) {
  return (
    <QueryProvider>
      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-30 border-b border-rule bg-paper">
          <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-3 px-5 sm:gap-6 sm:px-8">
            <Wordmark />
            <Suspense fallback={null}>
              <AppNav />
            </Suspense>
          </div>
        </header>
        <main
          id="main"
          className="mx-auto w-full max-w-[90rem] flex-1 px-5 pt-10 pb-24 sm:px-8 lg:pt-14"
        >
          {children}
        </main>
        <footer className="border-t border-rule">
          <p className="mx-auto max-w-[90rem] px-5 py-5 text-[0.8125rem] text-ink-3 sm:px-8">
            Resume Analyzer by Folder IT. Uploaded files are processed in memory and never stored;
            reports expire after 24 hours.
          </p>
        </footer>
      </div>
    </QueryProvider>
  );
}

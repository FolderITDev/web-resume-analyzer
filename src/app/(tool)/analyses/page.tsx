import { type Metadata } from 'next';
import { Suspense } from 'react';

import { Skeleton } from '@/components/ui/feedback';
import { HistoryTable } from '@/features/resumes/components/history-table';

export const metadata: Metadata = { title: 'Analysis history' };

export default function HistoryPage() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <h1 className="text-title font-[460]">Analysis history</h1>
        <p className="max-w-[60ch] text-lead text-ink-2">
          Your own reports from this browser, alongside example reports that show what the analyzer
          finds.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <HistoryTable />
      </Suspense>
    </div>
  );
}

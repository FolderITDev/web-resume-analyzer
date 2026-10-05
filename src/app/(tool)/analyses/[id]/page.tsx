import { type Metadata } from 'next';
import { Suspense } from 'react';

import { AnalysisSkeleton, AnalysisView } from '@/features/resumes/components/analysis-view';

export const metadata: Metadata = { title: 'Analysis report' };

export default function AnalysisPage({ params }: PageProps<'/analyses/[id]'>) {
  return (
    <Suspense fallback={<AnalysisSkeleton />}>
      {params.then(({ id }) => (
        <AnalysisView id={id} />
      ))}
    </Suspense>
  );
}

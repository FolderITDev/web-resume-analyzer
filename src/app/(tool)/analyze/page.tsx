import { type Metadata } from 'next';
import { Suspense } from 'react';

import { Skeleton } from '@/components/ui/feedback';
import { UploadForm } from '@/features/resumes/components/upload-form';

export const metadata: Metadata = { title: 'Analyze a resume' };

const INCLUDED = [
  ['Score', 'Six weighted categories, from structure to impact'],
  ['Skills', 'Every recognized technology and practice, with mentions'],
  ['Experience', 'Years from your dated roles, overlaps counted once'],
  ['Recommendations', 'Ordered by how much they move the score'],
  ['Job match', 'Optional: the skills a posting asks for that you show'],
] as const;

export default function AnalyzePage() {
  return (
    <div className="grid gap-14 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-20">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <h1 className="text-title font-[460]">Analyze a resume</h1>
          <p className="max-w-[54ch] text-lead text-ink-2">
            Upload a PDF or DOCX. The report opens as soon as the upload finishes and fills in while
            the analysis runs.
          </p>
        </div>
        <Suspense fallback={<Skeleton className="h-96" />}>
          <UploadForm />
        </Suspense>
      </div>

      <aside aria-labelledby="included-title" className="flex flex-col gap-5 lg:pt-3">
        <h2 id="included-title" className="text-lg font-[600]">
          What the report includes
        </h2>
        <dl className="border-t border-ink">
          {INCLUDED.map(([term, detail]) => (
            <div key={term} className="flex flex-col gap-1 border-b border-rule py-4">
              <dt className="font-[560]">{term}</dt>
              <dd className="text-[0.9375rem] text-ink-2">{detail}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm leading-relaxed text-ink-3">
          The file is never stored. The report is linked to an anonymous cookie in this browser and
          expires after 24 hours.
        </p>
      </aside>
    </div>
  );
}

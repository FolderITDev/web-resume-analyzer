'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button, ButtonLink } from '@/components/ui/button';
import { Notice, Skeleton } from '@/components/ui/feedback';
import { ApiError } from '@/lib/api/client';
import { formatBytes, formatDateTime } from '@/lib/format';
import { type Analysis } from '@/lib/validation/analysis';

import { analysisQuery, useDeleteAnalysis } from '../queries';
import { AnalysisProgress } from './analysis-progress';
import { Report } from './report/report';

export function AnalysisSkeleton() {
  return (
    <div aria-busy className="flex flex-col gap-12">
      <span className="sr-only">Loading the analysis</span>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-12 w-2/3 max-w-xl" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid gap-12 lg:grid-cols-2">
        <Skeleton className="h-72" />
        <div className="grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-14" />
          ))}
        </div>
      </div>
    </div>
  );
}

function DeleteControl({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const remove = useDeleteAnalysis();

  if (!confirming) {
    return (
      <Button variant="quiet" size="sm" onClick={() => setConfirming(true)}>
        <Trash2 aria-hidden />
        Delete
      </Button>
    );
  }
  return (
    <div role="group" aria-label="Confirm deletion" className="flex items-center gap-2">
      <span className="text-sm text-ink-2">Delete this report?</span>
      <Button
        variant="danger"
        size="sm"
        disabled={remove.isPending}
        onClick={() => remove.mutate(id, { onSuccess: () => router.replace('/analyses') })}
      >
        {remove.isPending ? 'Deleting…' : 'Delete'}
      </Button>
      <Button
        variant="quiet"
        size="sm"
        disabled={remove.isPending}
        onClick={() => setConfirming(false)}
      >
        Keep
      </Button>
      {remove.isError ? (
        <span role="alert" className="text-sm text-danger">
          {remove.error instanceof ApiError
            ? remove.error.message
            : 'The report could not be deleted.'}
        </span>
      ) : null}
    </div>
  );
}

function ReportHeader({ analysis }: { analysis: Analysis }) {
  return (
    <header className="flex flex-col gap-5 border-b border-rule pb-8 md:flex-row md:items-end md:justify-between">
      <div className="flex min-w-0 flex-col gap-3">
        <h1 className="text-title font-[460] break-words">{analysis.file.name}</h1>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
          <span>
            {analysis.file.type.toUpperCase()} · {formatBytes(analysis.file.sizeBytes)}
          </span>
          <span>{formatDateTime(analysis.completedAt ?? analysis.createdAt)}</span>
          {analysis.jobTitle ? <span>Compared with: {analysis.jobTitle}</span> : null}
          {analysis.isExample ? <span>Example report</span> : null}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {analysis.isExample ? null : <DeleteControl id={analysis.id} />}
        <ButtonLink href="/analyze" variant="secondary" size="sm">
          Analyze another
          <ArrowRight aria-hidden />
        </ButtonLink>
      </div>
    </header>
  );
}

/** Follows one analysis from queued to its report, polling until the pipeline finishes. */
export function AnalysisView({ id }: { id: string }) {
  const query = useQuery(analysisQuery(id));

  if (query.isPending) return <AnalysisSkeleton />;

  if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div className="flex max-w-2xl flex-col gap-6">
        <h1 className="text-title font-[460]">
          {notFound ? 'Report not found' : 'The report could not be loaded'}
        </h1>
        <Notice
          tone={notFound ? 'info' : 'error'}
          title={
            notFound
              ? 'This report does not exist or belongs to another browser.'
              : query.error.message
          }
          action={
            notFound ? (
              <ButtonLink href="/analyses" variant="secondary" size="sm">
                Open the history
              </ButtonLink>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => void query.refetch()}>
                Try again
              </Button>
            )
          }
        >
          {notFound
            ? 'Reports are private to the browser that uploaded them and expire after 24 hours.'
            : null}
        </Notice>
      </div>
    );
  }

  return <AnalysisContent analysis={query.data} />;
}

function AnalysisContent({ analysis }: { analysis: Analysis }) {
  if (analysis.status === 'failed') {
    return (
      <div className="flex max-w-2xl flex-col gap-6">
        <h1 className="text-title font-[460]">This resume could not be analyzed</h1>
        <Notice
          tone="error"
          title={analysis.error?.message ?? 'The analysis failed.'}
          action={
            <ButtonLink href="/analyze" variant="secondary" size="sm">
              Upload another file
            </ButtonLink>
          }
        />
      </div>
    );
  }

  if (!analysis.report) return <AnalysisProgress analysis={analysis} stage={analysis.stage} />;

  return (
    <article className="flex animate-rise flex-col gap-12">
      <ReportHeader analysis={analysis} />
      <Report report={analysis.report} />
    </article>
  );
}

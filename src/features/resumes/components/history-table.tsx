'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useEffectEvent, useState } from 'react';

import { GRADE_LABEL, weightForScore } from '@/components/specimen/score-specimen';
import { Button, ButtonLink } from '@/components/ui/button';
import { EmptyState, Notice, Skeleton } from '@/components/ui/feedback';
import { Input, Select } from '@/components/ui/field';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { type AnalysisSummary, ListAnalysesQuerySchema } from '@/lib/validation/analysis';

import { analysesQuery, toSearchParams } from '../queries';

const STATUS_LABEL = {
  queued: 'Queued',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
} as const;
const SEARCH_DEBOUNCE_MS = 300;

function ScoreCell({ item }: { item: AnalysisSummary }) {
  if (item.score === null || !item.grade)
    return <span className="text-ink-3">{STATUS_LABEL[item.status]}</span>;
  return (
    <span className="flex items-baseline gap-3">
      <span
        className="w-9 text-[1.375rem] leading-none tracking-[-0.02em] tabular"
        style={{ fontWeight: weightForScore(item.score) }}
      >
        {item.score}
      </span>
      <span className="hidden text-sm text-ink-2 sm:inline">{GRADE_LABEL[item.grade]}</span>
    </span>
  );
}

function RowsSkeleton() {
  return (
    <div aria-hidden className="flex flex-col">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex items-center gap-6 border-b border-rule py-4">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="hidden h-5 w-40 md:block" />
          <Skeleton className="h-5 w-24" />
        </div>
      ))}
    </div>
  );
}

/**
 * The analysis history. Search, filters, sort and page live in the URL, so every view can be
 * shared or bookmarked and the back button behaves.
 */
export function HistoryTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const parsed = ListAnalysesQuerySchema.safeParse(Object.fromEntries(searchParams));
  const query = parsed.success ? parsed.data : ListAnalysesQuerySchema.parse({});
  const [search, setSearch] = useState(query.q ?? '');
  const [syncedQuery, setSyncedQuery] = useState(query.q);
  // Follow URL changes made elsewhere, such as a navigation link, without fighting the typing.
  if (query.q !== syncedQuery) {
    setSyncedQuery(query.q);
    if ((query.q ?? '') !== search.trim()) setSearch(query.q ?? '');
  }

  const result = useQuery(analysesQuery(query));

  function update(changes: Partial<typeof query>) {
    const next = { ...query, page: 1, ...changes };
    router.replace(`${pathname}?${toSearchParams(next)}`, { scroll: false });
  }

  const applySearch = useEffectEvent((value: string) => {
    if (value !== (query.q ?? '')) update({ q: value || undefined });
  });

  // Debounce typing into the URL; clearing the field applies at once.
  useEffect(() => {
    const value = search.trim();
    const timer = setTimeout(() => applySearch(value), value ? SEARCH_DEBOUNCE_MS : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const data = result.data;
  const pageCount = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-3"
          />
          <Input
            type="search"
            aria-label="Search by file name or job title"
            placeholder="Search file name or job title"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-ink-2">
            Status
            <Select
              value={query.status ?? ''}
              onChange={(event) =>
                update({ status: (event.target.value || undefined) as typeof query.status })
              }
            >
              <option value="">All</option>
              {Object.entries(STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-2">
            Sort
            <Select
              value={query.sort}
              onChange={(event) => update({ sort: event.target.value as typeof query.sort })}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="score-desc">Highest score</option>
              <option value="score-asc">Lowest score</option>
            </Select>
          </label>
        </div>
      </div>

      {result.isPending ? (
        <RowsSkeleton />
      ) : result.isError ? (
        <Notice
          tone="error"
          title="The history could not be loaded"
          action={
            <Button variant="secondary" size="sm" onClick={() => void result.refetch()}>
              Try again
            </Button>
          }
        >
          {result.error.message}
        </Notice>
      ) : data && data.items.length === 0 ? (
        <EmptyState
          title={query.q || query.status ? 'No analyses match these filters' : 'No analyses yet'}
          action={
            query.q || query.status ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('');
                  update({ q: undefined, status: undefined });
                }}
              >
                Clear filters
              </Button>
            ) : (
              <ButtonLink href="/analyze">Analyze a resume</ButtonLink>
            )
          }
        >
          {query.q || query.status
            ? 'Try a different search or clear the filters.'
            : 'Upload a resume to see its report here.'}
        </EmptyState>
      ) : data ? (
        <div
          className={cn(
            'transition-opacity duration-200',
            result.isPlaceholderData && 'opacity-60',
          )}
          aria-busy={result.isFetching}
        >
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Analyses, {data.total} in total</caption>
            <thead>
              <tr className="border-b border-ink">
                <th scope="col" className="py-3 pr-4 readout font-normal text-ink-2">
                  Score
                </th>
                <th scope="col" className="py-3 pr-4 readout font-normal text-ink-2">
                  Resume
                </th>
                <th
                  scope="col"
                  className="hidden py-3 pr-4 readout font-normal text-ink-2 md:table-cell"
                >
                  Compared with
                </th>
                <th
                  scope="col"
                  className="hidden py-3 readout font-normal text-ink-2 sm:table-cell"
                >
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr
                  key={item.id}
                  className="group relative border-b border-rule transition-colors duration-150 hover:bg-surface"
                >
                  <td className="py-4 pr-4 pl-1 align-middle">
                    <ScoreCell item={item} />
                  </td>
                  <td className="py-4 pr-4 align-middle">
                    <Link
                      href={`/analyses/${item.id}`}
                      className="font-[540] break-words after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-accent"
                    >
                      {item.fileName}
                    </Link>
                    {item.isExample ? (
                      <span className="ml-2 text-sm text-ink-3">Example</span>
                    ) : null}
                  </td>
                  <td className="hidden py-4 pr-4 align-middle text-ink-2 md:table-cell">
                    {item.jobTitle ?? '—'}
                  </td>
                  <td className="hidden py-4 align-middle text-sm whitespace-nowrap text-ink-2 sm:table-cell">
                    {formatDate(item.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <nav
            aria-label="Pagination"
            className="flex flex-wrap items-center justify-between gap-4 pt-5"
          >
            <p className="readout text-ink-2">
              Page {data.page} of {pageCount} · {data.total} analyses
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={data.page <= 1}
                onClick={() => update({ page: data.page - 1 })}
              >
                <ArrowLeft aria-hidden />
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={data.page >= pageCount}
                onClick={() => update({ page: data.page + 1 })}
              >
                Next
                <ArrowRight aria-hidden />
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}

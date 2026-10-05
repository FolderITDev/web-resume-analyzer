import { keepPreviousData, queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';

import { ApiError, apiDelete, apiRequest } from '@/lib/api/client';
import {
  type AnalysisList,
  AnalysisListSchema,
  AnalysisSchema,
  type ListAnalysesQuery,
} from '@/lib/validation/analysis';

const POLL_INTERVAL_MS = 700;

export const analysisKeys = {
  all: ['analyses'] as const,
  lists: () => [...analysisKeys.all, 'list'] as const,
  list: (query: ListAnalysesQuery) => [...analysisKeys.lists(), query] as const,
  detail: (id: string) => [...analysisKeys.all, 'detail', id] as const,
};

/** One analysis. Polls while the pipeline runs and stops at a terminal status. */
export function analysisQuery(id: string) {
  return queryOptions({
    queryKey: analysisKeys.detail(id),
    queryFn: ({ signal }) =>
      apiRequest(`/resumes/analyses/${encodeURIComponent(id)}`, AnalysisSchema, { signal }),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'completed' || status === 'failed' ? false : POLL_INTERVAL_MS;
    },
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  });
}

export function toSearchParams(query: ListAnalysesQuery): URLSearchParams {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
    sort: query.sort,
  });
  if (query.status) params.set('status', query.status);
  if (query.q) params.set('q', query.q);
  return params;
}

/** A page of the history. The previous page stays on screen while the next one loads. */
export function analysesQuery(query: ListAnalysesQuery) {
  return queryOptions({
    queryKey: analysisKeys.list(query),
    queryFn: ({ signal }) =>
      apiRequest(`/resumes/analyses?${toSearchParams(query)}`, AnalysisListSchema, { signal }),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

/**
 * Deletes an analysis optimistically: it disappears from every cached list at once, and the
 * lists are restored if the server refuses.
 */
export function useDeleteAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/resumes/analyses/${encodeURIComponent(id)}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: analysisKeys.lists() });
      const snapshots = queryClient.getQueriesData<AnalysisList>({
        queryKey: analysisKeys.lists(),
      });
      for (const [key, list] of snapshots) {
        if (!list) continue;
        queryClient.setQueryData<AnalysisList>(key, {
          ...list,
          items: list.items.filter((item) => item.id !== id),
          total: Math.max(0, list.total - 1),
        });
      }
      return { snapshots };
    },
    onError: (_error, _id, context) => {
      for (const [key, list] of context?.snapshots ?? []) queryClient.setQueryData(key, list);
    },
    onSettled: (_data, _error, id) => {
      queryClient.removeQueries({ queryKey: analysisKeys.detail(id) });
      return queryClient.invalidateQueries({ queryKey: analysisKeys.lists() });
    },
  });
}

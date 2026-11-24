import { useQuery } from '@tanstack/react-query';
import { withLoadingFeedback } from '../../../lib/loading-feedback';
import { summaryApi } from '../api/summary.api';

const SUMMARY_STALE_TIME_MS = 60_000;

export const summaryQueryKey = ['summary'] as const;

export function useSummary() {
  return useQuery({
    queryKey: summaryQueryKey,
    queryFn: () => withLoadingFeedback(() => summaryApi.get()),
    staleTime: SUMMARY_STALE_TIME_MS,
    retry: false,
  });
}

import { useQuery } from '@tanstack/react-query';
import { withLoadingFeedback } from '../../../lib/loading-feedback';
import { servicesApi } from '../api/services.api';

const SERVICES_STALE_TIME_MS = 60_000;

export const servicesQueryKey = ['services'] as const;

export function useServices() {
  return useQuery({
    queryKey: servicesQueryKey,
    queryFn: () => withLoadingFeedback(() => servicesApi.list()),
    staleTime: SERVICES_STALE_TIME_MS,
    retry: false,
  });
}

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { withLoadingFeedback } from '../../../lib/loading-feedback';
import { clientsApi } from '../api/clients.api';
import type { ClientsQuery } from '../api/clients.api';

const CLIENTS_STALE_TIME_MS = 30_000;

export function useServiceClients(serviceId: string, query: ClientsQuery) {
  return useQuery({
    queryKey: ['service-clients', serviceId, query.page, query.search],
    queryFn: () => withLoadingFeedback(() => clientsApi.list(serviceId, query)),
    staleTime: CLIENTS_STALE_TIME_MS,
    placeholderData: keepPreviousData,
    retry: false,
  });
}

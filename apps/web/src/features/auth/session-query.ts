import { queryOptions } from '@tanstack/react-query';
import { authApi } from './api/auth.api';

export const sessionQuery = queryOptions({
  queryKey: ['session'],
  queryFn: () => authApi.me(),
  staleTime: 0,
});

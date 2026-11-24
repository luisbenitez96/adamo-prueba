import { useQuery } from '@tanstack/react-query';
import { sessionQuery } from '../session-query';

export function useSession() {
  return useQuery({ ...sessionQuery, staleTime: Infinity });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { ROUTES } from '../../../app/routes';
import { withLoadingFeedback } from '../../../lib/loading-feedback';
import { servicesQueryKey } from '../../dashboard/hooks/use-services';
import { authApi } from '../api/auth.api';
import { sessionQuery } from '../session-query';

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => withLoadingFeedback(() => authApi.logout()),
    onSuccess: () => {
      queryClient.setQueryData(sessionQuery.queryKey, null);
      queryClient.removeQueries({ queryKey: servicesQueryKey });
      navigate(ROUTES.login, { replace: true });
    },
  });
}

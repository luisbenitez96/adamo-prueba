import { useMutation } from '@tanstack/react-query';
import { withLoadingFeedback } from '../../../lib/loading-feedback';
import { authApi } from '../api/auth.api';

export function useRegister() {
  return useMutation({
    mutationFn: (email: string) => withLoadingFeedback(() => authApi.register(email)),
  });
}

import { useMutation } from '@tanstack/react-query';
import { withLoadingFeedback } from '../../../lib/loading-feedback';
import { authApi } from '../api/auth.api';
import type { LoginValues } from '../schemas';

export function useLogin() {
  return useMutation({
    mutationFn: (credentials: LoginValues) => withLoadingFeedback(() => authApi.login(credentials)),
  });
}

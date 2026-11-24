import { useMutation } from '@tanstack/react-query';
import { withLoadingFeedback } from '../../../lib/loading-feedback';
import { authApi } from '../api/auth.api';
import type { ChangePasswordValues } from '../schemas';

export function useChangePassword() {
  return useMutation({
    mutationFn: (values: ChangePasswordValues) =>
      withLoadingFeedback(() => authApi.changePassword(values)),
  });
}

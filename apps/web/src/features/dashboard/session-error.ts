import { ApiError } from '../../lib/http';

const SESSION_ERROR_STATUSES = [401, 403];

export function isSessionError(error: unknown): boolean {
  return error instanceof ApiError && SESSION_ERROR_STATUSES.includes(error.status);
}

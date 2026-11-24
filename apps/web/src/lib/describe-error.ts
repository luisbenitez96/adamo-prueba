import { ApiError } from './http';

const SERVER_ERROR_MESSAGE =
  'Tuvimos un problema en el servidor. Inténtalo de nuevo en unos minutos.';
const UNKNOWN_ERROR_MESSAGE = 'Ocurrió un error inesperado. Inténtalo de nuevo.';

export function describeError(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return UNKNOWN_ERROR_MESSAGE;
  }

  return error.status >= 500 ? SERVER_ERROR_MESSAGE : error.message;
}

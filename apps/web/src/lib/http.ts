export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ErrorBody {
  error?: { code?: unknown; message?: unknown };
}

const NETWORK_ERROR_MESSAGE =
  'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
const UNKNOWN_ERROR_MESSAGE = 'Ocurrió un error inesperado. Inténtalo de nuevo.';

async function toApiError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => null)) as ErrorBody | null;
  const code = body?.error?.code;
  const message = body?.error?.message;

  return new ApiError(
    response.status,
    typeof code === 'string' ? code : 'UNKNOWN_ERROR',
    typeof message === 'string' ? message : UNKNOWN_ERROR_MESSAGE,
  );
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', NETWORK_ERROR_MESSAGE);
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const http = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
};

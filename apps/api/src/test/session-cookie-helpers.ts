import type { Response } from 'supertest';
import { TEST_COOKIE_NAME } from './create-test-app.js';

export function sessionCookieOf(response: Response): string | undefined {
  const cookies = response.headers['set-cookie'] as unknown as string[] | undefined;
  return cookies?.find((cookie) => cookie.startsWith(`${TEST_COOKIE_NAME}=`));
}

export function tokenOf(response: Response): string {
  const cookie = sessionCookieOf(response);
  const token = cookie?.match(new RegExp(`^${TEST_COOKIE_NAME}=([^;]+)`))?.[1];
  if (!token) {
    throw new Error('La respuesta no trae cookie de sesión');
  }
  return token;
}

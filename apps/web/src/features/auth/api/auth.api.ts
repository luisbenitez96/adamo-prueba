import { http } from '../../../lib/http';
import { meResponseSchema, sessionSchema } from '../schemas';
import type { ChangePasswordValues, LoginValues, Session } from '../schemas';

export const authApi = {
  async login(credentials: LoginValues): Promise<Session> {
    return sessionSchema.parse(await http.post('/api/auth/login', credentials));
  },

  async me(): Promise<Session | null> {
    const { session } = meResponseSchema.parse(await http.get('/api/auth/me'));
    return session;
  },

  async changePassword(values: ChangePasswordValues): Promise<Session> {
    return sessionSchema.parse(await http.post('/api/auth/change-password', values));
  },

  async logout(): Promise<void> {
    await http.post('/api/auth/logout');
  },

  async register(email: string): Promise<void> {
    await http.post('/api/auth/register', { email });
  },

  async forgotPassword(email: string): Promise<void> {
    await http.post('/api/auth/forgot-password', { email });
  },
};

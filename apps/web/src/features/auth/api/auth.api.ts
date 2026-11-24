import { http } from '../../../lib/http';
import { sessionSchema } from '../schemas';
import type { LoginValues, Session } from '../schemas';

export const authApi = {
  async login(credentials: LoginValues): Promise<Session> {
    return sessionSchema.parse(await http.post('/api/auth/login', credentials));
  },

  async register(email: string): Promise<void> {
    await http.post('/api/auth/register', { email });
  },

  async forgotPassword(email: string): Promise<void> {
    await http.post('/api/auth/forgot-password', { email });
  },
};

import type { TokenScope } from '../shared/security/token-service.js';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        scope: TokenScope;
      };
    }
  }
}

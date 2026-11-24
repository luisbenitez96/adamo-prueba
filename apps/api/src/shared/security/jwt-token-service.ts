import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { InvalidSessionError } from '../errors/invalid-session-error.js';
import { TOKEN_SCOPES } from './token-service.js';
import type { TokenPayload, TokenService } from './token-service.js';

const ALGORITHM = 'HS256';

const tokenPayloadSchema = z.object({
  sub: z.string().min(1),
  scope: z.enum(TOKEN_SCOPES),
});

export class JwtTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresInSeconds: number,
  ) {}

  sign(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret, {
      algorithm: ALGORITHM,
      expiresIn: this.expiresInSeconds,
    });
  }

  verify(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.secret, { algorithms: [ALGORITHM] });
      return tokenPayloadSchema.parse(decoded);
    } catch {
      throw new InvalidSessionError();
    }
  }
}

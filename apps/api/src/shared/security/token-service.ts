export const TOKEN_SCOPES = ['password-change', 'full'] as const;

export type TokenScope = (typeof TOKEN_SCOPES)[number];

export interface TokenPayload {
  sub: string;
  scope: TokenScope;
}

export interface TokenService {
  sign(payload: TokenPayload): string;
  verify(token: string): TokenPayload;
}

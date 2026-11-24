import type { Request, Response } from 'express';

interface SessionCookieOptions {
  name: string;
  secure: boolean;
  maxAgeMs: number;
}

export class SessionCookie {
  constructor(private readonly options: SessionCookieOptions) {}

  set(res: Response, token: string): void {
    res.cookie(this.options.name, token, {
      ...this.baseAttributes(),
      maxAge: this.options.maxAgeMs,
    });
  }

  clear(res: Response): void {
    res.clearCookie(this.options.name, this.baseAttributes());
  }

  read(req: Request): string | undefined {
    const value: unknown = req.cookies?.[this.options.name];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }

  private baseAttributes() {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: this.options.secure,
      path: '/',
    };
  }
}

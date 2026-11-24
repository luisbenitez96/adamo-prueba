import type { RequestHandler } from 'express';
import type { LoginRequestBody } from './auth.schemas.js';
import type { SessionCookie } from './session-cookie.js';
import type { SessionService } from './session.service.js';

export class SessionController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly sessionCookie: SessionCookie,
  ) {}

  login: RequestHandler = async (req, res) => {
    const { email, password } = req.body as LoginRequestBody;
    const { token, ...currentUser } = await this.sessionService.login(email, password);

    this.sessionCookie.set(res, token);
    res.json(currentUser);
  };

  me: RequestHandler = async (req, res) => {
    const token = this.sessionCookie.read(req);
    const session = await this.sessionService.sessionFor(token);

    if (token && !session) {
      this.sessionCookie.clear(res);
    }

    res.set('Cache-Control', 'no-store');
    res.json({ session });
  };

  logout: RequestHandler = (_req, res) => {
    this.sessionCookie.clear(res);
    res.status(204).end();
  };
}

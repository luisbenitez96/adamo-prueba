import type { RequestHandler } from 'express';
import type { ChangePasswordRequestBody } from './auth.schemas.js';
import { getAuthContext } from './authenticate.js';
import type { PasswordChangeService } from './password-change.service.js';
import type { SessionCookie } from './session-cookie.js';

export class PasswordChangeController {
  constructor(
    private readonly passwordChangeService: PasswordChangeService,
    private readonly sessionCookie: SessionCookie,
  ) {}

  changePassword: RequestHandler = async (req, res) => {
    const { userId, scope } = getAuthContext(req);
    const { newPassword } = req.body as ChangePasswordRequestBody;
    const { token, ...currentUser } = await this.passwordChangeService.changePassword(
      userId,
      scope,
      newPassword,
    );

    this.sessionCookie.set(res, token);
    res.json(currentUser);
  };
}

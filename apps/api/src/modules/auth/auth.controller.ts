import type { RequestHandler } from 'express';
import type { AuthService } from './auth.service.js';
import type { EmailRequestBody } from './auth.schemas.js';

const EMAIL_REQUEST_ACCEPTED = {
  message: 'Si el correo es válido, en unos minutos recibirás un mensaje con las instrucciones.',
};

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register: RequestHandler = async (req, res) => {
    const { email } = req.body as EmailRequestBody;
    await this.authService.register(email);
    res.status(202).json(EMAIL_REQUEST_ACCEPTED);
  };

  forgotPassword: RequestHandler = async (req, res) => {
    const { email } = req.body as EmailRequestBody;
    await this.authService.forgotPassword(email);
    res.status(202).json(EMAIL_REQUEST_ACCEPTED);
  };
}

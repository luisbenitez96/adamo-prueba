import { AppError } from '../../shared/errors/app-error.js';

export class DuplicateEmailError extends AppError {
  constructor() {
    super(409, 'EMAIL_ALREADY_REGISTERED', 'Este correo ya está registrado');
    this.name = 'DuplicateEmailError';
  }
}

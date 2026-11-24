import { AppError } from '../../shared/errors/app-error.js';

export class DuplicateEmailError extends AppError {
  constructor() {
    super(409, 'EMAIL_ALREADY_REGISTERED', 'Ya existe una cuenta con ese correo');
    this.name = 'DuplicateEmailError';
  }
}

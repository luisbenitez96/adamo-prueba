import { AppError } from './app-error.js';

export class InvalidSessionError extends AppError {
  constructor() {
    super(401, 'INVALID_TOKEN', 'La sesión no es válida o ya expiró');
    this.name = 'InvalidSessionError';
  }
}

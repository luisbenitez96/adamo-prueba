import { AppError } from '../../shared/errors/app-error.js';

export class AccountNotFoundError extends AppError {
  constructor() {
    super(404, 'ACCOUNT_NOT_FOUND', 'No encontramos una cuenta con este correo');
    this.name = 'AccountNotFoundError';
  }
}

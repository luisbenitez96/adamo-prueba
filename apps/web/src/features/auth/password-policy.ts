const MIN_PASSWORD_LENGTH = 8;

export const PASSWORD_POLICY_HINT = 'Al menos 8 caracteres, una mayúscula y un número.';

export function meetsPasswordPolicy(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH && /[A-Z]/.test(password) && /\d/.test(password);
}

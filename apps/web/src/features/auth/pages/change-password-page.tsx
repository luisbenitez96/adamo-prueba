import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { ROUTES } from '../../../app/routes';
import { Button } from '../../../components/ui/button';
import { FormAlert } from '../../../components/ui/form-alert';
import { PasswordField } from '../../../components/ui/password-field';
import { TextLink } from '../../../components/ui/text-link';
import { describeError } from '../../../lib/describe-error';
import { ApiError } from '../../../lib/http';
import { AuthFormShell } from '../components/auth-form-shell';
import { authFormStyles } from '../components/auth-form.styles';
import { useChangePassword } from '../hooks/use-change-password';
import { PASSWORD_POLICY_HINT } from '../password-policy';
import { changePasswordSchema } from '../schemas';
import type { ChangePasswordValues } from '../schemas';

const PASSWORD_REUSED = 'PASSWORD_REUSED';
const UNAUTHORIZED_STATUS = 401;

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const changePassword = useChangePassword();
  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  useEffect(() => {
    setFocus('newPassword');
  }, [setFocus]);

  const { error } = changePassword;
  const reusedPasswordMessage =
    error instanceof ApiError && error.code === PASSWORD_REUSED ? error.message : undefined;
  const sessionExpired = error instanceof ApiError && error.status === UNAUTHORIZED_STATUS;
  const formError =
    changePassword.isError && !reusedPasswordMessage ? describeError(error) : undefined;

  const submit = handleSubmit((values) => {
    changePassword.mutate(values, {
      onSuccess: () => navigate(ROUTES.dashboard, { replace: true }),
    });
  });

  return (
    <AuthFormShell
      title="Actualiza tu contraseña"
      description="Antes de continuar, es necesario que actualices tu contraseña de uso temporal:"
    >
      <form noValidate onSubmit={submit} className={authFormStyles.form}>
        <PasswordField
          label="Nueva contraseña"
          autoComplete="new-password"
          hint={PASSWORD_POLICY_HINT}
          error={errors.newPassword?.message ?? reusedPasswordMessage}
          {...register('newPassword')}
        />
        <PasswordField
          label="Repetir nueva contraseña"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        {formError && <FormAlert>{formError}</FormAlert>}
        {sessionExpired && (
          <p className={authFormStyles.helper}>
            <TextLink to={ROUTES.forgotPassword}>Solicitar una nueva contraseña temporal</TextLink>
          </p>
        )}
        <div className={authFormStyles.actions}>
          <Button
            type="submit"
            loading={changePassword.isPending}
            className={authFormStyles.submit}
          >
            Actualizar contraseña
          </Button>
        </div>
      </form>
    </AuthFormShell>
  );
}

import { useState } from 'react';
import { ROUTES } from '../../../app/routes';
import { TextLink } from '../../../components/ui/text-link';
import { describeError } from '../../../lib/describe-error';
import { ApiError } from '../../../lib/http';
import { AuthFormShell } from '../components/auth-form-shell';
import { authFormStyles } from '../components/auth-form.styles';
import { EmailRequestForm } from '../components/email-request-form';
import { EmailSentNotice } from '../components/email-sent-notice';
import { useForgotPassword } from '../hooks/use-forgot-password';

const ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND';

export function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (sentTo) {
    return (
      <EmailSentNotice
        message={`Te enviamos una contraseña temporal a ${sentTo}. Puede tardar unos minutos en llegar. Si pediste otra hace menos de un minuto, usa la que ya te enviamos.`}
        actionLabel="Volver a iniciar sesión"
      />
    );
  }

  const accountNotFoundMessage =
    forgotPassword.error instanceof ApiError && forgotPassword.error.code === ACCOUNT_NOT_FOUND
      ? forgotPassword.error.message
      : undefined;

  return (
    <AuthFormShell
      title="Recupera tu contraseña"
      description="Ingresa tu correo electrónico y te enviaremos una contraseña temporal:"
    >
      <EmailRequestForm
        submitLabel="Enviar contraseña temporal"
        pending={forgotPassword.isPending}
        fieldError={accountNotFoundMessage}
        formError={
          forgotPassword.isError && !accountNotFoundMessage
            ? describeError(forgotPassword.error)
            : undefined
        }
        onSubmit={(email) => forgotPassword.mutate(email, { onSuccess: () => setSentTo(email) })}
        footer={
          <>
            <p className={authFormStyles.helper}>
              ¿Recordaste tu contraseña? <TextLink to={ROUTES.login}>Inicia sesión</TextLink>
            </p>
            <p className={authFormStyles.helper}>
              ¿No tienes cuenta? <TextLink to={ROUTES.register}>Crear cuenta</TextLink>
            </p>
          </>
        }
      />
    </AuthFormShell>
  );
}

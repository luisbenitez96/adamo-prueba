import { useState } from 'react';
import { ROUTES } from '../../../app/routes';
import { TextLink } from '../../../components/ui/text-link';
import { describeError } from '../../../lib/describe-error';
import { AuthFormShell } from '../components/auth-form-shell';
import { authFormStyles } from '../components/auth-form.styles';
import { EmailRequestForm } from '../components/email-request-form';
import { EmailSentNotice } from '../components/email-sent-notice';
import { useForgotPassword } from '../hooks/use-forgot-password';

export function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const [requested, setRequested] = useState(false);

  if (requested) {
    return (
      <EmailSentNotice
        message="Si el correo está registrado, te enviamos una contraseña temporal. Puede tardar unos minutos en llegar."
        actionLabel="Volver a iniciar sesión"
      />
    );
  }

  return (
    <AuthFormShell
      title="Recupera tu contraseña"
      description="Ingresa tu correo electrónico y te enviaremos una contraseña temporal:"
    >
      <EmailRequestForm
        submitLabel="Enviar contraseña temporal"
        pending={forgotPassword.isPending}
        formError={forgotPassword.isError ? describeError(forgotPassword.error) : undefined}
        onSubmit={(email) => forgotPassword.mutate(email, { onSuccess: () => setRequested(true) })}
        footer={
          <p className={authFormStyles.helper}>
            ¿Recordaste tu contraseña? <TextLink to={ROUTES.login}>Inicia sesión</TextLink>
          </p>
        }
      />
    </AuthFormShell>
  );
}

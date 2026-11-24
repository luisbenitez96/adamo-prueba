import { useState } from 'react';
import { ROUTES } from '../../../app/routes';
import { TextLink } from '../../../components/ui/text-link';
import { describeError } from '../../../lib/describe-error';
import { ApiError } from '../../../lib/http';
import { AuthFormShell } from '../components/auth-form-shell';
import { authFormStyles } from '../components/auth-form.styles';
import { EmailRequestForm } from '../components/email-request-form';
import { EmailSentNotice } from '../components/email-sent-notice';
import { useRegister } from '../hooks/use-register';

const EMAIL_ALREADY_REGISTERED = 'EMAIL_ALREADY_REGISTERED';

export function RegisterPage() {
  const register = useRegister();
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (sentTo) {
    return (
      <EmailSentNotice
        message={`Te enviamos una contraseña temporal a ${sentTo}. Úsala para iniciar sesión y después crea la tuya.`}
        actionLabel="Ir a iniciar sesión"
      />
    );
  }

  const alreadyRegisteredMessage =
    register.error instanceof ApiError && register.error.code === EMAIL_ALREADY_REGISTERED
      ? register.error.message
      : undefined;

  return (
    <AuthFormShell
      title="Crea tu cuenta en AdamoServices"
      description="Ingresa tu correo electrónico y te enviaremos una contraseña temporal para ingresar:"
    >
      <EmailRequestForm
        submitLabel="Crear cuenta"
        pending={register.isPending}
        fieldError={alreadyRegisteredMessage}
        formError={
          register.isError && !alreadyRegisteredMessage ? describeError(register.error) : undefined
        }
        onSubmit={(email) => register.mutate(email, { onSuccess: () => setSentTo(email) })}
        footer={
          <p className={authFormStyles.helper}>
            ¿Ya tienes cuenta? <TextLink to={ROUTES.login}>Inicia sesión</TextLink>
          </p>
        }
      />
    </AuthFormShell>
  );
}

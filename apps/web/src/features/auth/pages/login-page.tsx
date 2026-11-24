import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { ROUTES } from '../../../app/routes';
import { Button } from '../../../components/ui/button';
import { FormAlert } from '../../../components/ui/form-alert';
import { PasswordField } from '../../../components/ui/password-field';
import { TextField } from '../../../components/ui/text-field';
import { TextLink } from '../../../components/ui/text-link';
import { describeError } from '../../../lib/describe-error';
import { ApiError } from '../../../lib/http';
import { AuthFormShell } from '../components/auth-form-shell';
import { authFormStyles } from '../components/auth-form.styles';
import { useLogin } from '../hooks/use-login';
import { loginSchema } from '../schemas';
import type { LoginValues } from '../schemas';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    resetField,
    setFocus,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const submit = handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: ({ requiresPasswordChange }) => {
        navigate(requiresPasswordChange ? ROUTES.changePassword : ROUTES.dashboard, {
          replace: true,
        });
      },
      onError: (error) => {
        if (error instanceof ApiError && error.code === 'INVALID_CREDENTIALS') {
          resetField('password');
          setFocus('password');
        }
      },
    });
  });

  return (
    <AuthFormShell
      title="Inicia sesión en tu cuenta de AdamoServices"
      description="Ingresa tus credenciales a continuación para continuar:"
    >
      <form noValidate onSubmit={submit} className={authFormStyles.form}>
        <TextField
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordField
          label="Contraseña"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <p className={authFormStyles.helper}>
          ¿Olvidaste tu contraseña? <TextLink to={ROUTES.forgotPassword}>Haz click aquí</TextLink>
        </p>
        {login.isError && <FormAlert>{describeError(login.error)}</FormAlert>}
        <div className={authFormStyles.actions}>
          <Button type="submit" loading={login.isPending} className={authFormStyles.submit}>
            Iniciar sesión
          </Button>
        </div>
        <p className={authFormStyles.helper}>
          ¿No tienes cuenta? <TextLink to={ROUTES.register}>Crear cuenta</TextLink>
        </p>
      </form>
    </AuthFormShell>
  );
}

import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/button';
import { FormAlert } from '../../../components/ui/form-alert';
import { TextField } from '../../../components/ui/text-field';
import { emailRequestSchema } from '../schemas';
import type { EmailRequestValues } from '../schemas';
import { authFormStyles } from './auth-form.styles';

interface EmailRequestFormProps {
  submitLabel: string;
  pending: boolean;
  fieldError?: string;
  formError?: string;
  footer?: ReactNode;
  onSubmit: (email: string) => void;
}

export function EmailRequestForm({
  submitLabel,
  pending,
  fieldError,
  formError,
  footer,
  onSubmit,
}: EmailRequestFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailRequestValues>({
    resolver: zodResolver(emailRequestSchema),
    defaultValues: { email: '' },
  });

  const submit = handleSubmit(({ email }) => onSubmit(email));

  return (
    <form noValidate onSubmit={submit} className={authFormStyles.form}>
      <TextField
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        error={errors.email?.message ?? fieldError}
        {...register('email')}
      />
      {formError && <FormAlert>{formError}</FormAlert>}
      <div className={authFormStyles.actions}>
        <Button type="submit" loading={pending} className={authFormStyles.submit}>
          {submitLabel}
        </Button>
      </div>
      {footer}
    </form>
  );
}

import { ButtonLink } from '../../../components/ui/button-link';
import { ROUTES } from '../../../app/routes';
import { AuthFormShell } from './auth-form-shell';
import { authFormStyles } from './auth-form.styles';

interface EmailSentNoticeProps {
  message: string;
  actionLabel: string;
}

export function EmailSentNotice({ message, actionLabel }: EmailSentNoticeProps) {
  return (
    <AuthFormShell title="Revisa tu correo" description={message} focusTitleOnMount>
      <ButtonLink to={ROUTES.login} className={authFormStyles.submit}>
        {actionLabel}
      </ButtonLink>
    </AuthFormShell>
  );
}

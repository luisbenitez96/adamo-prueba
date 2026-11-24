import { profileButtonStyles } from './profile-button.styles';
import { UserAvatar } from './user-avatar';

interface ProfileButtonProps {
  email?: string;
  showEmail?: boolean;
}

export function ProfileButton({ email, showEmail = false }: ProfileButtonProps) {
  return (
    <button type="button" aria-disabled="true" className={profileButtonStyles.root}>
      <UserAvatar email={email} />
      <span className={profileButtonStyles.text}>
        Mi perfil
        {showEmail && email && <span className={profileButtonStyles.email}>{email}</span>}
      </span>
    </button>
  );
}

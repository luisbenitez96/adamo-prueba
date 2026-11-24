import { userAvatarStyles } from './user-avatar.styles';

const FALLBACK_INITIAL = '?';

export function UserAvatar({ email }: { email?: string }) {
  const initial = email?.trim().charAt(0).toUpperCase() || FALLBACK_INITIAL;

  return (
    <span aria-hidden="true" className={userAvatarStyles.root}>
      {initial}
    </span>
  );
}

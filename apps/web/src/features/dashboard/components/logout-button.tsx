import { LogOut } from 'lucide-react';
import { Spinner } from '../../../components/ui/spinner';
import { describeError } from '../../../lib/describe-error';
import { useLogout } from '../../auth/hooks/use-logout';
import { logoutButtonStyles } from './logout-button.styles';
import { navItemIconStyles, navItemStyles } from './nav-item.styles';

export function LogoutButton() {
  const logout = useLogout();

  return (
    <div>
      <button
        type="button"
        disabled={logout.isPending}
        aria-busy={logout.isPending || undefined}
        className={navItemStyles()}
        onClick={() => logout.mutate()}
      >
        {logout.isPending ? (
          <Spinner className={navItemIconStyles} />
        ) : (
          <LogOut strokeWidth={1.5} className={navItemIconStyles} />
        )}
        Cerrar sesión
      </button>
      {logout.isError && (
        <p role="alert" className={logoutButtonStyles.error}>
          {describeError(logout.error)}
        </p>
      )}
    </div>
  );
}

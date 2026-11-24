import { CircleUser, House, LogOut } from 'lucide-react';
import { ROUTES } from '../../../app/routes';
import { Logo } from '../../../components/ui/logo';
import { Spinner } from '../../../components/ui/spinner';
import { describeError } from '../../../lib/describe-error';
import { useLogout } from '../../auth/hooks/use-logout';
import { useSession } from '../../auth/hooks/use-session';
import { NavItem } from './nav-item';
import { navItemIconStyles, navItemStyles } from './nav-item.styles';
import { sidebarContentStyles } from './sidebar-content.styles';
import { UserAvatar } from './user-avatar';

interface SidebarContentProps {
  onNavigate?: () => void;
}

export function SidebarContent({ onNavigate }: SidebarContentProps) {
  const session = useSession();
  const logout = useLogout();

  return (
    <div className={sidebarContentStyles.root}>
      <div className={sidebarContentStyles.top}>
        <Logo size="sm" />
        <nav aria-label="Principal" className={sidebarContentStyles.nav}>
          <ul className={sidebarContentStyles.list}>
            <li>
              <NavItem icon={House}>Inicio</NavItem>
            </li>
            <li>
              <NavItem icon={CircleUser} to={ROUTES.dashboard} onNavigate={onNavigate}>
                Clientes
              </NavItem>
            </li>
          </ul>
        </nav>
      </div>
      <div className={sidebarContentStyles.bottom}>
        <button type="button" aria-disabled="true" className={sidebarContentStyles.profile}>
          <UserAvatar email={session.data?.email} />
          Mi perfil
        </button>
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
            <p role="alert" className={sidebarContentStyles.logoutError}>
              {describeError(logout.error)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

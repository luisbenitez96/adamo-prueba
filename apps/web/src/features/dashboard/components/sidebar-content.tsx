import { CircleUser, House } from 'lucide-react';
import { ROUTES } from '../../../app/routes';
import { Logo } from '../../../components/ui/logo';
import { useSession } from '../../auth/hooks/use-session';
import { LogoutButton } from './logout-button';
import { NavItem } from './nav-item';
import { ProfileButton } from './profile-button';
import { sidebarContentStyles } from './sidebar-content.styles';

export function SidebarContent() {
  const session = useSession();

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
              <NavItem icon={CircleUser} to={ROUTES.dashboard}>
                Clientes
              </NavItem>
            </li>
          </ul>
        </nav>
      </div>
      <div className={sidebarContentStyles.bottom}>
        <ProfileButton email={session.data?.email} />
        <LogoutButton />
      </div>
    </div>
  );
}

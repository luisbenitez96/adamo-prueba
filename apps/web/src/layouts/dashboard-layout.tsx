import { Menu } from 'lucide-react';
import { useId, useState } from 'react';
import { Outlet, useNavigation } from 'react-router';
import { LoadingIndicator } from '../components/ui/loading-indicator';
import { Logo } from '../components/ui/logo';
import { SidebarContent } from '../features/dashboard/components/sidebar-content';
import { dashboardLayoutStyles } from './dashboard-layout.styles';
import { MobileMenu } from './mobile-menu';

export function DashboardLayout() {
  const isNavigating = useNavigation().state === 'loading';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <div className={dashboardLayoutStyles.root}>
        <aside className={dashboardLayoutStyles.sidebar}>
          <SidebarContent />
        </aside>
        <div className={dashboardLayoutStyles.mobileBar}>
          <Logo size="sm" />
          <button
            type="button"
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            className={dashboardLayoutStyles.menuButton}
            onClick={() => setMenuOpen(true)}
          >
            <Menu className={dashboardLayoutStyles.menuIcon} />
          </button>
        </div>
        <main className={dashboardLayoutStyles.main} aria-busy={isNavigating}>
          {isNavigating ? <LoadingIndicator /> : <Outlet />}
        </main>
      </div>
      <MobileMenu id={menuId} open={menuOpen} onClose={closeMenu}>
        <SidebarContent onNavigate={closeMenu} />
      </MobileMenu>
    </>
  );
}

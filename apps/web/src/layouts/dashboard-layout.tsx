import { Outlet, useNavigation } from 'react-router';
import { LoadingIndicator } from '../components/ui/loading-indicator';
import { Logo } from '../components/ui/logo';
import { SidebarContent } from '../features/dashboard/components/sidebar-content';
import { BottomNav } from './bottom-nav';
import { dashboardLayoutStyles } from './dashboard-layout.styles';

export function DashboardLayout() {
  const isNavigating = useNavigation().state === 'loading';

  return (
    <>
      <div className={dashboardLayoutStyles.root}>
        <aside className={dashboardLayoutStyles.sidebar}>
          <SidebarContent />
        </aside>
        <div className={dashboardLayoutStyles.mobileBar}>
          <Logo size="sm" />
        </div>
        <main className={dashboardLayoutStyles.main} aria-busy={isNavigating}>
          {isNavigating ? (
            <LoadingIndicator />
          ) : (
            <div className={dashboardLayoutStyles.page}>
              <Outlet />
            </div>
          )}
        </main>
      </div>
      <BottomNav />
    </>
  );
}

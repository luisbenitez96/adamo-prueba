import { CircleUser, Ellipsis, House, X } from 'lucide-react';
import { useEffect, useEffectEvent, useId, useRef, useState } from 'react';
import { NavLink, useMatch } from 'react-router';
import { ROUTES } from '../app/routes';
import { useSession } from '../features/auth/hooks/use-session';
import { LogoutButton } from '../features/dashboard/components/logout-button';
import { ProfileButton } from '../features/dashboard/components/profile-button';
import { bottomNavStyles, tabStyles } from './bottom-nav.styles';
import { MoreSheet } from './more-sheet';

type ActiveTab = 'none' | 'clients' | 'more';

export function BottomNav() {
  const session = useSession();
  const [moreOpen, setMoreOpen] = useState(false);
  const sheetId = useId();
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const onClients = useMatch({ path: ROUTES.dashboard, end: false }) !== null;

  let activeTab: ActiveTab = 'none';
  if (moreOpen) {
    activeTab = 'more';
  } else if (onClients) {
    activeTab = 'clients';
  }

  const closeSheet = () => {
    setMoreOpen(false);
    moreButtonRef.current?.focus();
  };

  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closeSheet();
    }
  });

  useEffect(() => {
    if (!moreOpen) {
      return;
    }

    sheetRef.current?.querySelector<HTMLElement>('button:not([disabled])')?.focus();
    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [moreOpen]);

  return (
    <>
      <MoreSheet ref={sheetRef} id={sheetId} open={moreOpen} onClose={closeSheet}>
        <ProfileButton email={session.data?.email} showEmail />
        <LogoutButton />
      </MoreSheet>
      <nav
        aria-label="Principal (móvil)"
        data-active-tab={activeTab}
        className={bottomNavStyles.bar}
      >
        <div className={bottomNavStyles.track}>
          <div aria-hidden="true" className={bottomNavStyles.indicator}>
            <span className={bottomNavStyles.pill} />
          </div>
          <button type="button" aria-disabled="true" className={tabStyles()}>
            <House strokeWidth={1.5} className={bottomNavStyles.icon} />
            <span className={bottomNavStyles.label}>Inicio</span>
          </button>
          <NavLink
            to={ROUTES.dashboard}
            className={({ isActive }) => tabStyles({ active: isActive })}
          >
            <CircleUser strokeWidth={1.5} className={bottomNavStyles.icon} />
            <span className={bottomNavStyles.label}>Clientes</span>
          </NavLink>
          <button
            ref={moreButtonRef}
            type="button"
            aria-expanded={moreOpen}
            aria-controls={sheetId}
            className={tabStyles({ active: moreOpen })}
            onClick={() => setMoreOpen((current) => !current)}
          >
            {moreOpen ? (
              <X strokeWidth={1.5} className={bottomNavStyles.icon} />
            ) : (
              <Ellipsis strokeWidth={1.5} className={bottomNavStyles.icon} />
            )}
            <span className={bottomNavStyles.label}>Más</span>
          </button>
        </div>
      </nav>
    </>
  );
}

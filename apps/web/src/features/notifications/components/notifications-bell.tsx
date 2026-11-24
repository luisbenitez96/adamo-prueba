import { Bell } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Navigate } from 'react-router';
import { ROUTES } from '../../../app/routes';
import { isSessionError } from '../../dashboard/session-error';
import { useNotifications } from '../hooks/use-notifications';
import { notificationsBellStyles as styles } from './notifications-bell.styles';
import { NotificationsPanel } from './notifications-panel';

export function NotificationsBell() {
  const notifications = useNotifications();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const unreadCount = notifications.data?.unreadCount ?? 0;

  useEffect(() => {
    if (!open) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOnOutsidePointer);

    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
    };
  }, [open]);

  if (isSessionError(notifications.error)) {
    return <Navigate to={ROUTES.login} replace />;
  }

  const label = unreadCount > 0 ? `Notificaciones (${unreadCount} sin leer)` : 'Notificaciones';

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className={styles.button}
        onClick={() => setOpen((current) => !current)}
      >
        <Bell aria-hidden="true" strokeWidth={1.5} className={styles.icon} />
        {unreadCount > 0 && (
          <span aria-hidden="true" data-testid="unread-dot" className={styles.dot} />
        )}
      </button>
      {open && (
        <NotificationsPanel
          id={panelId}
          onClose={() => {
            setOpen(false);
            buttonRef.current?.focus();
          }}
        />
      )}
    </div>
  );
}

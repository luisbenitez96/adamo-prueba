import { X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { FormAlert } from '../../../components/ui/form-alert';
import { LoadingIndicator } from '../../../components/ui/loading-indicator';
import { describeError } from '../../../lib/describe-error';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '../hooks/use-notifications';
import { NotificationItem } from './notification-item';
import { notificationsPanelStyles as styles } from './notifications-panel.styles';

interface NotificationsPanelProps {
  id: string;
  onClose: () => void;
}

export function NotificationsPanel({ id, onClose }: NotificationsPanelProps) {
  const notifications = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const updateError = markRead.error ?? markAllRead.error;

  return (
    <section id={id} aria-label="Panel de notificaciones" className={styles.root}>
      <header className={styles.header}>
        <h2 className={styles.title}>Notificaciones</h2>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.markAll}
            disabled={
              !notifications.data || notifications.data.unreadCount === 0 || markAllRead.isPending
            }
            onClick={() => markAllRead.mutate()}
          >
            Marcar todas como leídas
          </button>
          <button
            type="button"
            aria-label="Cerrar notificaciones"
            className={styles.close}
            onClick={onClose}
          >
            <X aria-hidden="true" className={styles.closeIcon} />
          </button>
        </div>
      </header>
      {notifications.isPending && <LoadingIndicator label="Cargando notificaciones" />}
      {notifications.isError && (
        <div className={styles.state}>
          <FormAlert>{describeError(notifications.error)}</FormAlert>
          <Button size="sm" onClick={() => void notifications.refetch()}>
            Reintentar
          </Button>
        </div>
      )}
      {updateError && (
        <div className={styles.state}>
          <FormAlert>{describeError(updateError)}</FormAlert>
        </div>
      )}
      {notifications.isSuccess && notifications.data.notifications.length === 0 && (
        <p className={styles.emptyText}>No tienes notificaciones.</p>
      )}
      {notifications.isSuccess && notifications.data.notifications.length > 0 && (
        <ul className={styles.list}>
          {notifications.data.notifications.map((notification) => (
            <li key={notification.id}>
              <NotificationItem
                notification={notification}
                onRead={(notificationId) => markRead.mutate(notificationId)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

import { formatRelativeTime } from '../format';
import type { AppNotification } from '../schemas';
import { notificationItemStyles as styles } from './notification-item.styles';

interface NotificationItemProps {
  notification: AppNotification;
  onRead: (notificationId: string) => void;
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const unread = !notification.read;
  const content = (
    <>
      <span aria-hidden="true" data-testid="unread-marker" className={styles.marker({ unread })} />
      <span className={styles.body}>
        <span className={`block ${styles.title({ unread })}`}>{notification.title}</span>
        <span className={`block ${styles.message}`}>{notification.message}</span>
        <time dateTime={notification.createdAt} className={`block ${styles.time}`}>
          {formatRelativeTime(notification.createdAt)}
        </time>
      </span>
    </>
  );

  if (!unread) {
    return <div className={styles.root({ unread })}>{content}</div>;
  }

  return (
    <button
      type="button"
      className={styles.root({ unread })}
      onClick={() => onRead(notification.id)}
    >
      {content}
    </button>
  );
}

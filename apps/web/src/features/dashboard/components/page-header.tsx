import { NotificationsBell } from '../../notifications/components/notifications-bell';
import { pageHeaderStyles } from './page-header.styles';

export function PageHeader({ title }: { title: string }) {
  return (
    <header className={pageHeaderStyles.root}>
      <h1 className={pageHeaderStyles.title}>{title}</h1>
      <NotificationsBell />
    </header>
  );
}

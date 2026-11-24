import { Bell } from 'lucide-react';
import { pageHeaderStyles } from './page-header.styles';

export function PageHeader({ title }: { title: string }) {
  return (
    <header className={pageHeaderStyles.root}>
      <h1 className={pageHeaderStyles.title}>{title}</h1>
      <button
        type="button"
        aria-disabled="true"
        aria-label="Notificaciones"
        className={pageHeaderStyles.bell}
      >
        <Bell strokeWidth={1.5} className={pageHeaderStyles.bellIcon} />
        <span aria-hidden="true" className={pageHeaderStyles.dot} />
      </button>
    </header>
  );
}

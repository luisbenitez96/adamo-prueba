import { User } from 'lucide-react';
import { formatClientsCount } from '../format';
import { clientsBadgeStyles } from './clients-badge.styles';

export function ClientsBadge({ count }: { count: number }) {
  return (
    <p className={clientsBadgeStyles.root}>
      <User strokeWidth={1.5} className={clientsBadgeStyles.icon} />
      {formatClientsCount(count)}
    </p>
  );
}

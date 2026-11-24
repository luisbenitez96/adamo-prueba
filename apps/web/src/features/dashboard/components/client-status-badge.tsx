import type { ClientStatus } from '../schemas';
import { clientStatusBadgeStyles } from './client-status-badge.styles';

const STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'Activo',
  pending: 'Pendiente',
  inactive: 'Inactivo',
};

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return <span className={clientStatusBadgeStyles({ status })}>{STATUS_LABELS[status]}</span>;
}

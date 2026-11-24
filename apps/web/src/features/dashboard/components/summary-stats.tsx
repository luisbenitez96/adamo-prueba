import { Navigate } from 'react-router';
import { ROUTES } from '../../../app/routes';
import { Button } from '../../../components/ui/button';
import { FormAlert } from '../../../components/ui/form-alert';
import { LoadingIndicator } from '../../../components/ui/loading-indicator';
import { describeError } from '../../../lib/describe-error';
import { formatCount, formatShare } from '../format';
import { useSummary } from '../hooks/use-summary';
import { isSessionError } from '../session-error';
import { StatCard } from './stat-card';
import { summaryStatsStyles as styles } from './summary-stats.styles';

export function SummaryStats() {
  const summary = useSummary();

  if (isSessionError(summary.error)) {
    return <Navigate to={ROUTES.login} replace />;
  }

  if (summary.isPending) {
    return <LoadingIndicator label="Cargando resumen" />;
  }

  if (summary.isError) {
    return (
      <div className={styles.feedback}>
        <FormAlert>{describeError(summary.error)}</FormAlert>
        <Button size="sm" onClick={() => void summary.refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  const { totalClients, totalServices, clientsByStatus } = summary.data;
  const servicesCaption = `En ${formatCount(totalServices)} ${totalServices === 1 ? 'servicio' : 'servicios'}`;

  return (
    <div className={styles.grid}>
      <StatCard
        label="Clientes totales"
        value={formatCount(totalClients)}
        caption={servicesCaption}
      />
      <StatCard
        label="Activos"
        tone="active"
        value={formatCount(clientsByStatus.active)}
        caption={`${formatShare(clientsByStatus.active, totalClients)} del total`}
      />
      <StatCard
        label="Pendientes"
        tone="pending"
        value={formatCount(clientsByStatus.pending)}
        caption={`${formatShare(clientsByStatus.pending, totalClients)} del total`}
      />
      <StatCard
        label="Inactivos"
        tone="inactive"
        value={formatCount(clientsByStatus.inactive)}
        caption={`${formatShare(clientsByStatus.inactive, totalClients)} del total`}
      />
    </div>
  );
}

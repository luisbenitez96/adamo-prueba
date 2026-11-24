import { Navigate } from 'react-router';
import { ROUTES, serviceClientsPath } from '../../../app/routes';
import { Button } from '../../../components/ui/button';
import { ButtonLink } from '../../../components/ui/button-link';
import { FormAlert } from '../../../components/ui/form-alert';
import { LoadingIndicator } from '../../../components/ui/loading-indicator';
import { describeError } from '../../../lib/describe-error';
import { formatClientsCount } from '../format';
import { useServices } from '../hooks/use-services';
import { isSessionError } from '../session-error';
import { servicesOverviewStyles as styles } from './services-overview.styles';

export function ServicesOverview() {
  const services = useServices();

  if (isSessionError(services.error)) {
    return <Navigate to={ROUTES.login} replace />;
  }

  if (services.isPending) {
    return <LoadingIndicator label="Cargando servicios" />;
  }

  if (services.isError) {
    return (
      <div className={styles.feedback}>
        <FormAlert>{describeError(services.error)}</FormAlert>
        <Button size="sm" onClick={() => void services.refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (services.data.length === 0) {
    return <p className={styles.emptyText}>Todavía no hay servicios disponibles.</p>;
  }

  return (
    <ul className={styles.list}>
      {services.data.map((service) => (
        <li key={service.id} className={styles.item}>
          <div className={styles.identity}>
            <span
              aria-hidden="true"
              data-testid="service-dot"
              className={styles.dot}
              style={{ backgroundColor: service.accentColor }}
            />
            <div>
              <h3 className={styles.name}>{service.name}</h3>
              <p className={styles.description}>{service.description}</p>
            </div>
          </div>
          <p className={styles.count}>{formatClientsCount(service.clientsCount)}</p>
          <ButtonLink
            size="sm"
            to={serviceClientsPath(service.id)}
            aria-label={`Ver clientes de ${service.name}`}
          >
            Ver clientes
          </ButtonLink>
        </li>
      ))}
    </ul>
  );
}

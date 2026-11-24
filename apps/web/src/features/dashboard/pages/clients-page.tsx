import { Navigate } from 'react-router';
import { ROUTES } from '../../../app/routes';
import { Button } from '../../../components/ui/button';
import { FormAlert } from '../../../components/ui/form-alert';
import { LoadingIndicator } from '../../../components/ui/loading-indicator';
import { describeError } from '../../../lib/describe-error';
import { ApiError } from '../../../lib/http';
import { PageHeader } from '../components/page-header';
import { ServiceCard } from '../components/service-card';
import { useServices } from '../hooks/use-services';
import { clientsPageStyles } from './clients-page.styles';

const SESSION_ERROR_STATUSES = [401, 403];

export function ClientsPage() {
  const services = useServices();

  if (
    services.error instanceof ApiError &&
    SESSION_ERROR_STATUSES.includes(services.error.status)
  ) {
    return <Navigate to={ROUTES.login} replace />;
  }

  return (
    <>
      <PageHeader title="Clientes" />
      <section aria-labelledby="services-panel-title" className={clientsPageStyles.panel}>
        <div className={clientsPageStyles.panelHeader}>
          <p id="services-panel-title">Selecciona un servicio para ir a la gestión de clientes</p>
          <button type="button" aria-disabled="true" className={clientsPageStyles.seeAll}>
            Ver todos los servicios
          </button>
        </div>
        <div className={clientsPageStyles.content} aria-busy={services.isPending}>
          {services.isPending && <LoadingIndicator label="Cargando servicios" />}
          {services.isError && (
            <div className={clientsPageStyles.feedback}>
              <FormAlert>{describeError(services.error)}</FormAlert>
              <Button size="sm" onClick={() => void services.refetch()}>
                Reintentar
              </Button>
            </div>
          )}
          {services.isSuccess && services.data.length === 0 && (
            <p className={clientsPageStyles.emptyText}>Todavía no hay servicios disponibles.</p>
          )}
          {services.isSuccess && services.data.length > 0 && (
            <div className={clientsPageStyles.grid}>
              {services.data.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

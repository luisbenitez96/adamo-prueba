import { serviceClientsPath } from '../../../app/routes';
import { ButtonLink } from '../../../components/ui/button-link';
import type { Service } from '../schemas';
import { ClientsBadge } from './clients-badge';
import { serviceCardStyles } from './service-card.styles';

export function ServiceCard({ service }: { service: Service }) {
  return (
    <article className={serviceCardStyles.root} aria-label={service.name}>
      <h2 className={serviceCardStyles.name}>{service.name}</h2>
      <p className={serviceCardStyles.description}>{service.description}</p>
      <div className={serviceCardStyles.badge}>
        <ClientsBadge count={service.clientsCount} />
      </div>
      <ButtonLink
        size="sm"
        to={serviceClientsPath(service.id)}
        aria-label={`Gestionar clientes de ${service.name}`}
        className={serviceCardStyles.action}
      >
        Gestionar clientes
      </ButtonLink>
      <div
        data-testid="accent-bar"
        aria-hidden="true"
        className={serviceCardStyles.accentBar}
        style={{ backgroundColor: service.accentColor }}
      />
    </article>
  );
}

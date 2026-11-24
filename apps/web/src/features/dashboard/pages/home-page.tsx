import { ROUTES } from '../../../app/routes';
import { TextLink } from '../../../components/ui/text-link';
import { useSession } from '../../auth/hooks/use-session';
import { PageHeader } from '../components/page-header';
import { ServicesOverview } from '../components/services-overview';
import { SummaryStats } from '../components/summary-stats';
import { homePageStyles as styles } from './home-page.styles';

export function HomePage() {
  const session = useSession();

  return (
    <>
      <PageHeader title="Inicio" />
      <section aria-labelledby="home-greeting" className={styles.panel}>
        <h2 id="home-greeting" className={styles.greeting}>
          Te damos la bienvenida
        </h2>
        {session.data && <p className={styles.email}>{session.data.email}</p>}
      </section>
      <section aria-labelledby="home-summary-title" className={styles.panel}>
        <h2 id="home-summary-title" className={styles.sectionTitle}>
          Resumen de clientes
        </h2>
        <SummaryStats />
      </section>
      <section aria-labelledby="home-services-title" className={styles.panel}>
        <h2 id="home-services-title" className={styles.sectionTitle}>
          Tus servicios
        </h2>
        <ServicesOverview />
        <p className={styles.sectionTitle}>
          <TextLink to={ROUTES.clients}>Ir a la gestión de clientes</TextLink>
        </p>
      </section>
    </>
  );
}

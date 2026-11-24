import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router';
import { ROUTES } from '../../../app/routes';
import { Button } from '../../../components/ui/button';
import { FormAlert } from '../../../components/ui/form-alert';
import { LoadingIndicator } from '../../../components/ui/loading-indicator';
import { TextField } from '../../../components/ui/text-field';
import { describeError } from '../../../lib/describe-error';
import { ApiError } from '../../../lib/http';
import { useDebouncedValue } from '../../../lib/use-debounced-value';
import { CLIENTS_PAGE_SIZE } from '../api/clients.api';
import { ClientsPagination } from '../components/clients-pagination';
import { ClientsTable } from '../components/clients-table';
import { PageHeader } from '../components/page-header';
import { useServiceClients } from '../hooks/use-service-clients';
import { isSessionError } from '../session-error';
import { serviceClientsPageStyles as styles } from './service-clients-page.styles';

const SEARCH_DEBOUNCE_MS = 300;
const SERVICE_NOT_FOUND = 'SERVICE_NOT_FOUND';

function parsePage(raw: string | null): number {
  const page = Number(raw);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

export function ServiceClientsPage() {
  const { serviceId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get('page'));
  const appliedSearch = searchParams.get('q') ?? '';
  const [searchText, setSearchText] = useState(appliedSearch);
  const debouncedSearch = useDebouncedValue(searchText.trim(), SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    if (debouncedSearch === appliedSearch) {
      return;
    }

    setSearchParams(debouncedSearch ? { q: debouncedSearch } : {}, { replace: true });
  }, [debouncedSearch, appliedSearch, setSearchParams]);

  const clients = useServiceClients(serviceId, { page, search: appliedSearch });

  if (isSessionError(clients.error)) {
    return <Navigate to={ROUTES.login} replace />;
  }

  const lastPage = clients.data?.pagination.totalPages ?? 1;

  if (clients.data && !clients.isPlaceholderData && page > lastPage) {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(lastPage));
    return <Navigate to={{ search: params.toString() }} replace />;
  }

  const notFound = clients.error instanceof ApiError && clients.error.code === SERVICE_NOT_FOUND;

  const goToPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(nextPage));
    setSearchParams(params);
  };

  const result = clients.data;

  return (
    <>
      <PageHeader title="Clientes" />
      <section aria-label="Clientes del servicio" className={styles.panel}>
        <Link to={ROUTES.dashboard} className={styles.back}>
          <ArrowLeft aria-hidden="true" className={styles.backIcon} />
          Volver a servicios
        </Link>
        {result && (
          <div className={styles.titleRow}>
            <span
              aria-hidden="true"
              data-testid="service-accent"
              className={styles.accent}
              style={{ backgroundColor: result.service.accentColor }}
            />
            <h2 className={styles.title}>{result.service.name}</h2>
          </div>
        )}
        {!notFound && (
          <div className={styles.search}>
            <TextField
              label="Buscar clientes"
              type="search"
              placeholder="Buscar por nombre o correo"
              autoComplete="off"
              maxLength={100}
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>
        )}
        <div
          className={`${styles.content} ${clients.isPlaceholderData ? styles.contentBusy : ''}`}
          aria-busy={clients.isPending || clients.isPlaceholderData}
        >
          {clients.isPending && <LoadingIndicator label="Cargando clientes" />}
          {notFound && (
            <div className={styles.feedback}>
              <FormAlert>Este servicio no existe o ya no está disponible.</FormAlert>
            </div>
          )}
          {clients.isError && !notFound && (
            <div className={styles.feedback}>
              <FormAlert>{describeError(clients.error)}</FormAlert>
              <Button size="sm" onClick={() => void clients.refetch()}>
                Reintentar
              </Button>
            </div>
          )}
          {result && result.clients.length === 0 && (
            <p className={styles.emptyText}>
              {appliedSearch
                ? `No encontramos clientes que coincidan con "${appliedSearch}".`
                : 'Este servicio todavía no tiene clientes.'}
            </p>
          )}
          {result && result.clients.length > 0 && <ClientsTable clients={result.clients} />}
          {result && result.pagination.total > 0 && (
            <ClientsPagination
              page={result.pagination.page}
              pageSize={CLIENTS_PAGE_SIZE}
              total={result.pagination.total}
              totalPages={result.pagination.totalPages}
              loading={clients.isFetching}
              onPageChange={goToPage}
            />
          )}
        </div>
      </section>
    </>
  );
}

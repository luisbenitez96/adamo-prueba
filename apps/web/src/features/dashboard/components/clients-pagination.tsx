import { Button } from '../../../components/ui/button';
import { Spinner } from '../../../components/ui/spinner';
import { formatRange } from '../format';
import { clientsPaginationStyles as styles } from './clients-pagination.styles';

interface ClientsPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}

export function ClientsPagination({
  page,
  pageSize,
  total,
  totalPages,
  loading,
  onPageChange,
}: ClientsPaginationProps) {
  return (
    <nav aria-label="Paginación de clientes" className={styles.root}>
      <p className={styles.summary}>
        {loading && <Spinner />}
        <span>{formatRange(page, pageSize, total)}</span>
      </p>
      <div className={styles.controls}>
        <Button size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Anterior
        </Button>
        <p className={styles.position}>
          Página {page} de {totalPages}
        </p>
        <Button size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Siguiente
        </Button>
      </div>
    </nav>
  );
}

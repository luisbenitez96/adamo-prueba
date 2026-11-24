import { formatRegistrationDate } from '../format';
import type { Client } from '../schemas';
import { ClientStatusBadge } from './client-status-badge';
import { clientsTableStyles as styles } from './clients-table.styles';

const COLUMNS = ['Nombre', 'Correo', 'Teléfono', 'Ciudad', 'Estado', 'Registro'] as const;

export function ClientsTable({ clients }: { clients: Client[] }) {
  return (
    <table className={styles.table}>
      <caption className="sr-only">Clientes del servicio</caption>
      <thead className={styles.head}>
        <tr>
          {COLUMNS.map((column) => (
            <th key={column} scope="col" className={styles.headCell}>
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className={styles.body}>
        {clients.map((client) => (
          <tr key={client.id} className={styles.row}>
            <th scope="row" data-label="Nombre" className={`${styles.cell} ${styles.name}`}>
              {client.name}
            </th>
            <td data-label="Correo" className={`${styles.cell} ${styles.email}`}>
              {client.email}
            </td>
            <td data-label="Teléfono" className={`${styles.cell} ${styles.nowrap}`}>
              {client.phone}
            </td>
            <td data-label="Ciudad" className={`${styles.cell} ${styles.nowrap}`}>
              {client.city}
            </td>
            <td data-label="Estado" className={styles.cell}>
              <ClientStatusBadge status={client.status} />
            </td>
            <td data-label="Registro" className={`${styles.cell} ${styles.nowrap}`}>
              {formatRegistrationDate(client.registeredAt)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

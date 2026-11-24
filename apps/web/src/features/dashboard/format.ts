const clientsNumberFormat = new Intl.NumberFormat('es-CO');

export function formatClientsCount(count: number): string {
  const noun = count === 1 ? 'cliente' : 'clientes';

  return `${clientsNumberFormat.format(count)} ${noun}`;
}

const registrationDateFormat = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatRegistrationDate(isoDate: string): string {
  return registrationDateFormat.format(new Date(isoDate));
}

export function formatRange(page: number, pageSize: number, total: number): string {
  if (total === 0) {
    return '0 clientes';
  }

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const number = new Intl.NumberFormat('es-CO');

  return `${number.format(first)}–${number.format(last)} de ${formatClientsCount(total)}`;
}

export function formatCount(count: number): string {
  return clientsNumberFormat.format(count);
}

export function formatShare(count: number, total: number): string {
  if (total === 0) {
    return '0 %';
  }

  return `${Math.round((count / total) * 100)} %`;
}

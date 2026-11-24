const clientsNumberFormat = new Intl.NumberFormat('es-CO');

export function formatClientsCount(count: number): string {
  const noun = count === 1 ? 'cliente' : 'clientes';

  return `${clientsNumberFormat.format(count)} ${noun}`;
}

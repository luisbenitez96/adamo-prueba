export const ROUTES = {
  login: '/login',
  register: '/crear-cuenta',
  forgotPassword: '/recuperar-contrasena',
  changePassword: '/cambiar-contrasena',
  dashboard: '/dashboard/clientes',
  serviceClients: '/dashboard/clientes/:serviceId',
} as const;

export function serviceClientsPath(serviceId: string): string {
  return `${ROUTES.dashboard}/${encodeURIComponent(serviceId)}`;
}

import { createAppRoutes } from '../app/router';
import { createRouteLoaders } from '../app/route-loaders';
import { createTestQueryClient, renderRoutes } from './render-route';

export function renderApp(path: string) {
  const queryClient = createTestQueryClient();

  return renderRoutes(createAppRoutes(createRouteLoaders(queryClient)), path, queryClient);
}

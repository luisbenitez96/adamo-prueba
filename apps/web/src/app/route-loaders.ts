import type { QueryClient } from '@tanstack/react-query';
import type { LoaderFunction } from 'react-router';
import { createNavigationLoader } from './navigation-loader';
import { createSessionGuards } from './session-guards';
import type { SessionGuard } from './session-guards';

export interface RouteLoaders {
  guest: LoaderFunction;
  passwordChange: LoaderFunction;
  fullAccess: LoaderFunction;
}

export function createRouteLoaders(queryClient: QueryClient): RouteLoaders {
  const navigationLoader = createNavigationLoader();
  const guards = createSessionGuards(queryClient);

  const withTransition =
    (guard: SessionGuard): LoaderFunction =>
    async () => {
      const [, outcome] = await Promise.all([navigationLoader(), guard()]);
      return outcome;
    };

  return {
    guest: withTransition(guards.requireGuest),
    passwordChange: withTransition(guards.requirePasswordChange),
    fullAccess: withTransition(guards.requireFullAccess),
  };
}

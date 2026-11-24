import type { QueryClient } from '@tanstack/react-query';
import { redirect } from 'react-router';
import { sessionQuery } from '../features/auth/session-query';
import type { Session } from '../features/auth/schemas';
import { ROUTES } from './routes';

export type SessionGuard = () => Promise<Response | null>;

function destinationFor(session: Session): string {
  return session.requiresPasswordChange ? ROUTES.changePassword : ROUTES.home;
}

export function createSessionGuards(queryClient: QueryClient) {
  const currentSession = () => queryClient.fetchQuery(sessionQuery);

  const requireGuest: SessionGuard = async () => {
    const session = await currentSession();
    return session ? redirect(destinationFor(session)) : null;
  };

  const requirePasswordChange: SessionGuard = async () => {
    const session = await currentSession();

    if (!session) {
      return redirect(ROUTES.login);
    }

    return session.requiresPasswordChange ? null : redirect(ROUTES.home);
  };

  const requireFullAccess: SessionGuard = async () => {
    const session = await currentSession();

    if (!session) {
      return redirect(ROUTES.login);
    }

    return session.requiresPasswordChange ? redirect(ROUTES.changePassword) : null;
  };

  return { requireGuest, requirePasswordChange, requireFullAccess };
}

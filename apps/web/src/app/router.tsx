import type { QueryClient } from '@tanstack/react-query';
import { createBrowserRouter, Navigate } from 'react-router';
import type { RouteObject } from 'react-router';
import { LoadingIndicator } from '../components/ui/loading-indicator';
import { ChangePasswordPage } from '../features/auth/pages/change-password-page';
import { ForgotPasswordPage } from '../features/auth/pages/forgot-password-page';
import { LoginPage } from '../features/auth/pages/login-page';
import { RegisterPage } from '../features/auth/pages/register-page';
import { ClientsPage } from '../features/dashboard/pages/clients-page';
import { AuthLayout } from '../layouts/auth-layout';
import { DashboardLayout } from '../layouts/dashboard-layout';
import { createRouteLoaders } from './route-loaders';
import type { RouteLoaders } from './route-loaders';
import { RouteErrorPage } from './route-error-page';
import { ROUTES } from './routes';

function FullScreenLoading() {
  return <LoadingIndicator fullScreen label="Verificando tu sesión" />;
}

export function createAuthRoutes(loaders: RouteLoaders): RouteObject[] {
  return [
    {
      element: <AuthLayout />,
      HydrateFallback: FullScreenLoading,
      children: [
        { path: ROUTES.login, loader: loaders.guest, element: <LoginPage /> },
        { path: ROUTES.register, loader: loaders.guest, element: <RegisterPage /> },
        { path: ROUTES.forgotPassword, loader: loaders.guest, element: <ForgotPasswordPage /> },
        {
          path: ROUTES.changePassword,
          loader: loaders.passwordChange,
          element: <ChangePasswordPage />,
        },
      ],
    },
  ];
}

export function createAppRoutes(loaders: RouteLoaders): RouteObject[] {
  return [
    {
      errorElement: <RouteErrorPage />,
      children: [
        { path: '/', element: <Navigate to={ROUTES.login} replace /> },
        ...createAuthRoutes(loaders),
        {
          element: <DashboardLayout />,
          HydrateFallback: FullScreenLoading,
          children: [
            { path: ROUTES.dashboard, loader: loaders.fullAccess, element: <ClientsPage /> },
          ],
        },
        { path: '*', element: <Navigate to={ROUTES.login} replace /> },
      ],
    },
  ];
}

export function createAppRouter(queryClient: QueryClient) {
  return createBrowserRouter(createAppRoutes(createRouteLoaders(queryClient)));
}

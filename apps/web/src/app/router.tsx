import { createBrowserRouter, Navigate } from 'react-router';
import type { LoaderFunction, RouteObject } from 'react-router';
import { LoadingIndicator } from '../components/ui/loading-indicator';
import { ForgotPasswordPage } from '../features/auth/pages/forgot-password-page';
import { LoginPage } from '../features/auth/pages/login-page';
import { RegisterPage } from '../features/auth/pages/register-page';
import { AuthLayout } from '../layouts/auth-layout';
import { createNavigationLoader } from './navigation-loader';
import { ROUTES } from './routes';

function FullScreenLoading() {
  return <LoadingIndicator fullScreen />;
}

export function createAuthRoutes(loader: LoaderFunction): RouteObject[] {
  return [
    {
      element: <AuthLayout />,
      HydrateFallback: FullScreenLoading,
      children: [
        { path: ROUTES.login, loader, element: <LoginPage /> },
        { path: ROUTES.register, loader, element: <RegisterPage /> },
        { path: ROUTES.forgotPassword, loader, element: <ForgotPasswordPage /> },
      ],
    },
  ];
}

export function createAppRoutes(loader: LoaderFunction = createNavigationLoader()): RouteObject[] {
  return [
    { path: '/', element: <Navigate to={ROUTES.login} replace /> },
    ...createAuthRoutes(loader),
    { path: '*', element: <Navigate to={ROUTES.login} replace /> },
  ];
}

export function createAppRouter() {
  return createBrowserRouter(createAppRoutes());
}

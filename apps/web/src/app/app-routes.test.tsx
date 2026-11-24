import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { Session } from '../features/auth/schemas';
import { apiError, FULL_SESSION, mockSession, TEMPORARY_SESSION } from '../test/api-handlers';
import { renderApp } from '../test/render-app';
import { server } from '../test/server';
import { ROUTES } from './routes';

const TITLES = {
  login: 'Inicia sesión en tu cuenta de AdamoServices',
  register: 'Crea tu cuenta en AdamoServices',
  forgot: 'Recupera tu contraseña',
  change: 'Actualiza tu contraseña',
  dashboard: 'Clientes',
};

describe('rutas de la aplicación según la sesión', () => {
  it.each([
    ['sin sesión', '/', ROUTES.login, TITLES.login, null],
    ['sin sesión', '/esto/no/existe', ROUTES.login, TITLES.login, null],
    ['sin sesión', ROUTES.login, ROUTES.login, TITLES.login, null],
    ['sin sesión', ROUTES.register, ROUTES.register, TITLES.register, null],
    ['sin sesión', ROUTES.forgotPassword, ROUTES.forgotPassword, TITLES.forgot, null],
    ['sin sesión', ROUTES.changePassword, ROUTES.login, TITLES.login, null],
    ['sin sesión', ROUTES.dashboard, ROUTES.login, TITLES.login, null],
    ['con sesión completa', '/', ROUTES.dashboard, TITLES.dashboard, FULL_SESSION],
    ['con sesión completa', '/esto/no/existe', ROUTES.dashboard, TITLES.dashboard, FULL_SESSION],
    ['con sesión completa', ROUTES.login, ROUTES.dashboard, TITLES.dashboard, FULL_SESSION],
    ['con sesión completa', ROUTES.register, ROUTES.dashboard, TITLES.dashboard, FULL_SESSION],
    [
      'con sesión completa',
      ROUTES.forgotPassword,
      ROUTES.dashboard,
      TITLES.dashboard,
      FULL_SESSION,
    ],
    [
      'con sesión completa',
      ROUTES.changePassword,
      ROUTES.dashboard,
      TITLES.dashboard,
      FULL_SESSION,
    ],
    ['con sesión completa', ROUTES.dashboard, ROUTES.dashboard, TITLES.dashboard, FULL_SESSION],
    ['con contraseña temporal', '/', ROUTES.changePassword, TITLES.change, TEMPORARY_SESSION],
    [
      'con contraseña temporal',
      ROUTES.login,
      ROUTES.changePassword,
      TITLES.change,
      TEMPORARY_SESSION,
    ],
    [
      'con contraseña temporal',
      ROUTES.register,
      ROUTES.changePassword,
      TITLES.change,
      TEMPORARY_SESSION,
    ],
    [
      'con contraseña temporal',
      ROUTES.forgotPassword,
      ROUTES.changePassword,
      TITLES.change,
      TEMPORARY_SESSION,
    ],
    [
      'con contraseña temporal',
      ROUTES.dashboard,
      ROUTES.changePassword,
      TITLES.change,
      TEMPORARY_SESSION,
    ],
    [
      'con contraseña temporal',
      ROUTES.changePassword,
      ROUTES.changePassword,
      TITLES.change,
      TEMPORARY_SESSION,
    ],
  ] as [string, string, string, string, Session | null][])(
    '%s: ir a %s termina en %s',
    async (_estado, visited, expectedPath, expectedTitle, session) => {
      mockSession(session);

      const { router } = await renderApp(visited);

      expect(
        await screen.findByRole('heading', { level: 1, name: expectedTitle }),
      ).toBeInTheDocument();
      expect(router.state.location.pathname).toBe(expectedPath);
    },
  );
});

describe('si no se puede comprobar la sesión', () => {
  it('con un error del servidor muestra una pantalla de error sin detalles internos', async () => {
    server.use(http.get('*/api/auth/me', () => apiError(500, 'INTERNAL_ERROR', 'Mongo caído')));

    await renderApp(ROUTES.login);

    expect(
      await screen.findByRole('heading', { name: 'No pudimos cargar la aplicación' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Tuvimos un problema en el servidor/)).toBeInTheDocument();
    expect(screen.queryByText(/Mongo/)).toBeNull();
  });

  it('sin conexión explica que no pudo conectar', async () => {
    server.use(http.get('*/api/auth/me', () => HttpResponse.error()));

    await renderApp(ROUTES.dashboard);

    expect(await screen.findByText(/No pudimos conectar con el servidor/)).toBeInTheDocument();
  });

  it('el botón Reintentar vuelve a comprobar y entra a la aplicación cuando ya hay servidor', async () => {
    server.use(http.get('*/api/auth/me', () => apiError(500, 'INTERNAL_ERROR', 'x')));
    await renderApp(ROUTES.login);
    await screen.findByRole('heading', { name: 'No pudimos cargar la aplicación' });

    mockSession(null);
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('heading', { name: TITLES.login })).toBeInTheDocument();
  });
});

describe('recorrido completo', () => {
  function simulateBackend() {
    let session: Session | null = null;

    server.use(
      http.get('*/api/auth/me', () =>
        session
          ? HttpResponse.json(session)
          : apiError(401, 'UNAUTHENTICATED', 'Inicia sesión para continuar'),
      ),
      http.post('*/api/auth/login', () => {
        session = TEMPORARY_SESSION;
        return HttpResponse.json(session);
      }),
      http.post('*/api/auth/change-password', () => {
        session = FULL_SESSION;
        return HttpResponse.json(session);
      }),
    );
  }

  it('entrar con la temporal → cambiar la contraseña → dashboard', async () => {
    simulateBackend();
    const user = userEvent.setup();
    const { router } = await renderApp(ROUTES.login);

    await user.type(screen.getByLabelText('Correo electrónico'), 'ana@correo.com');
    await user.type(screen.getByLabelText('Contraseña'), 'ClaveTemporal1');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByRole('heading', { name: TITLES.change })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(ROUTES.changePassword);

    await user.type(screen.getByLabelText('Nueva contraseña'), 'NuevaClave1');
    await user.type(screen.getByLabelText('Repetir nueva contraseña'), 'NuevaClave1');
    await user.click(screen.getByRole('button', { name: 'Actualizar contraseña' }));

    expect(await screen.findByRole('heading', { name: TITLES.dashboard })).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.pathname).toBe(ROUTES.dashboard));
  });

  it('una vez en el dashboard, volver atrás no regresa al formulario de cambiar contraseña', async () => {
    simulateBackend();
    const user = userEvent.setup();
    const { router } = await renderApp(ROUTES.login);
    await user.type(screen.getByLabelText('Correo electrónico'), 'ana@correo.com');
    await user.type(screen.getByLabelText('Contraseña'), 'ClaveTemporal1');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    await screen.findByRole('heading', { name: TITLES.change });
    await user.type(screen.getByLabelText('Nueva contraseña'), 'NuevaClave1');
    await user.type(screen.getByLabelText('Repetir nueva contraseña'), 'NuevaClave1');
    await user.click(screen.getByRole('button', { name: 'Actualizar contraseña' }));
    await screen.findByRole('heading', { name: TITLES.dashboard });

    await router.navigate(-1);

    await waitFor(() => expect(router.state.location.pathname).toBe(ROUTES.dashboard));
  });
});

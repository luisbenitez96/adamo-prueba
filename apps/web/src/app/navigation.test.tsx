import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderRoute } from '../test/render-route';
import { ROUTES } from './routes';

const REGISTER_TITLE = 'Crea tu cuenta en AdamoServices';
const LOGIN_TITLE = 'Inicia sesión en tu cuenta de AdamoServices';

describe('indicador de carga al cambiar de pantalla', () => {
  it('al navegar muestra el spinner en la zona del formulario y luego la pantalla nueva', async () => {
    vi.stubEnv('VITE_MIN_NAVIGATION_MS', '300');
    const { router } = await renderRoute(ROUTES.login);

    await userEvent.click(screen.getByRole('link', { name: 'Crear cuenta' }));

    expect(screen.getByRole('status')).toHaveTextContent('Cargando');
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByLabelText('Contraseña')).toBeNull();
    expect(router.state.location.pathname).toBe(ROUTES.login);

    expect(await screen.findByRole('heading', { name: REGISTER_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'false');
    expect(router.state.location.pathname).toBe(ROUTES.register);
  });

  it('el panel de la marca se queda fijo mientras carga', async () => {
    vi.stubEnv('VITE_MIN_NAVIGATION_MS', '300');
    await renderRoute(ROUTES.login);

    await userEvent.click(screen.getByRole('link', { name: 'Crear cuenta' }));

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'AdamoServices' })).toBeInTheDocument();
    expect(
      screen.getByText('Tus procesos más eficientes, seguros y sin fricciones.'),
    ).toBeInTheDocument();
    await screen.findByRole('heading', { name: REGISTER_TITLE });
  });

  it('la apertura de la aplicación no muestra spinner ni espera', async () => {
    vi.stubEnv('VITE_MIN_NAVIGATION_MS', '300');

    await renderRoute(ROUTES.login);

    expect(screen.getByRole('heading', { name: LOGIN_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('cada cambio de pantalla muestra el spinner, no solo el primero', async () => {
    vi.stubEnv('VITE_MIN_NAVIGATION_MS', '200');
    await renderRoute(ROUTES.login);

    await userEvent.click(screen.getByRole('link', { name: 'Crear cuenta' }));
    expect(screen.getByRole('status')).toBeInTheDocument();
    await screen.findByRole('heading', { name: REGISTER_TITLE });

    await userEvent.click(screen.getByRole('link', { name: 'Inicia sesión' }));
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: LOGIN_TITLE })).toBeInTheDocument();
  });

  it('también aparece al volver atrás con el botón del navegador', async () => {
    vi.stubEnv('VITE_MIN_NAVIGATION_MS', '200');
    const { router } = await renderRoute(ROUTES.login);
    await userEvent.click(screen.getByRole('link', { name: 'Crear cuenta' }));
    await screen.findByRole('heading', { name: REGISTER_TITLE });

    void router.navigate(-1);

    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument());
    expect(await screen.findByRole('heading', { name: LOGIN_TITLE })).toBeInTheDocument();
  });

  it('con el tiempo mínimo en 0 cambia de pantalla sin esperar', async () => {
    vi.stubEnv('VITE_MIN_NAVIGATION_MS', '0');
    await renderRoute(ROUTES.login);

    await userEvent.click(screen.getByRole('link', { name: 'Crear cuenta' }));

    expect(await screen.findByRole('heading', { name: REGISTER_TITLE })).toBeInTheDocument();
  });

  it('también muestra el spinner al navegar desde el código, por ejemplo tras iniciar sesión', async () => {
    vi.stubEnv('VITE_MIN_NAVIGATION_MS', '300');
    const { router } = await renderRoute(ROUTES.login);

    void router.navigate(ROUTES.forgotPassword);

    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument());
    expect(
      await screen.findByRole('heading', { name: 'Recupera tu contraseña' }),
    ).toBeInTheDocument();
  });
});

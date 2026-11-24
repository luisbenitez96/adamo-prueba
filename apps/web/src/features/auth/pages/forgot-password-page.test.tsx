import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { ROUTES } from '../../../app/routes';
import { apiError, mockPost } from '../../../test/api-handlers';
import { pause } from '../../../test/pause';
import { renderRoute } from '../../../test/render-route';
import { server } from '../../../test/server';

const EMAIL = 'ana@correo.com';
const FORGOT_PATH = '/api/auth/forgot-password';

const emailField = () => screen.getByLabelText('Correo electrónico');
const submitButton = () => screen.getByRole('button', { name: 'Enviar contraseña temporal' });

describe('ForgotPasswordPage', () => {
  it('muestra el título, la descripción y el formulario', async () => {
    await renderRoute(ROUTES.forgotPassword);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Recupera tu contraseña' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/te enviaremos una contraseña temporal/)).toBeInTheDocument();
    expect(emailField()).toBeInTheDocument();
    expect(submitButton()).toBeEnabled();
  });

  describe('validación en el navegador', () => {
    it('sin correo lo pide y no llama al servidor', async () => {
      const received = mockPost(FORGOT_PATH, () => HttpResponse.json({}, { status: 202 }));
      await renderRoute(ROUTES.forgotPassword);

      await userEvent.click(submitButton());

      expect(await screen.findByText('Ingresa tu correo electrónico')).toBeInTheDocument();
      expect(received).toHaveLength(0);
    });

    it('con un correo mal formado lo indica y no llama al servidor', async () => {
      const received = mockPost(FORGOT_PATH, () => HttpResponse.json({}, { status: 202 }));
      const user = userEvent.setup();
      await renderRoute(ROUTES.forgotPassword);

      await user.type(emailField(), 'no-es-un-correo');
      await user.click(submitButton());

      expect(await screen.findByText('Ingresa un correo electrónico válido')).toBeInTheDocument();
      expect(received).toHaveLength(0);
    });
  });

  describe('solicitud enviada', () => {
    it('envía el correo escrito sin espacios sobrantes', async () => {
      const received = mockPost(FORGOT_PATH, () => HttpResponse.json({}, { status: 202 }));
      const user = userEvent.setup();
      await renderRoute(ROUTES.forgotPassword);

      await user.type(emailField(), `  ${EMAIL} `);
      await user.click(submitButton());

      await screen.findByRole('heading', { name: 'Revisa tu correo' });
      expect(received).toEqual([{ email: EMAIL }]);
    });

    it('confirma sin revelar si el correo está registrado', async () => {
      mockPost(FORGOT_PATH, () => HttpResponse.json({}, { status: 202 }));
      const user = userEvent.setup();
      await renderRoute(ROUTES.forgotPassword);

      await user.type(emailField(), EMAIL);
      await user.click(submitButton());

      expect(await screen.findByRole('heading', { name: 'Revisa tu correo' })).toHaveFocus();
      expect(screen.getByText(/Si el correo está registrado/)).toBeInTheDocument();
      expect(screen.queryByLabelText('Correo electrónico')).toBeNull();
    });

    it('ofrece volver a iniciar sesión', async () => {
      mockPost(FORGOT_PATH, () => HttpResponse.json({}, { status: 202 }));
      const user = userEvent.setup();
      const { router } = await renderRoute(ROUTES.forgotPassword);
      await user.type(emailField(), EMAIL);
      await user.click(submitButton());

      await user.click(await screen.findByRole('link', { name: 'Volver a iniciar sesión' }));

      expect(router.state.location.pathname).toBe(ROUTES.login);
    });
  });

  describe('errores', () => {
    it('con demasiados intentos muestra el aviso del servidor', async () => {
      mockPost(FORGOT_PATH, () =>
        apiError(429, 'TOO_MANY_REQUESTS', 'Demasiados intentos, inténtalo más tarde'),
      );
      const user = userEvent.setup();
      await renderRoute(ROUTES.forgotPassword);

      await user.type(emailField(), EMAIL);
      await user.click(submitButton());

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Demasiados intentos, inténtalo más tarde',
      );
      expect(screen.queryByRole('heading', { name: 'Revisa tu correo' })).toBeNull();
    });

    it('si el servidor falla muestra un mensaje genérico sin detalles internos', async () => {
      mockPost(FORGOT_PATH, () => apiError(500, 'INTERNAL_ERROR', 'stack interno'));
      const user = userEvent.setup();
      await renderRoute(ROUTES.forgotPassword);

      await user.type(emailField(), EMAIL);
      await user.click(submitButton());

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Tuvimos un problema en el servidor');
      expect(alert).not.toHaveTextContent('stack interno');
    });

    it('si no hay conexión lo dice y se puede reintentar', async () => {
      server.use(http.post(`*${FORGOT_PATH}`, () => HttpResponse.error()));
      const user = userEvent.setup();
      await renderRoute(ROUTES.forgotPassword);

      await user.type(emailField(), EMAIL);
      await user.click(submitButton());

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'No pudimos conectar con el servidor',
      );
      expect(submitButton()).toBeEnabled();
    });
  });

  it('mientras se envía bloquea el botón y no permite un segundo envío', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    let requests = 0;
    server.use(
      http.post(`*${FORGOT_PATH}`, async () => {
        requests++;
        await gate;
        return HttpResponse.json({}, { status: 202 });
      }),
    );
    const user = userEvent.setup();
    await renderRoute(ROUTES.forgotPassword);
    await user.type(emailField(), EMAIL);

    await user.click(submitButton());
    await waitFor(() => expect(submitButton()).toBeDisabled());
    await user.type(emailField(), '{Enter}');
    await user.click(submitButton());
    release();

    await screen.findByRole('heading', { name: 'Revisa tu correo' });
    expect(requests).toBe(1);
  });

  it('"Inicia sesión" lleva al login', async () => {
    const { router } = await renderRoute(ROUTES.forgotPassword);

    await userEvent.click(screen.getByRole('link', { name: 'Inicia sesión' }));

    expect(router.state.location.pathname).toBe(ROUTES.login);
  });

  describe('tiempo mínimo del indicador de carga', () => {
    it('el spinner se mantiene aunque el servidor responda al instante y recién después confirma', async () => {
      vi.stubEnv('VITE_MIN_LOADING_MS', '300');
      mockPost(FORGOT_PATH, () => HttpResponse.json({}, { status: 202 }));
      const user = userEvent.setup();
      await renderRoute(ROUTES.forgotPassword);
      await user.type(emailField(), EMAIL);

      await user.click(submitButton());
      await pause(100);

      expect(submitButton()).toHaveAttribute('aria-busy', 'true');
      expect(screen.queryByRole('heading', { name: 'Revisa tu correo' })).toBeNull();
      expect(await screen.findByRole('heading', { name: 'Revisa tu correo' })).toBeInTheDocument();
    });
  });
});

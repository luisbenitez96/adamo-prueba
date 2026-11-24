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
const PASSWORD = 'Secreta123';
const LOGIN_PATH = '/api/auth/login';

const emailField = () => screen.getByLabelText('Correo electrónico');
const passwordField = () => screen.getByLabelText('Contraseña');
const submitButton = () => screen.getByRole('button', { name: 'Iniciar sesión' });

async function fillCredentials(
  user: ReturnType<typeof userEvent.setup>,
  email = EMAIL,
  password = PASSWORD,
) {
  await user.type(emailField(), email);
  await user.type(passwordField(), password);
}

describe('LoginPage', () => {
  it('muestra el título, la descripción y los campos del diseño', async () => {
    await renderRoute(ROUTES.login);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Inicia sesión en tu cuenta de AdamoServices',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Ingresa tus credenciales a continuación para continuar:'),
    ).toBeInTheDocument();
    expect(emailField()).toHaveAttribute('type', 'email');
    expect(passwordField()).toHaveAttribute('type', 'password');
    expect(submitButton()).toBeEnabled();
  });

  it('muestra el logo y la frase de la marca', async () => {
    await renderRoute(ROUTES.login);

    expect(screen.getByRole('img', { name: 'AdamoServices' })).toBeInTheDocument();
    expect(
      screen.getByText('Tus procesos más eficientes, seguros y sin fricciones.'),
    ).toBeInTheDocument();
  });

  describe('validación en el navegador', () => {
    it('con el formulario vacío muestra qué falta y no llama al servidor', async () => {
      const received = mockPost(LOGIN_PATH, () => HttpResponse.json({}));
      await renderRoute(ROUTES.login);

      await userEvent.click(submitButton());

      expect(await screen.findByText('Ingresa tu correo electrónico')).toBeInTheDocument();
      expect(screen.getByText('Ingresa tu contraseña')).toBeInTheDocument();
      expect(emailField()).toBeInvalid();
      expect(passwordField()).toBeInvalid();
      expect(received).toHaveLength(0);
    });

    it('rechaza un correo mal formado sin llamar al servidor', async () => {
      const received = mockPost(LOGIN_PATH, () => HttpResponse.json({}));
      const user = userEvent.setup();
      await renderRoute(ROUTES.login);

      await fillCredentials(user, 'ana@', PASSWORD);
      await user.click(submitButton());

      expect(await screen.findByText('Ingresa un correo electrónico válido')).toBeInTheDocument();
      expect(received).toHaveLength(0);
    });

    it('quita el mensaje de error al corregir el campo', async () => {
      const user = userEvent.setup();
      await renderRoute(ROUTES.login);
      await user.click(submitButton());
      await screen.findByText('Ingresa tu correo electrónico');

      await user.type(emailField(), EMAIL);

      await waitFor(() => expect(screen.queryByText('Ingresa tu correo electrónico')).toBeNull());
    });
  });

  describe('inicio de sesión correcto', () => {
    it('envía el correo y la contraseña escritos', async () => {
      const received = mockPost(LOGIN_PATH, () =>
        HttpResponse.json({ email: EMAIL, requiresPasswordChange: false }),
      );
      const user = userEvent.setup();
      await renderRoute(ROUTES.login);

      await fillCredentials(user, `  ${EMAIL} `);
      await user.click(submitButton());

      await screen.findByText('Destino: dashboard');
      expect(received).toEqual([{ email: EMAIL, password: PASSWORD }]);
    });

    it('lleva al dashboard cuando ya tiene su contraseña', async () => {
      mockPost(LOGIN_PATH, () =>
        HttpResponse.json({ email: EMAIL, requiresPasswordChange: false }),
      );
      const user = userEvent.setup();
      const { router } = await renderRoute(ROUTES.login);

      await fillCredentials(user);
      await user.click(submitButton());

      await screen.findByText('Destino: dashboard');
      expect(router.state.location.pathname).toBe(ROUTES.dashboard);
    });

    it('lleva a cambiar la contraseña cuando entró con la temporal', async () => {
      mockPost(LOGIN_PATH, () => HttpResponse.json({ email: EMAIL, requiresPasswordChange: true }));
      const user = userEvent.setup();
      const { router } = await renderRoute(ROUTES.login);

      await fillCredentials(user);
      await user.click(submitButton());

      await screen.findByText('Destino: cambiar contraseña');
      expect(router.state.location.pathname).toBe(ROUTES.changePassword);
    });

    it('permite enviar el formulario con la tecla Enter', async () => {
      const received = mockPost(LOGIN_PATH, () =>
        HttpResponse.json({ email: EMAIL, requiresPasswordChange: false }),
      );
      const user = userEvent.setup();
      await renderRoute(ROUTES.login);

      await user.type(emailField(), EMAIL);
      await user.type(passwordField(), `${PASSWORD}{Enter}`);

      await screen.findByText('Destino: dashboard');
      expect(received).toHaveLength(1);
    });

    it('al volver atrás no regresa al formulario de inicio de sesión', async () => {
      mockPost(LOGIN_PATH, () =>
        HttpResponse.json({ email: EMAIL, requiresPasswordChange: false }),
      );
      const user = userEvent.setup();
      const { router } = await renderRoute(ROUTES.login);
      await fillCredentials(user);
      await user.click(submitButton());
      await screen.findByText('Destino: dashboard');

      await router.navigate(-1);

      expect(router.state.location.pathname).not.toBe(ROUTES.login);
    });
  });

  describe('errores', () => {
    it('con credenciales incorrectas avisa, conserva el correo y deja la contraseña lista para reintentar', async () => {
      mockPost(LOGIN_PATH, () =>
        apiError(401, 'INVALID_CREDENTIALS', 'Correo o contraseña incorrectos'),
      );
      const user = userEvent.setup();
      const { router } = await renderRoute(ROUTES.login);

      await fillCredentials(user);
      await user.click(submitButton());

      expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos');
      expect(router.state.location.pathname).toBe(ROUTES.login);
      expect(emailField()).toHaveValue(EMAIL);
      expect(passwordField()).toHaveValue('');
      expect(passwordField()).toHaveFocus();
      expect(submitButton()).toBeEnabled();
    });

    it('con demasiados intentos muestra el aviso del servidor', async () => {
      mockPost(LOGIN_PATH, () =>
        apiError(429, 'TOO_MANY_REQUESTS', 'Demasiados intentos, inténtalo más tarde'),
      );
      const user = userEvent.setup();
      await renderRoute(ROUTES.login);

      await fillCredentials(user);
      await user.click(submitButton());

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Demasiados intentos, inténtalo más tarde',
      );
    });

    it('si el servidor falla muestra un mensaje genérico sin detalles internos', async () => {
      mockPost(LOGIN_PATH, () => apiError(500, 'INTERNAL_ERROR', 'Mongo caído en 10.0.0.5'));
      const user = userEvent.setup();
      await renderRoute(ROUTES.login);

      await fillCredentials(user);
      await user.click(submitButton());

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Tuvimos un problema en el servidor');
      expect(alert).not.toHaveTextContent('Mongo');
    });

    it('si no hay conexión lo dice', async () => {
      server.use(http.post(`*${LOGIN_PATH}`, () => HttpResponse.error()));
      const user = userEvent.setup();
      await renderRoute(ROUTES.login);

      await fillCredentials(user);
      await user.click(submitButton());

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'No pudimos conectar con el servidor',
      );
    });

    it('si el servidor responde algo inesperado no navega y muestra un mensaje genérico', async () => {
      mockPost(LOGIN_PATH, () => HttpResponse.json({ cualquier: 'cosa' }));
      const user = userEvent.setup();
      const { router } = await renderRoute(ROUTES.login);

      await fillCredentials(user);
      await user.click(submitButton());

      expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error inesperado');
      expect(router.state.location.pathname).toBe(ROUTES.login);
    });

    it('el error desaparece mientras se envía el siguiente intento', async () => {
      let attempt = 0;
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      server.use(
        http.post(`*${LOGIN_PATH}`, async () => {
          attempt++;
          if (attempt === 1) {
            return apiError(401, 'INVALID_CREDENTIALS', 'Correo o contraseña incorrectos');
          }
          await gate;
          return HttpResponse.json({ email: EMAIL, requiresPasswordChange: false });
        }),
      );
      const user = userEvent.setup();
      await renderRoute(ROUTES.login);
      await fillCredentials(user, EMAIL, 'incorrecta');
      await user.click(submitButton());
      await screen.findByRole('alert');

      await user.type(passwordField(), PASSWORD);
      await user.click(submitButton());

      await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
      release();
      await screen.findByText('Destino: dashboard');
    });
  });

  describe('mientras se envía', () => {
    it('bloquea el botón y no permite un segundo envío', async () => {
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      let requests = 0;
      server.use(
        http.post(`*${LOGIN_PATH}`, async () => {
          requests++;
          await gate;
          return HttpResponse.json({ email: EMAIL, requiresPasswordChange: false });
        }),
      );
      const user = userEvent.setup();
      await renderRoute(ROUTES.login);
      await user.type(emailField(), EMAIL);
      await user.type(passwordField(), PASSWORD);

      await user.click(submitButton());
      await waitFor(() => expect(submitButton()).toBeDisabled());
      expect(submitButton()).toHaveAttribute('aria-busy', 'true');
      await user.type(passwordField(), '{Enter}');
      await user.click(submitButton());
      release();

      await screen.findByText('Destino: dashboard');
      expect(requests).toBe(1);
    });
  });

  describe('enlaces', () => {
    it('"Haz click aquí" lleva a recuperar la contraseña', async () => {
      const { router } = await renderRoute(ROUTES.login);

      await userEvent.click(screen.getByRole('link', { name: 'Haz click aquí' }));

      expect(router.state.location.pathname).toBe(ROUTES.forgotPassword);
    });

    it('"Crear cuenta" lleva al registro', async () => {
      const { router } = await renderRoute(ROUTES.login);

      await userEvent.click(screen.getByRole('link', { name: 'Crear cuenta' }));

      expect(router.state.location.pathname).toBe(ROUTES.register);
    });
  });

  it('el botón del ojo muestra la contraseña escrita', async () => {
    const user = userEvent.setup();
    await renderRoute(ROUTES.login);
    await user.type(passwordField(), PASSWORD);

    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));

    expect(passwordField()).toHaveAttribute('type', 'text');
    expect(passwordField()).toHaveValue(PASSWORD);
  });

  describe('tiempo mínimo del indicador de carga', () => {
    it('el spinner se mantiene aunque el servidor responda al instante y recién después avanza', async () => {
      vi.stubEnv('VITE_MIN_LOADING_MS', '300');
      mockPost(LOGIN_PATH, () =>
        HttpResponse.json({ email: EMAIL, requiresPasswordChange: false }),
      );
      const user = userEvent.setup();
      await renderRoute(ROUTES.login);
      await fillCredentials(user);

      await user.click(submitButton());
      await pause(100);

      expect(submitButton()).toBeDisabled();
      expect(submitButton()).toHaveAttribute('aria-busy', 'true');
      expect(screen.queryByText('Destino: dashboard')).toBeNull();
      await screen.findByText('Destino: dashboard');
    });

    it('el aviso de error también espera a que se vea el spinner', async () => {
      vi.stubEnv('VITE_MIN_LOADING_MS', '300');
      mockPost(LOGIN_PATH, () =>
        apiError(401, 'INVALID_CREDENTIALS', 'Correo o contraseña incorrectos'),
      );
      const user = userEvent.setup();
      await renderRoute(ROUTES.login);
      await fillCredentials(user);

      await user.click(submitButton());
      await pause(100);

      expect(submitButton()).toHaveAttribute('aria-busy', 'true');
      expect(screen.queryByRole('alert')).toBeNull();
      expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos');
    });
  });
});

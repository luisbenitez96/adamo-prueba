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
const REGISTER_PATH = '/api/auth/register';

const emailField = () => screen.getByLabelText('Correo electrónico');
const submitButton = () => screen.getByRole('button', { name: 'Crear cuenta' });

describe('RegisterPage', () => {
  it('muestra el título, la descripción y el formulario', async () => {
    await renderRoute(ROUTES.register);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Crea tu cuenta en AdamoServices' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/te enviaremos una contraseña temporal/)).toBeInTheDocument();
    expect(emailField()).toBeInTheDocument();
    expect(submitButton()).toBeEnabled();
  });

  it('solo pide el correo, no una contraseña', async () => {
    await renderRoute(ROUTES.register);

    expect(screen.queryByLabelText('Contraseña')).toBeNull();
  });

  describe('validación en el navegador', () => {
    it('sin correo lo pide y no llama al servidor', async () => {
      const received = mockPost(REGISTER_PATH, () => HttpResponse.json({}, { status: 202 }));
      await renderRoute(ROUTES.register);

      await userEvent.click(submitButton());

      expect(await screen.findByText('Ingresa tu correo electrónico')).toBeInTheDocument();
      expect(emailField()).toBeInvalid();
      expect(received).toHaveLength(0);
    });

    it('con un correo mal formado lo indica y no llama al servidor', async () => {
      const received = mockPost(REGISTER_PATH, () => HttpResponse.json({}, { status: 202 }));
      const user = userEvent.setup();
      await renderRoute(ROUTES.register);

      await user.type(emailField(), 'ana@correo');
      await user.click(submitButton());

      expect(await screen.findByText('Ingresa un correo electrónico válido')).toBeInTheDocument();
      expect(received).toHaveLength(0);
    });
  });

  describe('cuenta creada', () => {
    async function register(user: ReturnType<typeof userEvent.setup>, email = EMAIL) {
      await user.type(emailField(), email);
      await user.click(submitButton());
    }

    it('envía el correo escrito sin espacios sobrantes', async () => {
      const received = mockPost(REGISTER_PATH, () => HttpResponse.json({}, { status: 202 }));
      const user = userEvent.setup();
      await renderRoute(ROUTES.register);

      await register(user, `  ${EMAIL} `);

      await screen.findByRole('heading', { name: 'Revisa tu correo' });
      expect(received).toEqual([{ email: EMAIL }]);
    });

    it('avisa que revise su correo, indicando a cuál se envió, y oculta el formulario', async () => {
      mockPost(REGISTER_PATH, () => HttpResponse.json({}, { status: 202 }));
      const user = userEvent.setup();
      await renderRoute(ROUTES.register);

      await register(user);

      expect(await screen.findByRole('heading', { name: 'Revisa tu correo' })).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`contraseña temporal a ${EMAIL}`))).toBeInTheDocument();
      expect(screen.queryByLabelText('Correo electrónico')).toBeNull();
    });

    it('lleva el foco al título para que se anuncie el cambio', async () => {
      mockPost(REGISTER_PATH, () => HttpResponse.json({}, { status: 202 }));
      const user = userEvent.setup();
      await renderRoute(ROUTES.register);

      await register(user);

      expect(await screen.findByRole('heading', { name: 'Revisa tu correo' })).toHaveFocus();
    });

    it('ofrece ir a iniciar sesión', async () => {
      mockPost(REGISTER_PATH, () => HttpResponse.json({}, { status: 202 }));
      const user = userEvent.setup();
      const { router } = await renderRoute(ROUTES.register);
      await register(user);

      await user.click(await screen.findByRole('link', { name: 'Ir a iniciar sesión' }));

      expect(router.state.location.pathname).toBe(ROUTES.login);
    });
  });

  describe('errores', () => {
    it('si el correo ya está registrado lo muestra bajo el campo y no confirma el envío', async () => {
      mockPost(REGISTER_PATH, () =>
        apiError(409, 'EMAIL_ALREADY_REGISTERED', 'Este correo ya está registrado'),
      );
      const user = userEvent.setup();
      await renderRoute(ROUTES.register);

      await user.type(emailField(), EMAIL);
      await user.click(submitButton());

      const message = await screen.findByText('Este correo ya está registrado');
      expect(message).toHaveAttribute('role', 'alert');
      expect(emailField()).toBeInvalid();
      expect(emailField()).toHaveAccessibleDescription('Este correo ya está registrado');
      expect(screen.queryByRole('heading', { name: 'Revisa tu correo' })).toBeNull();
      expect(screen.getAllByRole('alert')).toHaveLength(1);
    });

    it('tras un correo ya registrado se puede probar con otro y continuar', async () => {
      let attempt = 0;
      server.use(
        http.post(`*${REGISTER_PATH}`, () => {
          attempt++;
          return attempt === 1
            ? apiError(409, 'EMAIL_ALREADY_REGISTERED', 'Este correo ya está registrado')
            : HttpResponse.json({}, { status: 202 });
        }),
      );
      const user = userEvent.setup();
      await renderRoute(ROUTES.register);
      await user.type(emailField(), EMAIL);
      await user.click(submitButton());
      await screen.findByText('Este correo ya está registrado');

      await user.clear(emailField());
      await user.type(emailField(), 'luis@correo.com');
      await user.click(submitButton());

      expect(await screen.findByRole('heading', { name: 'Revisa tu correo' })).toBeInTheDocument();
      expect(screen.getByText(/luis@correo.com/)).toBeInTheDocument();
    });

    it('con demasiados intentos muestra el aviso como alerta del formulario, no del campo', async () => {
      mockPost(REGISTER_PATH, () =>
        apiError(429, 'TOO_MANY_REQUESTS', 'Demasiados intentos, inténtalo más tarde'),
      );
      const user = userEvent.setup();
      await renderRoute(ROUTES.register);

      await user.type(emailField(), EMAIL);
      await user.click(submitButton());

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Demasiados intentos, inténtalo más tarde',
      );
      expect(emailField()).toBeValid();
    });

    it('si el servidor falla muestra un mensaje genérico sin detalles internos', async () => {
      mockPost(REGISTER_PATH, () => apiError(500, 'INTERNAL_ERROR', 'SMTP 10.0.0.9 rechazado'));
      const user = userEvent.setup();
      await renderRoute(ROUTES.register);

      await user.type(emailField(), EMAIL);
      await user.click(submitButton());

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Tuvimos un problema en el servidor');
      expect(alert).not.toHaveTextContent('SMTP');
    });

    it('si no hay conexión lo dice y no confirma el envío', async () => {
      server.use(http.post(`*${REGISTER_PATH}`, () => HttpResponse.error()));
      const user = userEvent.setup();
      await renderRoute(ROUTES.register);

      await user.type(emailField(), EMAIL);
      await user.click(submitButton());

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'No pudimos conectar con el servidor',
      );
      expect(screen.queryByRole('heading', { name: 'Revisa tu correo' })).toBeNull();
    });
  });

  it('mientras se envía bloquea el botón y no permite un segundo envío', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    let requests = 0;
    server.use(
      http.post(`*${REGISTER_PATH}`, async () => {
        requests++;
        await gate;
        return HttpResponse.json({}, { status: 202 });
      }),
    );
    const user = userEvent.setup();
    await renderRoute(ROUTES.register);
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
    const { router } = await renderRoute(ROUTES.register);

    await userEvent.click(screen.getByRole('link', { name: 'Inicia sesión' }));

    expect(router.state.location.pathname).toBe(ROUTES.login);
  });

  describe('tiempo mínimo del indicador de carga', () => {
    it('el spinner se mantiene aunque el servidor responda al instante y recién después confirma', async () => {
      vi.stubEnv('VITE_MIN_LOADING_MS', '300');
      mockPost(REGISTER_PATH, () => HttpResponse.json({}, { status: 202 }));
      const user = userEvent.setup();
      await renderRoute(ROUTES.register);
      await user.type(emailField(), EMAIL);

      await user.click(submitButton());
      await pause(100);

      expect(submitButton()).toHaveAttribute('aria-busy', 'true');
      expect(screen.queryByRole('heading', { name: 'Revisa tu correo' })).toBeNull();
      expect(await screen.findByRole('heading', { name: 'Revisa tu correo' })).toBeInTheDocument();
    });
  });
});

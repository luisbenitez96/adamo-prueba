import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROUTES } from '../../../app/routes';
import {
  apiError,
  FULL_SESSION,
  mockPost,
  mockSession,
  TEMPORARY_SESSION,
} from '../../../test/api-handlers';
import { pause } from '../../../test/pause';
import { renderRoute } from '../../../test/render-route';
import { server } from '../../../test/server';

const CHANGE_PATH = '/api/auth/change-password';
const NEW_PASSWORD = 'NuevaClave1';

const newPasswordField = () => screen.getByLabelText('Nueva contraseña');
const confirmField = () => screen.getByLabelText('Repetir nueva contraseña');
const submitButton = () => screen.getByRole('button', { name: 'Actualizar contraseña' });

async function fill(
  user: ReturnType<typeof userEvent.setup>,
  newPassword = NEW_PASSWORD,
  confirmation = NEW_PASSWORD,
) {
  await user.type(newPasswordField(), newPassword);
  await user.type(confirmField(), confirmation);
}

describe('ChangePasswordPage', () => {
  beforeEach(() => {
    mockSession(TEMPORARY_SESSION);
  });

  it('muestra el título, la descripción y los campos del diseño', async () => {
    await renderRoute(ROUTES.changePassword);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Actualiza tu contraseña' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Antes de continuar, es necesario que actualices tu contraseña de uso temporal:',
      ),
    ).toBeInTheDocument();
    expect(newPasswordField()).toHaveAttribute('type', 'password');
    expect(confirmField()).toHaveAttribute('type', 'password');
    expect(submitButton()).toBeEnabled();
  });

  it('explica los requisitos de la contraseña bajo el primer campo', async () => {
    await renderRoute(ROUTES.changePassword);

    expect(newPasswordField()).toHaveAccessibleDescription(
      'Al menos 8 caracteres, una mayúscula y un número.',
    );
  });

  it('lleva el foco al primer campo al abrir la pantalla', async () => {
    await renderRoute(ROUTES.changePassword);

    await waitFor(() => expect(newPasswordField()).toHaveFocus());
  });

  it('indica a los gestores de contraseñas que son contraseñas nuevas', async () => {
    await renderRoute(ROUTES.changePassword);

    expect(newPasswordField()).toHaveAttribute('autocomplete', 'new-password');
    expect(confirmField()).toHaveAttribute('autocomplete', 'new-password');
  });

  it('cada campo tiene su propio botón para mostrar u ocultar', async () => {
    const user = userEvent.setup();
    await renderRoute(ROUTES.changePassword);
    const [firstToggle] = screen.getAllByRole('button', { name: 'Mostrar contraseña' });

    await user.click(firstToggle!);

    expect(newPasswordField()).toHaveAttribute('type', 'text');
    expect(confirmField()).toHaveAttribute('type', 'password');
  });

  describe('validación en el navegador', () => {
    it('con los campos vacíos pide cada uno y no llama al servidor', async () => {
      const received = mockPost(CHANGE_PATH, () => HttpResponse.json(FULL_SESSION));
      await renderRoute(ROUTES.changePassword);

      await userEvent.click(submitButton());

      expect(await screen.findByText('Ingresa tu nueva contraseña')).toBeInTheDocument();
      expect(screen.getByText('Repite tu nueva contraseña')).toBeInTheDocument();
      expect(newPasswordField()).toBeInvalid();
      expect(confirmField()).toBeInvalid();
      expect(received).toHaveLength(0);
    });

    it.each([
      ['es muy corta', 'Abc1234'],
      ['no tiene mayúscula', 'abcdefg1'],
      ['no tiene número', 'Abcdefgh'],
    ])('rechaza una contraseña que %s explicando la regla', async (_caso, password) => {
      const received = mockPost(CHANGE_PATH, () => HttpResponse.json(FULL_SESSION));
      const user = userEvent.setup();
      await renderRoute(ROUTES.changePassword);

      await fill(user, password, password);
      await user.click(submitButton());

      expect(
        await screen.findByText(
          'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.',
        ),
      ).toBeInTheDocument();
      expect(newPasswordField()).toBeInvalid();
      expect(received).toHaveLength(0);
    });

    it('avisa cuando las contraseñas no coinciden, bajo el segundo campo', async () => {
      const received = mockPost(CHANGE_PATH, () => HttpResponse.json(FULL_SESSION));
      const user = userEvent.setup();
      await renderRoute(ROUTES.changePassword);

      await fill(user, NEW_PASSWORD, 'NuevaClave2');
      await user.click(submitButton());

      expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument();
      expect(confirmField()).toBeInvalid();
      expect(newPasswordField()).toBeValid();
      expect(received).toHaveLength(0);
    });

    it('quita el aviso al corregir el campo', async () => {
      const user = userEvent.setup();
      await renderRoute(ROUTES.changePassword);
      await fill(user, NEW_PASSWORD, 'NuevaClave2');
      await user.click(submitButton());
      await screen.findByText('Las contraseñas no coinciden');

      await user.clear(confirmField());
      await user.type(confirmField(), NEW_PASSWORD);

      await waitFor(() => expect(screen.queryByText('Las contraseñas no coinciden')).toBeNull());
    });
  });

  describe('cambio correcto', () => {
    it('envía las dos contraseñas escritas', async () => {
      const received = mockPost(CHANGE_PATH, () => HttpResponse.json(FULL_SESSION));
      const user = userEvent.setup();
      await renderRoute(ROUTES.changePassword);

      await fill(user);
      await user.click(submitButton());

      await screen.findByText('Destino: dashboard');
      expect(received).toEqual([{ newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD }]);
    });

    it('al terminar lleva al dashboard', async () => {
      mockPost(CHANGE_PATH, () => HttpResponse.json(FULL_SESSION));
      const user = userEvent.setup();
      const { router } = await renderRoute(ROUTES.changePassword);

      await fill(user);
      await user.click(submitButton());

      await screen.findByText('Destino: dashboard');
      expect(router.state.location.pathname).toBe(ROUTES.home);
    });

    it('permite enviar con la tecla Enter', async () => {
      const received = mockPost(CHANGE_PATH, () => HttpResponse.json(FULL_SESSION));
      const user = userEvent.setup();
      await renderRoute(ROUTES.changePassword);

      await user.type(newPasswordField(), NEW_PASSWORD);
      await user.type(confirmField(), `${NEW_PASSWORD}{Enter}`);

      await screen.findByText('Destino: dashboard');
      expect(received).toHaveLength(1);
    });
  });

  describe('errores del servidor', () => {
    it('si la contraseña es igual a la actual lo muestra bajo el primer campo', async () => {
      mockPost(CHANGE_PATH, () =>
        apiError(
          400,
          'PASSWORD_REUSED',
          'No puedes reutilizar tu contraseña actual ni ninguna de las últimas 5 anteriores',
        ),
      );
      const user = userEvent.setup();
      await renderRoute(ROUTES.changePassword);

      await fill(user);
      await user.click(submitButton());

      const message = await screen.findByText(
        'No puedes reutilizar tu contraseña actual ni ninguna de las últimas 5 anteriores',
      );
      expect(message).toHaveAttribute('role', 'alert');
      expect(newPasswordField()).toBeInvalid();
      expect(screen.getAllByRole('alert')).toHaveLength(1);
    });

    it('si la contraseña temporal venció avisa y ofrece pedir una nueva', async () => {
      mockPost(CHANGE_PATH, () =>
        apiError(
          401,
          'TEMPORARY_PASSWORD_EXPIRED',
          'Tu contraseña temporal venció, solicita una nueva',
        ),
      );
      const user = userEvent.setup();
      await renderRoute(ROUTES.changePassword);

      await fill(user);
      await user.click(submitButton());

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Tu contraseña temporal venció, solicita una nueva',
      );
      expect(
        screen.getByRole('link', { name: 'Solicitar una nueva contraseña temporal' }),
      ).toHaveAttribute('href', ROUTES.forgotPassword);
    });

    it('desde el aviso de contraseña vencida se puede llegar a recuperar la contraseña', async () => {
      mockPost(CHANGE_PATH, () =>
        apiError(
          401,
          'TEMPORARY_PASSWORD_EXPIRED',
          'Tu contraseña temporal venció, solicita una nueva',
        ),
      );
      const user = userEvent.setup();
      const { router } = await renderRoute(ROUTES.changePassword);
      await fill(user);
      await user.click(submitButton());
      const link = await screen.findByRole('link', {
        name: 'Solicitar una nueva contraseña temporal',
      });

      mockSession(null);
      await user.click(link);

      expect(
        await screen.findByRole('heading', { name: 'Recupera tu contraseña' }),
      ).toBeInTheDocument();
      expect(router.state.location.pathname).toBe(ROUTES.forgotPassword);
    });

    it('si el servidor falla muestra un mensaje genérico sin detalles internos', async () => {
      mockPost(CHANGE_PATH, () => apiError(500, 'INTERNAL_ERROR', 'Mongo caído en 10.0.0.5'));
      const user = userEvent.setup();
      await renderRoute(ROUTES.changePassword);

      await fill(user);
      await user.click(submitButton());

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Tuvimos un problema en el servidor');
      expect(alert).not.toHaveTextContent('Mongo');
      expect(screen.queryByRole('link', { name: /Solicitar una nueva/ })).toBeNull();
    });

    it('si no hay conexión lo dice y se puede reintentar', async () => {
      server.use(http.post(`*${CHANGE_PATH}`, () => HttpResponse.error()));
      const user = userEvent.setup();
      await renderRoute(ROUTES.changePassword);

      await fill(user);
      await user.click(submitButton());

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'No pudimos conectar con el servidor',
      );
      expect(submitButton()).toBeEnabled();
    });
  });

  describe('mientras se envía', () => {
    it('bloquea el botón y no permite un segundo envío', async () => {
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      let requests = 0;
      server.use(
        http.post(`*${CHANGE_PATH}`, async () => {
          requests++;
          await gate;
          return HttpResponse.json(FULL_SESSION);
        }),
      );
      const user = userEvent.setup();
      await renderRoute(ROUTES.changePassword);
      await fill(user);

      await user.click(submitButton());
      await waitFor(() => expect(submitButton()).toBeDisabled());
      expect(submitButton()).toHaveAttribute('aria-busy', 'true');
      await user.type(confirmField(), '{Enter}');
      await user.click(submitButton());
      release();

      await screen.findByText('Destino: dashboard');
      expect(requests).toBe(1);
    });

    it('el spinner se mantiene el tiempo mínimo aunque el servidor responda al instante', async () => {
      vi.stubEnv('VITE_MIN_LOADING_MS', '300');
      mockPost(CHANGE_PATH, () => HttpResponse.json(FULL_SESSION));
      const user = userEvent.setup();
      await renderRoute(ROUTES.changePassword);
      await fill(user);

      await user.click(submitButton());
      await pause(100);

      expect(submitButton()).toHaveAttribute('aria-busy', 'true');
      expect(screen.queryByText('Destino: dashboard')).toBeNull();
      await screen.findByText('Destino: dashboard');
    });
  });
});

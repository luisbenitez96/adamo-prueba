import type { NotificationType } from './notification.entity.js';

interface NotificationTemplate {
  title: string;
  message: string;
}

export const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  'account-created': {
    title: 'Tu cuenta fue creada',
    message: 'Te damos la bienvenida a AdamoServices. Ya puedes explorar tus servicios y clientes.',
  },
  'temporary-password-requested': {
    title: 'Se solicitó una contraseña temporal',
    message:
      'Enviamos una contraseña temporal a tu correo. Si no fuiste tú, ignora el mensaje: tu contraseña actual sigue funcionando.',
  },
  'temporary-login': {
    title: 'Iniciaste sesión con una contraseña temporal',
    message: 'Por seguridad, debes definir una contraseña nueva antes de usar la plataforma.',
  },
  'password-changed': {
    title: 'Cambiaste tu contraseña',
    message:
      'Tu contraseña se actualizó correctamente. Si no fuiste tú, solicita una contraseña temporal de inmediato.',
  },
};

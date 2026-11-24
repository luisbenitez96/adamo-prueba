import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { passwordFieldStyles } from './password-field.styles';
import { TextField } from './text-field';
import type { TextFieldProps } from './text-field';

export type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'trailing'>;

export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? Eye : EyeOff;

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          aria-label="Mostrar contraseña"
          aria-pressed={visible}
          className={passwordFieldStyles.toggle}
          onClick={() => setVisible((current) => !current)}
        >
          <Icon className={passwordFieldStyles.icon} />
        </button>
      }
    />
  );
}

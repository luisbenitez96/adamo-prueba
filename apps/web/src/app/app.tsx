import { Button } from '../components/ui/button';
import { Logo } from '../components/ui/logo';
import { PasswordField } from '../components/ui/password-field';
import { TextField } from '../components/ui/text-field';
import { appStyles } from './app.styles';

export function App() {
  return (
    <main className={appStyles.page}>
      <div className={appStyles.logoBox}>
        <Logo />
      </div>
      <TextField label="Correo electrónico" type="email" autoComplete="email" />
      <TextField label="Correo electrónico" error="Ingresa un correo electrónico válido" />
      <PasswordField
        label="Nueva contraseña"
        hint="Al menos 8 caracteres, una mayúscula y un número."
      />
      <div className={appStyles.row}>
        <Button>Iniciar sesión</Button>
        <Button size="sm">Gestionar clientes</Button>
        <Button loading>Enviando</Button>
      </div>
    </main>
  );
}

import type { ReactNode } from 'react';
import { formAlertStyles } from './form-alert.styles';

export interface FormAlertProps {
  children: ReactNode;
  className?: string;
}

export function FormAlert({ children, className }: FormAlertProps) {
  return (
    <p role="alert" className={formAlertStyles({ className })}>
      {children}
    </p>
  );
}

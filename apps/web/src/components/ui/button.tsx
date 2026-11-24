import type { VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { buttonStyles } from './button.styles';
import { Spinner } from './spinner';

export interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonStyles> {
  loading?: boolean;
}

export function Button({
  size,
  fullWidth,
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ size, fullWidth, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...buttonProps}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

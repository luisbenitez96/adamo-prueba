import type { VariantProps } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';
import { spinnerStyles } from './spinner.styles';

export interface SpinnerProps extends VariantProps<typeof spinnerStyles> {
  className?: string;
}

export function Spinner({ size, className }: SpinnerProps) {
  return <LoaderCircle className={spinnerStyles({ size, className })} />;
}

import type { VariantProps } from 'class-variance-authority';
import logoUrl from '../../assets/logo.svg';
import { logoStyles } from './logo.styles';

export interface LogoProps extends VariantProps<typeof logoStyles> {
  className?: string;
}

export function Logo({ size, className }: LogoProps) {
  return <img src={logoUrl} alt="AdamoServices" className={logoStyles({ size, className })} />;
}

import type { VariantProps } from 'class-variance-authority';
import { Link } from 'react-router';
import type { LinkProps } from 'react-router';
import { buttonStyles } from './button.styles';

export interface ButtonLinkProps extends LinkProps, VariantProps<typeof buttonStyles> {}

export function ButtonLink({ size, fullWidth, className, ...linkProps }: ButtonLinkProps) {
  return <Link className={buttonStyles({ size, fullWidth, className })} {...linkProps} />;
}

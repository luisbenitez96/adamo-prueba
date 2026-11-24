import { Link } from 'react-router';
import type { LinkProps } from 'react-router';
import { textLinkStyles } from './text-link.styles';

export function TextLink({ className, ...linkProps }: LinkProps) {
  return <Link className={textLinkStyles({ className })} {...linkProps} />;
}

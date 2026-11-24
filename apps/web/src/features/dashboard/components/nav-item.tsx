import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { navItemIconStyles, navItemStyles } from './nav-item.styles';

interface NavItemProps {
  icon: LucideIcon;
  to?: string;
  end?: boolean;
  children: ReactNode;
}

export function NavItem({ icon: Icon, to, end = false, children }: NavItemProps) {
  const content = (
    <>
      <Icon strokeWidth={1.5} className={navItemIconStyles} />
      {children}
    </>
  );

  if (!to) {
    return (
      <button type="button" aria-disabled="true" className={navItemStyles()}>
        {content}
      </button>
    );
  }

  return (
    <NavLink to={to} end={end} className={({ isActive }) => navItemStyles({ active: isActive })}>
      {content}
    </NavLink>
  );
}

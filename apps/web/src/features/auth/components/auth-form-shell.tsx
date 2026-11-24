import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { authFormShellStyles } from './auth-form-shell.styles';

interface AuthFormShellProps {
  title: string;
  description: string;
  focusTitleOnMount?: boolean;
  children: ReactNode;
}

export function AuthFormShell({
  title,
  description,
  focusTitleOnMount = false,
  children,
}: AuthFormShellProps) {
  const titleId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focusTitleOnMount) {
      titleRef.current?.focus();
    }
  }, [focusTitleOnMount]);

  return (
    <section aria-labelledby={titleId}>
      <h1 id={titleId} ref={titleRef} tabIndex={-1} className={authFormShellStyles.title}>
        {title}
      </h1>
      <p className={authFormShellStyles.description}>{description}</p>
      <div className={authFormShellStyles.body}>{children}</div>
    </section>
  );
}

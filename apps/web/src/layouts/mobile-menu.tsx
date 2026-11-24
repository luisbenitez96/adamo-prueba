import { X } from 'lucide-react';
import { useEffect, useEffectEvent, useRef } from 'react';
import type { ReactNode } from 'react';
import { mobileMenuStyles } from './mobile-menu.styles';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface MobileMenuProps {
  id?: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

function keepFocusInside(event: KeyboardEvent, panel: HTMLElement) {
  const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (!first || !last) {
    return;
  }

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function MobileMenu({ id, open, onClose, children }: MobileMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    } else if (event.key === 'Tab' && panelRef.current) {
      keepFocusInside(event, panelRef.current);
    }
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <>
      <div role="presentation" className={mobileMenuStyles.backdrop} onClick={onClose} />
      <div
        ref={panelRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        tabIndex={-1}
        className={mobileMenuStyles.panel}
      >
        <button
          type="button"
          aria-label="Cerrar menú"
          className={mobileMenuStyles.close}
          onClick={onClose}
        >
          <X className={mobileMenuStyles.closeIcon} />
        </button>
        {children}
      </div>
    </>
  );
}

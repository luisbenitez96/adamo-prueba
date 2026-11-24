import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import { moreSheetStyles } from './more-sheet.styles';

interface MoreSheetProps {
  id: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export const MoreSheet = forwardRef<HTMLDivElement, MoreSheetProps>(function MoreSheet(
  { id, open, onClose, children },
  ref,
) {
  return (
    <>
      <div
        role="presentation"
        aria-hidden="true"
        className={moreSheetStyles.backdrop({ open })}
        onClick={onClose}
      />
      <div
        ref={ref}
        id={id}
        inert={!open}
        aria-label="Más opciones"
        role="group"
        className={moreSheetStyles.sheet({ open })}
      >
        {children}
      </div>
    </>
  );
});

import { cva } from 'class-variance-authority';

export const moreSheetStyles = {
  backdrop: cva(
    'fixed inset-0 z-30 bg-black/40 transition-opacity duration-300 motion-reduce:transition-none lg:hidden',
    {
      variants: {
        open: {
          true: 'opacity-100',
          false: 'pointer-events-none opacity-0',
        },
      },
      defaultVariants: { open: false },
    },
  ),
  sheet: cva(
    'fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-[35] flex flex-col gap-1 rounded-t-3xl border-t border-white/10 bg-brand p-3 shadow-[0_-16px_32px_-16px_rgb(0_0_0/0.6)] transition-[translate,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none lg:hidden',
    {
      variants: {
        open: {
          true: 'translate-y-0 opacity-100',
          false: 'pointer-events-none translate-y-full opacity-0',
        },
      },
      defaultVariants: { open: false },
    },
  ),
};

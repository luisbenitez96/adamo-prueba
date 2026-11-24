import { cva } from 'class-variance-authority';

export const bottomNavStyles = {
  bar: 'group fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-brand pb-[env(safe-area-inset-bottom)] lg:hidden',
  track: 'relative flex h-16',
  indicator:
    'pointer-events-none absolute inset-y-0 left-0 flex w-1/3 justify-center transition-[translate,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none group-data-[active-tab=none]:opacity-0 group-data-[active-tab=clients]:translate-x-full group-data-[active-tab=more]:translate-x-[200%]',
  pill: 'mt-2 h-8 w-16 rounded-full bg-brand-soft',
  icon: 'size-6',
  label: 'text-xs',
};

export const tabStyles = cva(
  'relative z-10 flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 text-white/60 transition-[color,scale] duration-200 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white active:scale-95 motion-reduce:transition-none',
  {
    variants: {
      active: {
        true: 'text-white',
        false: '',
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

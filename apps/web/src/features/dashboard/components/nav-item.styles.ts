import { cva } from 'class-variance-authority';

export const navItemStyles = cva(
  'flex h-14 w-full cursor-pointer items-center gap-3 rounded-2xl px-7 text-base text-white transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:h-[72px]',
  {
    variants: {
      active: {
        true: 'bg-brand-soft',
        false: '',
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

export const navItemIconStyles = 'size-5 shrink-0';

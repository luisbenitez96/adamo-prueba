import { cva } from 'class-variance-authority';

export const buttonStyles = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-white transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60',
  {
    variants: {
      size: {
        md: 'h-12 px-5 text-base',
        sm: 'h-10 px-4 text-sm',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      fullWidth: false,
    },
  },
);

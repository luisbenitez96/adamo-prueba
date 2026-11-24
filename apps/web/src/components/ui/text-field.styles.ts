import { cva } from 'class-variance-authority';

export const textFieldStyles = {
  root: 'flex w-full flex-col gap-1.5',
  label: 'sr-only',
  control: 'relative',
  trailing: 'absolute inset-y-0 right-0 flex items-center pr-3',
  hint: 'text-xs text-muted',
  error: 'text-xs text-danger',
};

export const inputStyles = cva(
  'h-[50px] w-full rounded-lg border bg-white px-4 text-base text-ink outline-none transition-shadow placeholder:text-placeholder disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted',
  {
    variants: {
      invalid: {
        true: 'border-danger focus:ring-4 focus:ring-danger/15',
        false: 'border-line focus:border-ink focus:ring-4 focus:ring-line',
      },
      hasTrailing: {
        true: 'pr-12',
        false: '',
      },
    },
    defaultVariants: {
      invalid: false,
      hasTrailing: false,
    },
  },
);

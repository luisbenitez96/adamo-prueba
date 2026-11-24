import { cva } from 'class-variance-authority';

export const loadingIndicatorStyles = {
  root: cva('flex items-center justify-center text-brand', {
    variants: {
      fullScreen: {
        true: 'min-h-dvh',
        false: 'min-h-60',
      },
    },
    defaultVariants: {
      fullScreen: false,
    },
  }),
  label: 'sr-only',
};

import { cva } from 'class-variance-authority';

export const spinnerStyles = cva('animate-spin motion-reduce:animate-none', {
  variants: {
    size: {
      sm: 'size-4',
      lg: 'size-8',
    },
  },
  defaultVariants: {
    size: 'sm',
  },
});

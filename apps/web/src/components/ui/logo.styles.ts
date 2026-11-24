import { cva } from 'class-variance-authority';

export const logoStyles = cva('select-none', {
  variants: {
    size: {
      sm: 'w-[54px]',
      lg: 'w-[188px]',
    },
  },
  defaultVariants: {
    size: 'lg',
  },
});

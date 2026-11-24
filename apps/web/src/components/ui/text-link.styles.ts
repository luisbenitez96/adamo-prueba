import { cva } from 'class-variance-authority';

export const textLinkStyles = cva(
  'rounded-sm font-semibold text-ink underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
);

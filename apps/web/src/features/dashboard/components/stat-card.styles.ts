import { cva } from 'class-variance-authority';

export const statCardStyles = {
  root: 'flex flex-col gap-2 rounded-3xl border border-line bg-surface px-6 py-5',
  label: 'flex items-center gap-2 text-sm text-muted',
  value: 'text-3xl font-bold text-brand',
  caption: 'text-xs text-muted',
  dot: cva('size-2.5 shrink-0 rounded-full', {
    variants: {
      tone: {
        active: 'bg-green-600',
        pending: 'bg-amber-500',
        inactive: 'bg-placeholder',
      },
    },
  }),
};

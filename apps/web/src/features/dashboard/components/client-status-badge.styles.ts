import { cva } from 'class-variance-authority';

export const clientStatusBadgeStyles = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
  {
    variants: {
      status: {
        active: 'bg-green-50 text-green-700',
        pending: 'bg-amber-50 text-amber-700',
        inactive: 'bg-chip text-muted',
      },
    },
  },
);

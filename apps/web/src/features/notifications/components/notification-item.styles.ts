import { cva } from 'class-variance-authority';

export const notificationItemStyles = {
  root: cva('flex w-full gap-3 rounded-2xl px-3 py-3 text-left', {
    variants: {
      unread: {
        true: 'cursor-pointer bg-surface transition-colors hover:bg-chip focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand',
        false: '',
      },
    },
  }),
  marker: cva('mt-1.5 size-2.5 shrink-0 rounded-full', {
    variants: {
      unread: {
        true: 'bg-red-500',
        false: 'bg-transparent',
      },
    },
  }),
  body: 'min-w-0 flex-1',
  title: cva('text-sm text-ink', {
    variants: {
      unread: {
        true: 'font-bold',
        false: 'font-medium',
      },
    },
  }),
  message: 'mt-1 text-xs text-muted',
  time: 'mt-1 text-xs text-placeholder',
};

export const notificationsPanelStyles = {
  root: 'absolute right-0 top-full z-30 mt-2 flex max-h-[min(32rem,calc(100dvh-10rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-lg',
  header: 'flex items-center justify-between gap-2 border-b border-line px-4 py-3',
  title: 'text-sm font-bold text-ink',
  actions: 'flex items-center gap-1',
  markAll:
    'cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold text-ink transition-colors hover:bg-chip focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent',
  close:
    'flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink transition-colors hover:bg-chip focus-visible:outline-2 focus-visible:outline-brand',
  closeIcon: 'size-4',
  list: 'flex flex-col gap-1 overflow-y-auto p-2',
  state: 'flex flex-col items-start gap-3 p-4',
  emptyText: 'p-6 text-center text-sm text-muted',
};

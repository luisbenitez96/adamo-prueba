export const clientsTableStyles = {
  table: 'block w-full text-left text-sm @2xl:table',
  head: 'sr-only @2xl:not-sr-only @2xl:table-header-group',
  headCell: 'border-b border-line px-3 py-3 text-xs font-semibold text-muted',
  body: 'block @2xl:table-row-group',
  row: 'mb-3 block rounded-2xl border border-line bg-surface p-4 @2xl:mb-0 @2xl:table-row @2xl:rounded-none @2xl:border-0 @2xl:border-b @2xl:bg-transparent @2xl:p-0',
  cell: 'flex items-center justify-between gap-4 py-1 text-ink before:shrink-0 before:text-xs before:font-semibold before:text-muted before:content-[attr(data-label)] @2xl:table-cell @2xl:px-3 @2xl:py-3 @2xl:before:content-none',
  name: 'font-semibold text-brand',
  nowrap: '@2xl:whitespace-nowrap',
  email: 'break-all text-right @2xl:text-left',
};

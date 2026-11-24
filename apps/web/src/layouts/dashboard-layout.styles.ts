export const dashboardLayoutStyles = {
  root: 'min-h-dvh bg-page lg:grid lg:grid-cols-[256px_1fr]',
  sidebar: 'sticky top-0 hidden h-dvh overflow-y-auto bg-brand lg:block',
  mobileBar: 'sticky top-0 z-20 flex h-16 items-center justify-center bg-brand lg:hidden',
  main: 'min-w-0 px-4 pb-[calc(4rem+env(safe-area-inset-bottom)+2rem)] pt-6 sm:px-8 lg:px-10 lg:pb-10 xl:px-[104px]',
  page: 'animate-page-in motion-reduce:animate-none',
};

export const dashboardLayoutStyles = {
  root: 'min-h-dvh bg-page lg:grid lg:grid-cols-[256px_1fr]',
  sidebar: 'sticky top-0 hidden h-dvh overflow-y-auto bg-brand lg:block',
  mobileBar: 'sticky top-0 z-30 flex h-16 items-center justify-between bg-brand px-4 lg:hidden',
  menuButton:
    'flex size-10 cursor-pointer items-center justify-center rounded-lg text-white transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-white',
  menuIcon: 'size-6',
  main: 'min-w-0 px-4 pb-10 pt-6 sm:px-8 lg:px-10 xl:px-[104px]',
};

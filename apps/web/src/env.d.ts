interface ImportMetaEnv {
  readonly VITE_MIN_LOADING_MS?: string;
  readonly VITE_MIN_NAVIGATION_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

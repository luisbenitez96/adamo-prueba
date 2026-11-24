import { withMinimumDuration } from './minimum-duration';

const DEFAULT_MINIMUM_LOADING_MS = 500;
const DEFAULT_MINIMUM_NAVIGATION_MS = 300;

function parseMinimumMs(configured: string | undefined, fallback: number): number {
  const value = Number(configured);

  if (configured === undefined || Number.isNaN(value)) {
    return fallback;
  }

  return Math.max(0, value);
}

export function minimumLoadingMs(): number {
  return parseMinimumMs(import.meta.env.VITE_MIN_LOADING_MS, DEFAULT_MINIMUM_LOADING_MS);
}

export function minimumNavigationMs(): number {
  return parseMinimumMs(import.meta.env.VITE_MIN_NAVIGATION_MS, DEFAULT_MINIMUM_NAVIGATION_MS);
}

export function withLoadingFeedback<T>(task: () => Promise<T>): Promise<T> {
  return withMinimumDuration(task, minimumLoadingMs());
}

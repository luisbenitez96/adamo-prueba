import { minimumNavigationMs } from '../lib/loading-feedback';
import { withMinimumDuration } from '../lib/minimum-duration';

export function createNavigationLoader() {
  let isFirstLoad = true;

  return async function navigationLoader(): Promise<null> {
    if (isFirstLoad) {
      isFirstLoad = false;
      return null;
    }

    await withMinimumDuration(async () => undefined, minimumNavigationMs());
    return null;
  };
}

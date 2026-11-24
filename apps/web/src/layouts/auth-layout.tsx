import { Outlet, useNavigation } from 'react-router';
import { Logo } from '../components/ui/logo';
import { LoadingIndicator } from '../components/ui/loading-indicator';
import { authLayoutStyles } from './auth-layout.styles';

const BRAND_PHRASE = 'Tus procesos más eficientes, seguros y sin fricciones.';
const BRAND_FOOTER =
  'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beata.';

export function AuthLayout() {
  const isNavigating = useNavigation().state === 'loading';

  return (
    <div className={authLayoutStyles.root}>
      <aside className={authLayoutStyles.brand}>
        <div className={authLayoutStyles.brandMain}>
          <Logo size="responsive" />
          <p className={authLayoutStyles.phrase}>{BRAND_PHRASE}</p>
        </div>
        <p className={authLayoutStyles.footer}>{BRAND_FOOTER}</p>
      </aside>
      <main className={authLayoutStyles.content} aria-busy={isNavigating}>
        <div className={authLayoutStyles.formArea}>
          {isNavigating ? <LoadingIndicator /> : <Outlet />}
        </div>
      </main>
    </div>
  );
}

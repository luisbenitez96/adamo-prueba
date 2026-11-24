import { useRevalidator, useRouteError } from 'react-router';
import { Button } from '../components/ui/button';
import { Logo } from '../components/ui/logo';
import { describeError } from '../lib/describe-error';
import { routeErrorPageStyles } from './route-error-page.styles';

export function RouteErrorPage() {
  const error = useRouteError();
  const { revalidate, state } = useRevalidator();

  return (
    <main className={routeErrorPageStyles.page}>
      <div className={routeErrorPageStyles.brand}>
        <Logo size="sm" />
      </div>
      <h1 className={routeErrorPageStyles.title}>No pudimos cargar la aplicación</h1>
      <p className={routeErrorPageStyles.description}>{describeError(error)}</p>
      <Button loading={state === 'loading'} onClick={() => void revalidate()}>
        Reintentar
      </Button>
    </main>
  );
}

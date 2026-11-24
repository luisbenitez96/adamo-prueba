import { loadingIndicatorStyles } from './loading-indicator.styles';
import { Spinner } from './spinner';

export interface LoadingIndicatorProps {
  label?: string;
  fullScreen?: boolean;
}

export function LoadingIndicator({
  label = 'Cargando',
  fullScreen = false,
}: LoadingIndicatorProps) {
  return (
    <div role="status" className={loadingIndicatorStyles.root({ fullScreen })}>
      <Spinner size="lg" />
      <span className={loadingIndicatorStyles.label}>{label}</span>
    </div>
  );
}

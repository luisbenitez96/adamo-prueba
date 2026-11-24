import { statCardStyles as styles } from './stat-card.styles';

interface StatCardProps {
  label: string;
  value: string;
  caption?: string;
  tone?: 'active' | 'pending' | 'inactive';
}

export function StatCard({ label, value, caption, tone }: StatCardProps) {
  return (
    <article className={styles.root} aria-label={label}>
      <p className={styles.label}>
        {tone && (
          <span aria-hidden="true" data-testid="status-dot" className={styles.dot({ tone })} />
        )}
        {label}
      </p>
      <p className={styles.value}>{value}</p>
      {caption && <p className={styles.caption}>{caption}</p>}
    </article>
  );
}

import { formatRegistrationDate } from '../dashboard/format';

const relativeFormat = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86_400;
const DAYS_BEFORE_SHOWING_DATE = 7;

export function formatRelativeTime(isoDate: string, now: Date = new Date()): string {
  const elapsedSeconds = Math.floor((now.getTime() - new Date(isoDate).getTime()) / 1000);

  if (elapsedSeconds < SECONDS_PER_MINUTE) {
    return 'hace unos segundos';
  }

  if (elapsedSeconds < SECONDS_PER_HOUR) {
    return relativeFormat.format(-Math.floor(elapsedSeconds / SECONDS_PER_MINUTE), 'minute');
  }

  if (elapsedSeconds < SECONDS_PER_DAY) {
    return relativeFormat.format(-Math.floor(elapsedSeconds / SECONDS_PER_HOUR), 'hour');
  }

  const elapsedDays = Math.floor(elapsedSeconds / SECONDS_PER_DAY);

  if (elapsedDays < DAYS_BEFORE_SHOWING_DATE) {
    return relativeFormat.format(-elapsedDays, 'day');
  }

  return formatRegistrationDate(isoDate);
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

export function formatRelativeTime(date: string): string {
  const timestamp = new Date(date).getTime();
  if (!Number.isFinite(timestamp)) {
    return "";
  }

  const now = Date.now();
  const diff = Math.max(0, now - timestamp);

  if (diff < MINUTE_MS) {
    return "Agora";
  }

  if (diff < HOUR_MS) {
    return `${Math.floor(diff / MINUTE_MS)} min`;
  }

  if (diff < DAY_MS) {
    return `${Math.floor(diff / HOUR_MS)}h`;
  }

  if (diff < WEEK_MS) {
    const days = Math.floor(diff / DAY_MS);
    return days === 1 ? "ontem" : `${days}d`;
  }

  return new Date(timestamp).toLocaleDateString("pt-BR");
}

export function isWithinLastHours(date: string, hours: number): boolean {
  const timestamp = new Date(date).getTime();
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  return Date.now() - timestamp < hours * HOUR_MS;
}

import { format } from 'date-fns';

export const COLOMBIA_TIMEZONE = 'America/Bogota';

export const TIME_GROUPING_RANGES = ['day', 'week', 'month'] as const;

export type TimeGroupingRange = (typeof TIME_GROUPING_RANGES)[number];
export type DateInput = Date | string | number;

export interface RangeCount {
  key: string;
  count: number;
}

const colombiaDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: COLOMBIA_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function getColombiaDateParts(value: DateInput) {
  const date = value instanceof Date ? value : new Date(value);
  const parts = colombiaDateFormatter.formatToParts(date);

  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);

  return { year, month, day };
}

export function toColombiaTime(value: DateInput) {
  const { year, month, day } = getColombiaDateParts(value);

  return new Date(Date.UTC(year, month - 1, day, 12));
}

/**
 * Get the UTC Date that corresponds to the start of "today" in Colombia timezone.
 * Colombia is UTC-5, so midnight COT = 05:00 UTC.
 */
export function startOfColombiaDayUTC(value: DateInput = new Date()): Date {
  const { year, month, day } = getColombiaDateParts(value);
  // Midnight in Colombia (UTC-5) → 05:00 UTC
  return new Date(Date.UTC(year, month - 1, day, 5, 0, 0, 0));
}

export function getTimeGroupingKey(value: DateInput, range: TimeGroupingRange) {
  const zonedDate = toColombiaTime(value);

  if (range === 'day') {
    return format(zonedDate, 'yyyy-MM-dd');
  }

  if (range === 'week') {
    const startOfWeekDate = new Date(zonedDate);
    const daysFromMonday = (startOfWeekDate.getUTCDay() + 6) % 7;
    startOfWeekDate.setUTCDate(startOfWeekDate.getUTCDate() - daysFromMonday);

    return format(startOfWeekDate, 'yyyy-MM-dd');
  }

  return format(zonedDate, 'yyyy-MM');
}

export function groupDatesByRange(values: DateInput[], range: TimeGroupingRange): RangeCount[] {
  const counts = new Map<string, number>();

  for (const value of values) {
    const key = getTimeGroupingKey(value, range);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, count]) => ({ key, count }));
}

export function groupRecordsByRange<T>(
  records: T[],
  getDate: (record: T) => DateInput | null | undefined,
  range: TimeGroupingRange,
) {
  const dates: DateInput[] = [];

  for (const record of records) {
    const value = getDate(record);

    if (value) {
      dates.push(value);
    }
  }

  return groupDatesByRange(dates, range);
}

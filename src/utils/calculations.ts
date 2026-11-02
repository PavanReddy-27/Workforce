/**
 * Mathematical & Metric Calculations
 */

export function calculateAttendanceRate(present: number, scheduled: number): number {
  if (scheduled <= 0) return 0;
  return Number(((present / scheduled) * 100).toFixed(1));
}

export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

export function calculateSegmentPercentages<T extends { value: number }>(
  items: T[],
  total: number
): (T & { percentage: number })[] {
  if (total <= 0) {
    return items.map((item) => ({ ...item, percentage: 0 }));
  }
  return items.map((item) => ({
    ...item,
    percentage: Number(((item.value / total) * 100).toFixed(1)),
  }));
}

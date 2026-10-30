/**
 * Date parsing, formatting and validation utilities
 */

export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const isValidIsoDate = (dateStr: string): boolean => {
  if (!ISO_DATE_REGEX.test(dateStr)) return false;
  const d = new Date(`${dateStr}T00:00:00Z`);
  return !isNaN(d.getTime()) && d.toISOString().startsWith(dateStr);
};

export const getTodayIsoDate = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

export const getPastIsoDate = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

export const getDaysDifference = (startDate: string, endDate: string): number => {
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
};

export const getDateRangeList = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  const current = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

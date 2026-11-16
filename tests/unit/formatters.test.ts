import { describe, it } from 'node:test';
import { expect } from '../helpers/expect';
import { formatAttendanceDate, formatAttendanceTime } from '../../src/utils/formatters';

describe('Attendance display formatters', () => {
  it('formats stored attendance dates without changing the calendar day', () => {
    const formatted = formatAttendanceDate('2026-11-02');

    expect(formatted).not.toBe('2026-11-02');
    expect(formatted).toContain('2026');
  });

  it('formats persisted UTC timestamps as concise UTC times', () => {
    expect(formatAttendanceTime('2026-11-02T08:40:00Z')).toBe('08:40');
  });

  it('keeps missing and invalid attendance times explicit', () => {
    expect(formatAttendanceTime(null)).toBe('—');
    expect(formatAttendanceTime('not-a-time')).toBe('not-a-time');
  });
});

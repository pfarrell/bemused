import { formatDuration } from './formatters';

describe('formatDuration', () => {
  test('returns empty string for 0', () => {
    expect(formatDuration(0)).toBe('');
  });

  test('returns empty string for undefined', () => {
    expect(formatDuration(undefined)).toBe('');
  });

  test('returns empty string for NaN', () => {
    expect(formatDuration(NaN)).toBe('');
  });

  test('formats seconds under one minute', () => {
    expect(formatDuration(59)).toBe('0:59');
  });

  test('formats exactly one minute', () => {
    expect(formatDuration(60)).toBe('1:00');
  });

  test('formats minutes and seconds', () => {
    expect(formatDuration(61)).toBe('1:01');
  });

  test('pads single-digit seconds with leading zero', () => {
    expect(formatDuration(65)).toBe('1:05');
  });

  test('formats durations over one hour', () => {
    expect(formatDuration(3661)).toBe('61:01');
  });
});

import { isMobileDevice } from './device';

afterEach(() => {
  Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
});

test('returns true when viewport width is at or below the 768px breakpoint', () => {
  Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });
  expect(isMobileDevice()).toBe(true);
});

test('returns false on a wide viewport with a desktop user agent', () => {
  Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
  expect(isMobileDevice()).toBe(false);
});

test('returns true on a wide viewport when the user agent is mobile', () => {
  Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
  const originalUA = navigator.userAgent;
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    configurable: true,
  });
  expect(isMobileDevice()).toBe(true);
  Object.defineProperty(navigator, 'userAgent', { value: originalUA, configurable: true });
});

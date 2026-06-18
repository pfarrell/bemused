import { usePlayerStore } from './playerStore';

test('isLoading defaults to false and setIsLoading toggles it', () => {
  expect(usePlayerStore.getState().isLoading).toBe(false);
  usePlayerStore.getState().setIsLoading(true);
  expect(usePlayerStore.getState().isLoading).toBe(true);
  usePlayerStore.getState().setIsLoading(false);
  expect(usePlayerStore.getState().isLoading).toBe(false);
});

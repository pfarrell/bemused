import { useTagFilterStore } from './tagFilterStore';

beforeEach(() => {
  localStorage.clear();
  useTagFilterStore.setState({ activeTag: null });
});

describe('tagFilterStore', () => {
  test('activeTag starts as null', () => {
    expect(useTagFilterStore.getState().activeTag).toBeNull();
  });

  test('setTag sets activeTag', () => {
    useTagFilterStore.getState().setTag('rock');
    expect(useTagFilterStore.getState().activeTag).toBe('rock');
  });

  test('setTag persists to localStorage', () => {
    useTagFilterStore.getState().setTag('jazz');
    expect(localStorage.getItem('tag-filter')).toBe('jazz');
  });

  test('setTag with null clears activeTag', () => {
    useTagFilterStore.setState({ activeTag: 'rock' });
    useTagFilterStore.getState().setTag(null);
    expect(useTagFilterStore.getState().activeTag).toBeNull();
  });

  test('setTag with null removes localStorage entry', () => {
    localStorage.setItem('tag-filter', 'rock');
    useTagFilterStore.getState().setTag(null);
    expect(localStorage.getItem('tag-filter')).toBeNull();
  });

  test('clearTag sets activeTag to null', () => {
    useTagFilterStore.setState({ activeTag: 'pop' });
    useTagFilterStore.getState().clearTag();
    expect(useTagFilterStore.getState().activeTag).toBeNull();
  });

  test('clearTag removes localStorage entry', () => {
    localStorage.setItem('tag-filter', 'pop');
    useTagFilterStore.getState().clearTag();
    expect(localStorage.getItem('tag-filter')).toBeNull();
  });
});

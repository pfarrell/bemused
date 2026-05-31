import { create } from 'zustand';

const STORAGE_KEY = 'tag-filter';

export const useTagFilterStore = create((set) => ({
  activeTag: localStorage.getItem(STORAGE_KEY) || null,
  setTag: (tag) => {
    if (tag) localStorage.setItem(STORAGE_KEY, tag);
    else localStorage.removeItem(STORAGE_KEY);
    set({ activeTag: tag || null });
  },
  clearTag: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ activeTag: null });
  },
}));

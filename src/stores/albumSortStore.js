import { create } from 'zustand';

const STORAGE_KEY = 'album-sort';

// 'newest' | 'oldest' | 'alpha'. 'newest' matches the order the backend
// already returns, so it's the default.
export const useAlbumSortStore = create((set) => ({
  sortBy: localStorage.getItem(STORAGE_KEY) ?? 'newest',
  setSortBy: (sortBy) => {
    localStorage.setItem(STORAGE_KEY, sortBy);
    set({ sortBy });
  },
}));

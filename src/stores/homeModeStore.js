import { create } from 'zustand';

const STORAGE_KEY = 'home-mode';

export const useHomeModeStore = create((set) => ({
  mode: localStorage.getItem(STORAGE_KEY) ?? 'artists',
  setMode: (mode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    set({ mode });
  },
}));

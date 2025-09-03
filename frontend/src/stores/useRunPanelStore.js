import { create } from 'zustand';

export const useRunPanelStore = create((set) => ({
  isOpen: false,
  openPanel: () => set({ isOpen: true }),   // function here
  closePanel: () => set({ isOpen: false }),
  togglePanel: () => set(state => ({ isOpen: !state.isOpen })),
}));

import { create } from 'zustand';

export const useVariableStore = create((set, get) => ({
  variables: {},
  colors: {},

  setVariable: (key, value) =>
    set((state) => ({
      variables: {
        ...state.variables,
        [key]: value,
      },
    })),

  removeVariable: (key) =>
    set((state) => {
      const newVars = { ...state.variables };
      delete newVars[key];

      const newColors = { ...state.colors };
      delete newColors[key];

      return {
        variables: newVars,
        colors: newColors,
      };
    }),

  setColor: (key, color) =>
    set((state) => ({
      colors: {
        ...state.colors,
        [key]: color,
      },
    })),

  getColor: (key) => {
    const colors = get().colors || {};
    return colors[key] || '';
  },
}));

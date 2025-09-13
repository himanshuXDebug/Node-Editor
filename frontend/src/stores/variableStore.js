import { create } from "zustand";

let counter = 0;

export const useVariableStore = create((set, get) => ({
  variables: {},

  registerVariable: () => {
    const variableName = `input_${counter++}`;
    set(state => ({
      variables: {
        ...state.variables,
        [variableName]: "",
      },
    }));
    return variableName;
  },

  setVariable: (name, value) => {
    set(state => {
      const newVariables = {
        ...state.variables,
        [name]: value,
      };
      return { variables: newVariables };
    });
  },

  removeVariable: (name) => {
    set(state => {
      const updated = { ...state.variables };
      delete updated[name];
      return { variables: updated };
    });
  },

  getVariable: (name) => get().variables[name],

   getAllVariables: () => {
    return get().variables;
  },

  interpolateVariables: (text) => {
    if (!text || typeof text !== 'string') return text;
    
    const variables = get().variables;
    const result = text.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
      const value = variables[variableName];
      return value !== undefined ? String(value) : match;
    });
    
    return result;
  },

  debugVariables: () => {
    const vars = get().variables;
    return vars;
  },

  clearAllVariables: () => {
    set({ variables: {} });
  },
}));

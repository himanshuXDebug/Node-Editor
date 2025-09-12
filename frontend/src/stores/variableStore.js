import { create } from "zustand";

let counter = 0;

export const useVariableStore = create((set, get) => ({
  variables: {}, // { variableName: value }

  // Register a new variable with a unique name
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

  // Set or update variable value
  setVariable: (name, value) => {
    console.log(`🔴 Setting variable: ${name} = ${value}`);
    set(state => {
      const newVariables = {
        ...state.variables,
        [name]: value,
      };
      console.log(`🔴 Updated variables:`, newVariables);
      return { variables: newVariables };
    });
  },

  // Remove variable by name
  removeVariable: (name) => {
    set(state => {
      const updated = { ...state.variables };
      delete updated[name];
      return { variables: updated };
    });
  },

  // Get variable value by name
  getVariable: (name) => get().variables[name],

   getAllVariables: () => {
    return get().variables;
  },

  // Interpolate variables in text
  interpolateVariables: (text) => {
    if (!text || typeof text !== 'string') return text;
    
    const variables = get().variables;
    console.log('🔄 INTERPOLATING:', text);
    console.log('🔄 AVAILABLE VARIABLES:', variables);
    
    const result = text.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
      const value = variables[variableName];
      console.log(`🔄 Variable ${variableName}:`, value !== undefined ? value : 'NOT FOUND');
      return value !== undefined ? String(value) : match;
    });
    
    console.log('🔄 RESULT:', result);
    return result;
  },

  // Debug helper
  debugVariables: () => {
    const vars = get().variables;
    console.log('🔍 ALL VARIABLES:', vars);
    return vars;
  },

  // Clear all variables
  clearAllVariables: () => {
    set({ variables: {} });
  },
}));

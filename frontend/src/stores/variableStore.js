import { create } from "zustand";

let counter = 0;

export const useVariableStore = create((set, get) => ({
  variables: {}, // { variableName: value }

  // Create a variable for new InputNode
  registerVariable: (nodeId) => {
    const variableName = `input_${counter++}`;
    set((state) => ({
      variables: {
        ...state.variables,
        [variableName]: "",
      },
    }));
    return variableName;
  },

  // Update variable value
  setVariable: (name, value) => {
    set((state) => ({
      variables: {
        ...state.variables,
        [name]: value,
      },
    }));
  },

  // Delete variable when node is removed
  removeVariable: (name) => {
    set((state) => {
      const updated = { ...state.variables };
      delete updated[name];
      return { variables: updated };
    });
  },

  // Get variable value
  getVariable: (name) => get().variables[name],
}));

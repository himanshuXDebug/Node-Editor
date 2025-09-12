import { create } from "zustand";
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from "reactflow";
import AsyncQueue from './utils/AsyncQueue';

const requestQueue = new AsyncQueue(1);

// **ADDED: Variable counter and management**
let variableCounter = 0;

export const useStore = create((set, get) => ({
  nodes: [],
  edges: [],
  nodeIDs: {},
  
  // **ADDED: Variable store integration**
  variables: {}, // { variableName: value }

  // **ADDED: Variable management methods**
  registerVariable: (nodeId, prefix = 'var') => {
    const variableName = `${prefix}_${variableCounter++}`;
    set((state) => ({
      variables: {
        ...state.variables,
        [variableName]: "",
      },
    }));
    console.log(`[Store] Registered variable: ${variableName} for node: ${nodeId}`);
    return variableName;
  },

  setVariable: (name, value) => {
    set((state) => ({
      variables: {
        ...state.variables,
        [name]: value,
      },
    }));
    console.log(`[Store] Set variable ${name}:`, value);
  },

  removeVariable: (name) => {
    set((state) => {
      const updated = { ...state.variables };
      delete updated[name];
      return { variables: updated };
    });
    console.log(`[Store] Removed variable: ${name}`);
  },

  getVariable: (name) => {
    const value = get().variables[name];
    return value;
  },

  getAllVariables: () => get().variables,

  clearAllVariables: () => {
    set({ variables: {} });
    console.log('[Store] Cleared all variables');
  },

  // **ADDED: Template interpolation**
  interpolateVariables: (text) => {
    const variables = get().variables;
    let result = text;
    
    Object.entries(variables).forEach(([name, value]) => {
      const placeholder = `{{${name}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value || ''));
    });
    
    return result;
  },
  
  getNodeID: (type) => {
    const newIDs = { ...get().nodeIDs };
    if (newIDs[type] === undefined) {
      newIDs[type] = 0;
    }
    newIDs[type] += 1;
    set({ nodeIDs: newIDs });
    return `${type}-${newIDs[type]}`;
  },

  addNode: (node) => {
    set({ nodes: [...get().nodes, node] });
  },

  deleteNode: (id) => {
    // **ENHANCED: Also remove variables associated with deleted node**
    const nodeData = get().nodes.find(n => n.id === id)?.data;
    if (nodeData?.variableName) {
      get().removeVariable(nodeData.variableName);
    }
    
    set({
      nodes: get().nodes.filter((node) => node.id !== id),
      edges: get().edges.filter(
        (edge) => edge.source !== id && edge.target !== id
      ),
    });
  },

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(
        {
          ...connection,
          type: "smoothstep",
          animated: true,
          markerEnd: {
            type: MarkerType.Arrow,
            height: "20px",
            width: "20px",
          },
        },
        get().edges
      ),
    });
  },

  updateNodeField: (nodeId, fieldName, fieldValue) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          node.data = { ...node.data, [fieldName]: fieldValue };
        }
        return node;
      }),
    });
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  updateNodeData: (nodeId, newData) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      ),
    });
  },

  getNodeById: (nodeId) => {
    return get().nodes.find((node) => node.id === nodeId);
  },

  getNodesByType: (type) => {
    return get().nodes.filter((node) => node.type === type);
  },

  clearWorkflow: () => {
    set({ nodes: [], edges: [], nodeIDs: {}, variables: {} }); // **ENHANCED: Also clear variables**
  },

  validateWorkflow: () => {
    const { nodes, edges } = get();
    
    if (nodes.length === 0) {
      return { valid: false, message: "Drop some nodes to create a pipeline." };
    }

    const hasInput = nodes.some(n => n.type === 'customInput');
    if (!hasInput) {
      return { valid: false, message: "Add an Input node to receive user messages." };
    }

    const hasLLM = nodes.some(n => n.type === 'gemini');
    if (!hasLLM) {
      return { valid: false, message: "Add a Gemini node to process messages." };
    }

    const hasOutput = nodes.some(n => n.type === 'customOutput');
    if (!hasOutput) {
      return { valid: false, message: "Add an Output node to send responses." };
    }

    return { valid: true, message: "Pipeline is ready!" };
  },

  // **ENHANCED: Execution with variable interpolation**
  executeWorkflow: async (userInput) => {
    return requestQueue.add(async () => {
      const { nodes, edges } = get();
      
      try {
        console.log('=== EXECUTING WORKFLOW ===');
        console.log('User Input:', userInput);
        console.log('Available Variables:', get().variables);
        
        // Clear output values before new execution
        set(state => ({
          nodes: state.nodes.map(n => ({ 
            ...n, 
            data: { 
              ...n.data, 
              output: undefined,
              status: 'idle' 
            }
          }))
        }));

        // Find input nodes
        const inputNodes = nodes.filter(n => n.type === 'customInput');
        if (inputNodes.length === 0) {
          throw new Error('No Input node found');
        }

        // Update input nodes
        inputNodes.forEach(inputNode => {
          set(state => ({
            nodes: state.nodes.map(n => 
              n.id === inputNode.id 
                ? { ...n, data: { ...n.data, value: userInput, status: 'processing' }}
                : n
            )
          }));
        });

        let finalOutput = userInput;
        
        for (const inputNode of inputNodes) {
          const result = await traverseAndExecute(inputNode.id, userInput, nodes, edges, get, set);
          if (result) {
            finalOutput = result;
          }
        }

        // Reset statuses
        setTimeout(() => {
          set(state => ({
            nodes: state.nodes.map(n => ({ 
              ...n, 
              data: { ...n.data, status: 'idle' }
            }))
          }));
        }, 2000);

        console.log('Final Output:', finalOutput);
        return finalOutput;

      } catch (error) {
        console.error('Workflow execution failed:', error);
        
        // Set error status on all nodes
        set(state => ({
          nodes: state.nodes.map(n => ({ 
            ...n, 
            data: { ...n.data, status: 'error' }
          }))
        }));
        
        throw error;
      }
    });
  },
}));

// **ENHANCED: Execution with variable support**
async function traverseAndExecute(nodeId, inputData, nodes, edges, get, set, visited = new Set()) {
  if (visited.has(nodeId)) {
    return inputData;
  }
  visited.add(nodeId);

  const currentNode = nodes.find(n => n.id === nodeId);
  if (!currentNode) {
    return inputData;
  }

  console.log(`Processing node: ${currentNode.id} (${currentNode.type})`);

  let processedData = inputData;
  
  try {
    set(state => ({
      nodes: state.nodes.map(n => 
        n.id === nodeId 
          ? { ...n, data: { ...n.data, status: 'processing' }}
          : n
      )
    }));

    switch (currentNode.type) {
      case 'customInput':
        processedData = currentNode.data?.value || inputData;
        break;
        
      case 'gemini':
        processedData = await executeGeminiNodeWithVariables(currentNode, inputData, get);
        break;
        
      case 'condition':
        processedData = executeConditionNode(currentNode, inputData, get);
        break;
        
      case 'customOutput':
        processedData = inputData;
        break;
        
      default:
        console.warn(`Unknown node type: ${currentNode.type}`);
        processedData = inputData;
    }

    // **ENHANCED: Store node output as variable if variableName exists**
    if (currentNode.data?.variableName && processedData) {
      get().setVariable(currentNode.data.variableName, processedData);
    }

    set(state => ({
      nodes: state.nodes.map(n => 
        n.id === nodeId 
          ? { 
              ...n, 
              data: { 
                ...n.data, 
                status: 'success', 
                output: processedData,
                value: processedData,
                lastUpdated: new Date().toISOString()
              }
            }
          : n
      )
    }));

  } catch (error) {
    console.error(`Error executing node ${nodeId}:`, error);
    set(state => ({
      nodes: state.nodes.map(n => 
        n.id === nodeId 
          ? { ...n, data: { ...n.data, status: 'error' }}
          : n
      )
    }));
    throw error;
  }

  // Continue to next nodes
  const connectedEdges = edges.filter(edge => edge.source === nodeId);
  let finalResult = processedData;

  for (const edge of connectedEdges) {
    const result = await traverseAndExecute(edge.target, processedData, nodes, edges, get, set, visited);
    if (result !== processedData) {
      finalResult = result;
    }
  }

  return finalResult;
}

// **ENHANCED: Gemini execution with variable interpolation**
async function executeGeminiNodeWithVariables(node, inputData, get) {
  const personalApiKey = node.data?.personalAPI?.trim();
  let prompt = node.data?.prompt || inputData;
  
  // **INTERPOLATE VARIABLES IN PROMPT**
  prompt = get().interpolateVariables(prompt);
  
  // Apply conditions if enabled
  if (node.data?.useConditions && node.data?.conditionGuidelines) {
    prompt = `${prompt}

Please follow these guidelines strictly:
${node.data.conditionGuidelines}

Ensure your response adheres to all guidelines while being helpful.`;
  }
  
  const apiPayload = {
    personalApiKey: personalApiKey || null,
    prompt: prompt,
    requestId: `${Date.now()}-${Math.random()}`,
    model: "gemini-2.5-flash"
  };

  console.log('Calling Gemini API with interpolated prompt:', prompt);

  const response = await fetch('http://localhost:8000/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(apiPayload)
  });

  if (!response.ok) {
    throw new Error(`Gemini API call failed: ${response.statusText}`);
  }

  const result = await response.json();
  let output = result?.output || "No response received";
  
  // Clean up markdown formatting
  output = output
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  console.log('API Response:', output.substring(0, 100) + '...');
  return output;
}

// **ADDED: Condition node execution**
function executeConditionNode(node, inputData, get) {
  const { instructions, variableName, isActive } = node.data;
  
  if (isActive && instructions && variableName) {
    // Store the instructions as a variable for next nodes to use
    get().setVariable(variableName, instructions);
    console.log(`Condition node ${node.id} stored variable ${variableName}:`, instructions);
  }

  return inputData; // Pass through the original input unchanged
}

// Path checking helper
function checkPath(sourceId, targetId, edges, visited = new Set()) {
  if (sourceId === targetId) return true;
  if (visited.has(sourceId)) return false;

  visited.add(sourceId);

  const outgoingEdges = edges.filter(e => e.source === sourceId);
  for (const edge of outgoingEdges) {
    if (checkPath(edge.target, targetId, edges, visited)) {
      return true;
    }
  }

  return false;
}

export const store = useStore;

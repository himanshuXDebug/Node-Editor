// store.js - Simplified version without problematic retry logic

import { create } from "zustand";
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from "reactflow";
import AsyncQueue from './utils/AsyncQueue';

const requestQueue = new AsyncQueue(1);

export const useStore = create((set, get) => ({
  nodes: [],
  edges: [],
  nodeIDs: {},
  
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
    set({ nodes: [], edges: [], nodeIDs: {} });
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

  // Simplified execution without problematic retry logic
  executeWorkflow: async (userInput) => {
    return requestQueue.add(async () => {
      const { nodes, edges } = get();
      
      try {
        console.log('=== EXECUTING WORKFLOW ===');
        console.log('User Input:', userInput);
        
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
        throw error;
      }
    });
  },
}));

// Simplified execution without retry loop
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
        // Simple, single API call with unique prompt
        processedData = await executeGeminiNodeSimple(currentNode, inputData);
        break;
        
      case 'customOutput':
        processedData = inputData;
        break;
        
      default:
        console.warn(`Unknown node type: ${currentNode.type}`);
        processedData = inputData;
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

// Simple Gemini execution without retry loops
async function executeGeminiNodeSimple(node, inputData) {
  const personalApiKey = node.data?.personalAPI?.trim();
  
  const apiPayload = {
    personalApiKey: personalApiKey || null,
    prompt: inputData,
    // Add uniqueness to prevent caching
    requestId: `${Date.now()}-${Math.random()}`,
    inputprompt: `Please respond appropriately to this specific message: "${inputData}"`
  };

  console.log('Calling Gemini API:', inputData);

  const response = await fetch('http://localhost:8000/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(apiPayload)
  });

  if (!response.ok) {
    throw new Error(`Gemini API call failed: ${response.statusText}`);
  }

  const result = await response.json();
  console.log('API Response:', result.output.substring(0, 100) + '...');
  return result.output;
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

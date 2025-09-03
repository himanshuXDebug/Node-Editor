import { useStore } from './store'; // Your existing node store

export async function executeWorkflow(userInput) {
  const { nodes, edges } = useStore.getState();
  
  try {
    // Find input node
    const inputNode = nodes.find(n => n.type === 'customInput');
    if (!inputNode) throw new Error('No input node found');

    // Start execution from input node
    const result = await executeNodeChain(inputNode, userInput, nodes, edges);
    return result;
  } catch (error) {
    console.error('Workflow execution failed:', error);
    throw error;
  }
}

async function executeNodeChain(startNode, input, nodes, edges) {
  // Find connected nodes from current node
  const connectedEdges = edges.filter(edge => edge.source === startNode.id);
  
  if (connectedEdges.length === 0) {
    // End of chain - return current input
    return input;
  }

  // Process each connected node
  let currentOutput = input;
  
  for (const edge of connectedEdges) {
    const targetNode = nodes.find(n => n.id === edge.target);
    if (!targetNode) continue;

    // Execute node based on type
    switch (targetNode.type) {
      case 'llm':
        currentOutput = await executeLLMNode(targetNode, currentOutput);
        break;
      case 'text':
        currentOutput = executeTextNode(targetNode, currentOutput);
        break;
      case 'customOutput':
        return currentOutput; // Final output
      default:
        console.warn(`Unknown node type: ${targetNode.type}`);
    }

    // Continue chain from this node
    const nextResult = await executeNodeChain(targetNode, currentOutput, nodes, edges);
    if (nextResult !== currentOutput) {
      currentOutput = nextResult;
    }
  }

  return currentOutput;
}

async function executeLLMNode(node, input) {
  // Simulate LLM API call - replace with actual API
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
  
  return `AI Response to: "${input}"`;
}

function executeTextNode(node, input) {
  // Process text based on node configuration
  const { operation } = node.data;
  
  switch (operation) {
    case 'uppercase':
      return input.toUpperCase();
    case 'lowercase':
      return input.toLowerCase();
    default:
      return input;
  }
}

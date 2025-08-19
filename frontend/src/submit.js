// submit.js
import axios from 'axios';
import { useStore } from './store';

export const handleSubmit = async (setPopup) => {
  const { nodes, edges } = useStore.getState();

  try {
    const response = await axios.post('http://127.0.0.1:8000/pipelines/parse', {
      nodes,
      edges,
    });

    const { num_nodes, num_edges, is_dag } = response.data;
    setPopup({
      visible: true,
      content: `Pipeline submitted successfully.\n\n• Nodes: ${num_nodes}\n• Edges: ${num_edges}\n• Is DAG: ${is_dag ? 'Yes' : 'No'}`,
    });
  } catch (err) {
    console.error('Submission Error:', err);
    setPopup({
      visible: true,
      content: `Submission failed. Check backend logs.`,
    });
  }
};

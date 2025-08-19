import { useState, useRef, useCallback } from 'react';
import ReactFlow, { Controls, Background, MiniMap, MarkerType, useReactFlow } from 'reactflow';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { InputNode } from './nodes/inputNode';
import { LLMNode } from './nodes/llmNode';
import { OutputNode } from './nodes/outputNode';
import { TextNode } from './nodes/textNode';
import { UppercaseNode } from './nodes/upperNode';
import { ImageNode } from './nodes/imageNode';
import { DownloadNode } from './nodes/downloadNode';
import { ColorNode } from './nodes/colorPaletteNode';
import { LowercaseNode } from './nodes/lowercaseNode';
import { CustomEdge } from './components/CustomEdge';
import 'reactflow/dist/style.css';

const nodeTypes = {
  customInput: InputNode,
  llm: LLMNode,
  customOutput: OutputNode,
  text: TextNode,
  uppercase: UppercaseNode,
  Image: ImageNode,
  Download: DownloadNode,
  palette: ColorNode,
  lowercase: LowercaseNode
};

const edgeTypes = {
  default: CustomEdge,
};

const defaultEdgeOptions = {
  type: 'default',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: '#64748b',
  },
};

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  addNode: state.addNode,
  deleteNode: state.deleteNode,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
});

export const PipelineUI = () => {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const { nodes, edges, addNode, deleteNode, onNodesChange, onEdgesChange, onConnect } = useStore(selector, shallow);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      
      let appData;
      try {
        appData = JSON.parse(event.dataTransfer.getData('application/reactflow'));
      } catch {
        return;
      }
      
      const type = appData?.nodeType;
      if (!type) return;

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { deleteNode },
      };

      addNode(newNode);
    },
    [reactFlowInstance, addNode, deleteNode]
  );


  return (
    <div
      ref={reactFlowWrapper}
      className="w-full h-full bg-gray-100 border rounded-lg shadow-lg p-4"
      tabIndex={0}
      
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
      >
        <Background variant="dots" gap={20} size={1} color="#e5e7eb" />
        <Controls position="top-left" />
        <MiniMap position="bottom-right" />
      </ReactFlow>
    </div>
  );
};

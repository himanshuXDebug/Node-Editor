import React, { useEffect, useState, useRef } from 'react';
import { useReactFlow } from 'reactflow';
import { NodeBase } from '../components/NodeBase';
import { useVariableStore } from '../stores/variableStore';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export const UppercaseNode = ({ id, data, setNodes }) => {
  const { getEdges, getNodes } = useReactFlow();
  const { variables, setVariable } = useVariableStore();

  const [connectedVars, setConnectedVars] = useState([]);
  const [status, setStatus] = useState('Waiting...');
  const lastValues = useRef({});

  useEffect(() => {
    const edges = getEdges();
    const nodes = getNodes();

    const incomingEdges = edges.filter((e) => e.target === id);
    if (incomingEdges.length === 0) {
      setConnectedVars([]);
      setStatus('No connections');
      return;
    }

    const updatedVars = [];

    for (const edge of incomingEdges) {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const varName = sourceNode?.data?.variableName;
      const value = variables?.[varName];

      if (varName && typeof value === 'string') {
        const upper = value.toUpperCase();
        if (lastValues.current[varName] !== upper) {
          setVariable(varName, upper);
          lastValues.current[varName] = upper;
        }
        updatedVars.push(varName);
      }
    }

    setConnectedVars(updatedVars);
    setStatus(updatedVars.length > 0 ? `Uppercased: ${updatedVars.join(', ')}` : 'Waiting for variable...');
  }, [variables, getEdges, getNodes, id, setVariable]);

  const leftPanel = (
    <div className="text-xs text-gray-700 space-y-2 min-w-32 max-w-72">
      <div>
        <strong>Connected Variables:</strong>
        {connectedVars.length > 0 ? (
          connectedVars.map((v, i) => <div key={i}>• {v}</div>)
        ) : (
          <div>None</div>
        )}
      </div>

      <div className="pt-2 border-t">
        <strong>How to Use:</strong>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>Connect any variable-producing node to this node.</li>
          <li>It automatically uppercases the variable’s value.</li>
          <li>Use it with a connected TextNode to see the effect.</li>
          <li>
            Once connected and the transformation is applied, you can safely <b>remove</b> this node without affecting the result.
          </li>
        </ul>
      </div>
    </div>
  );

  const rightPanel = (
  <div className="text-xs text-gray-700 space-y-2">
    <div className="font-semibold text-gray-800">Status</div>
    <div
      className={`flex items-start gap-2 p-3 border rounded shadow-sm ${
        status.includes('Uppercased')
          ? 'bg-green-50 border-green-200 text-green-700'
          : status === 'No connections'
          ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
          : 'bg-gray-100 border-gray-300 text-gray-700'
      }`}
    >
      {status.includes('Uppercased') ? (
        <CheckCircle size={16} className="mt-0.5 text-green-500" />
      ) : status === 'No connections' ? (
        <AlertTriangle size={16} className="mt-0.5 text-yellow-500" />
      ) : (
        <AlertTriangle size={16} className="mt-0.5 text-gray-500" />
      )}
      <div className="leading-snug">{status}</div>
    </div>
  </div>
);

  return (
    <NodeBase
      id={id}
      title="Uppercase Node"
      layout="split"
      inputHandles={[{ id: 'input', color: 'bg-yellow-400' }]}
      outputHandles={[]}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      setNodes={setNodes}
    />
  );
};

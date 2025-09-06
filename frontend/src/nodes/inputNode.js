import React, { useState, useEffect } from 'react';
import { LogIn, Settings } from 'lucide-react';
import { NodeBase } from '../components/NodeBase';
import { useStore } from '../store';

export const InputNode = ({ id, data, selected }) => {
  const [variableName, setVariableName] = useState(data?.variableName || `input_${id.split('-')[1]}`);
  const [textValue, setTextValue] = useState(data?.value || '');
  
  const updateNodeData = useStore(state => state.updateNodeData);

  // Update store when local state changes
  useEffect(() => {
    updateNodeData(id, {
      variableName,
      value: textValue,
      lastUpdated: new Date().toISOString()
    });
  }, [id, variableName, textValue, updateNodeData]);

  // Right panel content
  const expandPanelContent = (
    <div className="space-y-4">
      {/* Node Info */}
      <div className="space-y-2 text-xs text-gray-600">
        <div>
          <strong>Node ID:</strong> 
          <code className="bg-gray-100 px-1 rounded ml-1">{id}</code>
        </div>
        <div>
          <strong>Type:</strong> 
          <code className="bg-gray-100 px-1 rounded ml-1">Input</code>
        </div>
        <div>
          <strong>Last Updated:</strong> 
          <div className="text-gray-500 text-xs">
            {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'Never'}
          </div>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Variable Settings */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Advanced Settings
        </label>
        <div className="space-y-2">
          <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
            <strong>Usage:</strong> This input node will receive data from the RunPanel chat interface or use the default value specified in the main panel.
          </div>
          <div className="text-xs text-gray-500 p-2 bg-blue-50 rounded border border-blue-200">
            <strong>Runtime Behavior:</strong> When connected to other nodes, this variable will pass its current value downstream through the workflow.
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <NodeBase
      id={id}
      data={data}
      title={data?.title || 'Input Node'}
      icon={LogIn}
      inputHandles={[]} // No input handles for input nodes
      outputHandles={[{ id: 'output', color: '#3b82f6' }]}
      color="blue"
      status={textValue ? { type: 'success', text: 'Ready' } : { type: 'idle', text: 'Waiting for input' }}
      expandPanelContent={expandPanelContent}
      className={selected ? 'ring-2 ring-blue-400' : ''}
    >
      {/* Main content */}
      <div className="space-y-3">
        {/* Variable Name */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Variable Name
          </label>
          <input
            type="text"
            value={variableName}
            onChange={(e) => setVariableName(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 nodrag"
            placeholder="variable_name"
          />
        </div>

        {/* Default Value */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Default Value
          </label>
          <textarea
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 nodrag resize-none"
            placeholder="Enter default value or leave empty for runtime input..."
            rows={3}
          />
        </div>

        {/* Live Preview */}
        <div className="bg-gray-50 p-2 rounded border">
          <div className="text-xs font-medium text-gray-600 mb-1">Live Preview:</div>
          <div className="text-xs text-gray-700 space-y-1">
            <div><strong>Variable:</strong> <code className="bg-white px-1 rounded">{variableName}</code></div>
            <div><strong>Value:</strong> 
              <span className="ml-1">
                {textValue || <em className="text-gray-400">Waiting for runtime input</em>}
              </span>
            </div>
          </div>
        </div>
      </div>
    </NodeBase>
  );
};

export default InputNode;

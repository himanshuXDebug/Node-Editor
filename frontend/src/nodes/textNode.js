import React, { useState, useEffect } from 'react';
import { Wand2 } from 'lucide-react';
import { NodeBase } from '../components/NodeBase';
import { useStore } from '../store';

export const TextNode = ({ id, data, selected }) => {
  const [template, setTemplate] = useState(data?.template || 'Please rewrite this response following these guidelines: {{guidelines}}.\n\nOriginal response: {{input}}');
  const [variableName, setVariableName] = useState(data?.variableName || `refined_${id.split('-')[1]}`);

  const updateNodeData = useStore(state => state.updateNodeData);

  useEffect(() => {
    updateNodeData(id, {
      template,
      variableName,
      lastUpdated: new Date().toISOString()
    });
  }, [id, template, variableName, updateNodeData]);

  const expandPanelContent = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Refinement Template
        </label>
        <textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          rows={6}
          className="w-full px-2 py-2 border border-gray-300 rounded text-sm nodrag resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          Use {`{guidelines}`} and {`{input}`} variables
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output Variable
        </label>
        <input
          type="text"
          value={variableName}
          onChange={(e) => setVariableName(e.target.value)}
          placeholder="refined_response"
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm nodrag"
        />
      </div>

      <div className="p-3 bg-blue-50 rounded border border-blue-200 text-xs">
        <div className="font-medium text-blue-800 mb-1">Template Examples:</div>
        <div className="text-blue-700 space-y-1">
          <div><strong>Refine:</strong> "Rewrite this following: {`{guidelines}`}"</div>
          <div><strong>Filter:</strong> "Remove content that violates: {`{guidelines}`}"</div>
          <div><strong>Enhance:</strong> "Improve this response by: {`{guidelines}`}"</div>
        </div>
      </div>
    </div>
  );

  return (
    <NodeBase
      id={id}
      data={data}
      title={data?.title || 'Response Refiner'}
      icon={Wand2}
      inputHandles={[{ id: 'input', color: '#3b82f6' }]}
      outputHandles={[{ id: 'output', color: '#3b82f6' }]}
      color="blue"
      expandPanelContent={expandPanelContent}
      className={selected ? 'ring-2 ring-blue-400' : ''}
    >
      <div className="space-y-2">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Refinement Template
          </label>
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            rows={2}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 nodrag resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Variable
          </label>
          <input
            type="text"
            value={variableName}
            onChange={(e) => setVariableName(e.target.value)}
            placeholder="refined_response"
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 nodrag"
          />
        </div>
      </div>
    </NodeBase>
  );
};

export default TextNode;

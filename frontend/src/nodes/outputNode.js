import React, { useState } from 'react';
import { NodeBase } from '../components/NodeBase';
import { Download, ChevronRight, ChevronLeft } from 'lucide-react';

export const OutputNode = ({ id, data }) => {
  const [type, setType] = useState('Text');
  const [output, setOutput] = useState('');
  const [format, setFormat] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <NodeBase
      id={id}
      title="Output"
      icon={Download}
      inputHandles={['input']}
      outputHandles={[]}
      color="blue"
    >
      <div className="relative flex">
        {/* Main content */}
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-2">
            Output data of different types from your workflow.
          </div>

          {/* Node ID */}
          <div className="bg-gray-100 text-xs px-2 py-1 rounded font-mono mb-2">
            {id}
          </div>

          {/* Type */}
          <div className="mb-2">
            <label className="text-xs font-medium text-gray-600">Type</label>
            <select
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option>Text</option>
              <option>JSON</option>
              <option>Number</option>
            </select>
          </div>

          {/* Output */}
          <div className="mb-2">
            <label className="text-xs font-medium text-gray-600">Output*</label>
            <input
              className="w-full border border-red-300 rounded px-2 py-1 text-sm"
              placeholder='Type "{{" to utilize variables'
              value={output}
              onChange={(e) => setOutput(e.target.value)}
            />
          </div>

          {/* Format toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Format output</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={format}
                onChange={() => setFormat(!format)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
            </label>
          </div>
        </div>

        <button
          onClick={() => setPanelOpen(!panelOpen)}
          className="absolute top-2 -right-3 bg-white border rounded-full shadow p-0.5 hover:bg-gray-100"
        >
          {panelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {panelOpen && (
          <div className="absolute top-0 left-full ml-2 w-40 bg-white border rounded-lg shadow-lg p-2 text-xs">
            <p className="font-medium text-gray-700 mb-1">Right Panel</p>
            <p className="text-gray-500">Extra options, logs, or settings can go here.</p>
          </div>
        )}
      </div>
    </NodeBase>
  );
};

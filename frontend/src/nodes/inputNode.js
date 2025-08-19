import React, { useState, useEffect } from 'react';
import { NodeBase } from '../components/NodeBase';
import { useReactFlow } from 'reactflow';
import { LogIn } from 'lucide-react';

export const InputNode = ({ id, data }) => {
  const defaultName = data?.inputName || id.replace('customInput-', 'input_');
  const [currName, setCurrName] = useState(defaultName);
  const [inputType, setInputType] = useState(data?.inputType || 'Text');
  const [value, setValue] = useState(data?.value || '');
  const [status, setStatus] = useState({ type: 'success', message: 'Ready' });
  const [collapsed, setCollapsed] = useState(false);

  const { setNodes } = useReactFlow();

  useEffect(() => {
    const valid = !!currName.trim() && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(currName);
    setStatus(valid
      ? { type: 'success', message: 'Ready' }
      : { type: 'error', message: 'Invalid variable name' });

    setNodes((prev) =>
      prev.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                inputName: currName,
                variableName: currName,
                inputType,
                value,
                outputValue: value,
              },
            }
          : node
      )
    );
  }, [currName, inputType, value]);

  const mainContent = (
    <div className="space-y-5">
      {/* Variable Name */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Variable Name</label>
        <input
          value={currName}
          onChange={(e) => setCurrName(e.target.value)}
          placeholder="e.g., userInput"
          className={`w-full px-3 py-2 rounded-lg text-sm shadow-sm border outline-none transition
            ${status.type === 'error'
              ? 'border-red-300 bg-red-50 text-red-700'
              : 'border-slate-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-300'}
          `}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Input Type</label>
        <select
          value={inputType}
          onChange={(e) => setInputType(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm shadow-sm border border-slate-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="Text">Text</option>
          <option value="Number">Number</option>
          <option value="File">File</option>
          <option value="Boolean">Boolean</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Default Value</label>
        <input
          type={inputType === "Number" ? "number" : "text"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={inputType === 'File'}
          placeholder="Enter default value"
          className="w-full px-3 py-2 rounded-lg text-sm border border-slate-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>
    </div>
  );

 const rightPanelContent = (
  <div>
    <div className="font-semibold mb-2 text-sm text-gray-700">Preview</div>
    <pre className="bg-slate-50 border border-slate-900 rounded-lg p-3 text-xs font-mono text-gray-800">
      {value || "No value"}
    </pre>

    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <h4 className="font-semibold mb-2 text-sm text-gray-700 flex items-center gap-1">
        📝 Variable Info
      </h4>
      <div className="space-y-1 text-xs text-gray-600">
        <p><strong>Name:</strong> <code className="bg-white px-1 rounded">{currName || "Unnamed Variable"}</code></p>
        <p><strong>Type:</strong> <span className="text-blue-600 font-medium">{inputType}</span></p>
        <p><strong>Status:</strong> 
          <span className={`ml-1 font-medium ${
            status.type === 'success' ? 'text-green-600' : 'text-red-600'
          }`}>
            {status.message}
          </span>
        </p>
      </div>
    </div>

  </div>
);


  return (
    <NodeBase
      id={id}
      title={collapsed ? currName || "Input" : "Input"}
      icon={LogIn}
      color="blue"
      inputHandles={[]}
      outputHandles={[
        { id: `${id}-value`, label: currName || 'output', color: '#3b82f6' },
      ]}
      status={collapsed ? null : status}
      className="min-w-[300px] max-w-[360px]"
      collapsed={collapsed}
      onCollapseToggle={setCollapsed}
      expandPanelContent={rightPanelContent}
      expandButtonVisible={!collapsed}
    >
      {!collapsed && mainContent}
    </NodeBase>
  );
};

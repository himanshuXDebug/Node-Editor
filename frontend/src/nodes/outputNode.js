import React, { useState, useEffect } from 'react';
import { LogOut, Copy, Download, Eye, EyeOff } from 'lucide-react';
import { NodeBase } from '../components/NodeBase';
import { useStore } from '../store';

export const OutputNode = ({ id, data, selected }) => {
  const [outputValue, setOutputValue] = useState('Waiting for input...');
  const [variableName, setVariableName] = useState(data?.variableName || `output_${id.split('-')[1]}`);
  const [displayMode, setDisplayMode] = useState('full');
  
  const updateNodeData = useStore(state => state.updateNodeData);

  // Force update when data changes (fixes "one step behind" issue)
  useEffect(() => {
    const newValue = data?.value || data?.output || 'Waiting for input...';
    if (newValue !== outputValue) {
      setOutputValue(newValue);
    }
  }, [data?.value, data?.output]);

  // Update store
  useEffect(() => {
    updateNodeData(id, {
      value: outputValue,
      variableName,
      displayMode,
      lastUpdated: new Date().toISOString()
    });
  }, [id, outputValue, variableName, displayMode, updateNodeData]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(outputValue);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const downloadAsFile = () => {
    const blob = new Blob([outputValue], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${variableName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Right panel content
  const expandPanelContent = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Display Mode
        </label>
        <select
          value={displayMode}
          onChange={(e) => setDisplayMode(e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded nodrag"
        >
          <option value="full">Full Output</option>
          <option value="preview">Preview (100 chars)</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>

      <hr className="border-gray-200" />

      <div className="text-xs text-gray-600 space-y-2">
        <div><strong>Node ID:</strong> <code className="bg-gray-100 px-1 rounded ml-1">{id}</code></div>
        <div><strong>Length:</strong> {outputValue.length} characters</div>
        <div><strong>Lines:</strong> {outputValue.split('\n').length}</div>
      </div>

      <hr className="border-gray-200" />

      <div className="space-y-2">
        <button
          onClick={copyToClipboard}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors nodrag"
        >
          <Copy className="w-4 h-4" />
          Copy to Clipboard
        </button>
        
        <button
          onClick={downloadAsFile}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-green-50 hover:bg-green-100 border border-green-200 rounded transition-colors nodrag"
        >
          <Download className="w-4 h-4" />
          Download as File
        </button>
      </div>
    </div>
  );

  const getDisplayValue = () => {
    if (displayMode === 'hidden') return '[Output Hidden]';
    if (displayMode === 'preview' && outputValue.length > 100) {
      return outputValue.substring(0, 100) + '...';
    }
    return outputValue;
  };

  return (
    <NodeBase
      id={id}
      data={data}
      title={data?.title || 'Output'}
      icon={LogOut}
      inputHandles={[{ id: 'input', color: '#0ea5e9' }]}
      outputHandles={[]}
      color="blue"
      status={
        outputValue === 'Waiting for input...' 
          ? { type: 'idle', text: 'Waiting' }
          : { type: 'success', text: `${outputValue.length} chars` }
      }
      expandPanelContent={expandPanelContent}
      className={selected ? 'ring-2 ring-blue-400' : ''}
    >
      {/* Main Content */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Final Output
          </label>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 min-h-[80px] max-h-[150px] overflow-y-auto">
            <pre className="text-sm font-mono whitespace-pre-wrap text-gray-800">
              {getDisplayValue()}
            </pre>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Variable Name
          </label>
          <input
            type="text"
            value={variableName}
            onChange={(e) => setVariableName(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 nodrag"
            placeholder="output_variable"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={copyToClipboard}
            className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors nodrag"
          >
            Copy
          </button>
          <button
            onClick={downloadAsFile}
            disabled={outputValue === 'Waiting for input...'}
            className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded transition-colors nodrag"
          >
            Download
          </button>
        </div>
      </div>
    </NodeBase>
  );
};

export default OutputNode;

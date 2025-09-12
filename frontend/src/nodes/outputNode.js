import React, { useState, useEffect, useCallback } from 'react';
import { Download, Copy, Check } from 'lucide-react';
import { NodeBase } from '../components/NodeBase';
import { useStore } from '../store';
import { useVariableStore } from '../stores/variableStore';

export const OutputNode = ({ id, data, selected }) => {
  const [variableName, setVariableName] = useState(data?.variableName || `output_${id.split('-')[1]}`);
  const [outputName, setOutputName] = useState(data?.outputName || 'Response');
  const [copied, setCopied] = useState(false);

  const { updateNodeData, nodes, edges } = useStore();
  const { getVariable, variables } = useVariableStore();

  useEffect(() => {
    updateNodeData(id, {
      variableName,
      outputName
    });
  }, [id, variableName, outputName, updateNodeData]);

  // ✅ FIX: Get data from connected nodes - including TextNode
  const getConnectedOutputText = useCallback(() => {
    const incomingEdges = edges.filter(edge => edge.target === id);
    
    if (incomingEdges.length === 0) {
      return '';
    }
    
    const sourceNodes = incomingEdges.map(edge => 
      nodes.find(node => node.id === edge.source)
    ).filter(Boolean);
    
    // ✅ FIX: Check TextNode first, then other nodes
    for (const sourceNode of sourceNodes) {
      // Check TextNode/text node
      if (['text', 'textNode', 'TextNode'].includes(sourceNode.type) && sourceNode.data?.currentText) {
        return sourceNode.data.currentText;
      }
      
      // Check TextProcessor node
      if (['textProcessor', 'textProcessorNode'].includes(sourceNode.type) && sourceNode.data?.processedText) {
        return sourceNode.data.processedText;
      }
      
      // Check Gemini node
      if (['geminiLLMNode', 'gemini'].includes(sourceNode.type) && sourceNode.data?.response) {
        return sourceNode.data.response;
      }
    }
    
    return '';
  }, [id, edges, nodes]);

  const outputContent = getConnectedOutputText();
  const hasConnection = edges.some(edge => edge.target === id);
  const hasContent = outputContent && outputContent.length > 0;

  const truncateText = (text, maxLength = 150) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const downloadAsText = () => {
    if (!hasContent) return;
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `${outputName}_${timestamp}.txt`;
    
    const content = `${outputName}
Generated: ${new Date().toLocaleString()}

${outputContent}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAsJSON = () => {
    if (!hasContent) return;
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `${outputName}_${timestamp}.json`;
    
    const jsonData = {
      name: outputName,
      generated: new Date().toISOString(),
      content: outputContent,
      metadata: {
        nodeId: id,
        contentLength: outputContent.length
      }
    };
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    if (!hasContent) return;
    
    navigator.clipboard.writeText(outputContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Copy failed:', err);
    });
  };

  return (
    <NodeBase
      id={id}
      data={data}
      title="Output & Download"
      icon={Download}
      inputHandles={[{ id: 'input', color: hasContent ? '#10b981' : '#94a3b8' }]}
      outputHandles={[]}
      color={hasContent ? 'green' : 'gray'}
      status={{ 
        type: hasContent ? 'success' : hasConnection ? 'waiting' : 'idle',
        text: hasContent ? 'Content ready' : hasConnection ? 'Connected' : 'Not connected'
      }}
      className={`${selected ? 'ring-2 ring-green-400' : ''} transition-all duration-200`}
      style={{ width: '300px' }}
    >
      <div className="space-y-3">=
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">File Name</label>
          <input
            type="text"
            value={outputName}
            onChange={(e) => setOutputName(e.target.value)}
            className="w-full p-2 text-sm border rounded-md nodrag"
            placeholder="Output filename"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Source Variable</label>
          <input
            type="text"
            value={variableName}
            onChange={(e) => setVariableName(e.target.value)}
            className="w-full p-2 text-sm border rounded-md nodrag"
            placeholder="Variable name"
          />
        </div>

        {!hasConnection && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-center">
            <div className="text-xs text-gray-500">Connect to node to enable download</div>
          </div>
        )}

        {hasConnection && hasContent && (
          <div className="bg-green-50 max-w-2xl border border-green-200 rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-green-700">Content Ready</span>
              <span className="text-xs text-green-600">
                {Math.round(outputContent.length / 100) / 10}k chars
              </span>
            </div>
            <div className="text-xs text-green-600 bg-white rounded p-2 max-h-16 overflow-y-auto border">
              {truncateText(outputContent, 200)}
            </div>
          </div>
        )}

        {hasConnection && !hasContent && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-center">
            <div className="text-xs text-amber-700">Connected but no content available</div>
            <div className="text-xs text-amber-600 mt-1">Make sure connected node has data</div>
          </div>
        )}

        {hasContent && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={downloadAsText}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-xs font-medium nodrag"
              >
                <Download className="w-3 h-3" />
                TXT
              </button>
              <button
                onClick={downloadAsJSON}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors text-xs font-medium nodrag"
              >
                <Download className="w-3 h-3" />
                JSON
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
          <span className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${
              hasContent ? 'bg-green-400' : hasConnection ? 'bg-amber-400' : 'bg-gray-400'
            }`} />
            {hasContent ? 'Ready to download' : hasConnection ? 'Waiting for data' : 'No connection'}
          </span>
          <span className="font-mono text-xs">{variableName}</span>
        </div>
      </div>
    </NodeBase>
  );
};

export default OutputNode;

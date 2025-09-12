import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FileText, Edit3, Save, X, RefreshCw } from 'lucide-react';
import { NodeBase } from '../components/NodeBase';
import { useStore } from '../store';
import { useVariableStore } from '../stores/variableStore';

export const TextNode = ({ id, data, selected }) => {
  const [variableName, setVariableName] = useState(data?.variableName || `text_${id.split('-')[1]}`);
  const [isActive, setIsActive] = useState(data?.isActive !== false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentText, setCurrentText] = useState(data?.currentText || '');
  const [editingText, setEditingText] = useState('');
  const [lastLLMResponse, setLastLLMResponse] = useState('');

  const { updateNodeData, nodes, edges } = useStore();
  const { setVariable } = useVariableStore();
  const hasUserEdited = useRef(false);

  useEffect(() => {
    updateNodeData(id, {
      variableName,
      isActive,
      currentText,
      hasUserEdited: hasUserEdited.current
    });
  }, [id, variableName, isActive, currentText, updateNodeData]);

  const getConnectedInputText = useCallback(() => {
    const incomingEdges = edges.filter(edge => edge.target === id);
    if (incomingEdges.length === 0) return '';
    
    const sourceNodes = incomingEdges.map(edge => 
      nodes.find(node => node.id === edge.source)
    ).filter(Boolean);
    
    for (const sourceNode of sourceNodes) {
      if ((sourceNode.type === 'geminiLLMNode' || sourceNode.type === 'gemini') && sourceNode.data?.response) {
        return sourceNode.data.response;
      }
    }
    return '';
  }, [id, edges, nodes]);

  useEffect(() => {
    if (isActive) {
      const inputText = getConnectedInputText();
      
      if (inputText && inputText !== lastLLMResponse) {
        setLastLLMResponse(inputText);
        setCurrentText(inputText);
        hasUserEdited.current = false;
        
        if (variableName) {
          setVariable(variableName, inputText);
        }
      }
    }
  }, [isActive, getConnectedInputText, lastLLMResponse, variableName, setVariable]);

  const startEditing = useCallback(() => {
    setEditingText(currentText);
    setIsEditing(true);
  }, [currentText]);

  const handleSave = useCallback(() => {
    setCurrentText(editingText);
    hasUserEdited.current = true;
    
    if (variableName) {
      setVariable(variableName, editingText);
    }
    
    updateNodeData(id, { 
      variableName,
      isActive,
      currentText: editingText,
      hasUserEdited: true,
      lastEdited: new Date().toISOString()
    });
    
    setIsEditing(false);
  }, [editingText, variableName, setVariable, id, isActive, updateNodeData]);

  const cancelEditing = useCallback(() => {
    setEditingText('');
    setIsEditing(false);
  }, []);

  const resetToLLMResponse = useCallback(() => {
    const inputText = getConnectedInputText();
    if (inputText) {
      setCurrentText(inputText);
      setLastLLMResponse(inputText);
      hasUserEdited.current = false;
      
      if (variableName) {
        setVariable(variableName, inputText);
      }
    }
  }, [getConnectedInputText, variableName, setVariable]);

  const hasConnection = edges.some(edge => edge.target === id);
  const hasText = currentText && currentText.length > 0;
  const isUserEdited = hasUserEdited.current;

  return (
    <NodeBase
      id={id}
      data={data}
      title="Text Editor"
      icon={FileText}
      inputHandles={[{ id: 'input', color: '#8b5cf6' }]}
      outputHandles={[{ id: 'output', color: '#8b5cf6' }]}
      color="purple"
      status={{ 
        type: hasText ? 'success' : hasConnection ? 'waiting' : 'idle',
        text: hasText ? (isUserEdited ? 'Edited' : 'Ready') : 'Waiting'
      }}
      className={`${selected ? 'ring-2 ring-purple-400' : ''}`}
      style={{ width: '280px' }} // ✅ FIXED WIDTH
    >
      <div className="space-y-2"> {/* ✅ REDUCED SPACING */}
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700">Text Editor</span>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`px-2 py-1 text-xs rounded ${
              isActive ? 'bg-purple-500 text-white' : 'bg-gray-300 text-gray-600'
            }`}
          >
            {isActive ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Variable Input */}
        <input
          type="text"
          value={variableName}
          onChange={(e) => setVariableName(e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded nodrag"
          placeholder="text_output"
        />

        {/* Connection Status */}
        {!hasConnection && (
          <div className="bg-gray-50 border rounded p-2 text-center">
            <div className="text-xs text-gray-500">Connect to LLM node</div>
          </div>
        )}

        {/* Text Content */}
        {hasText && (
          <div className="bg-purple-50 border border-purple-200 rounded p-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-purple-700">Content</span>
                {isUserEdited && (
                  <span className="px-1 bg-purple-200 text-purple-800 rounded text-xs">Edited</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {!isEditing ? (
                  <>
                    <button
                      onClick={resetToLLMResponse}
                      className="p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      title="Reset to LLM response"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                    <button
                      onClick={startEditing}
                      className="p-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={cancelEditing}
                      className="p-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <button
                      onClick={handleSave}
                      className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      <Save className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {isEditing ? (
              <textarea
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                className="w-full p-2 text-xs border rounded resize-none nodrag"
                rows={4}
                placeholder="Edit text here..."
              />
            ) : (
              <div 
                className="bg-white max-w-96 rounded p-2 border text-xs text-gray-800 overflow-y-auto"
                style={{ maxHeight: '100px' }}
              >
                <pre className="whitespace-pre-wrap font-sans leading-tight">
                  {currentText}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t">
          <span className="flex items-center gap-1">
            <div className={`w-1 h-1 rounded-full ${
              hasText ? (isUserEdited ? 'bg-orange-400' : 'bg-green-400') : 'bg-gray-400'
            }`} />
            {hasText ? `${currentText.length} chars` : 'No content'}
          </span>
          <span className="font-mono text-xs truncate max-w-16">{variableName}</span>
        </div>
      </div>
    </NodeBase>
  );
};

export default TextNode;

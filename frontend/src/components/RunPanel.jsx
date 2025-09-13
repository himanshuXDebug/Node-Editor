import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRunPanelStore } from '../stores/useRunPanelStore';
import { useStore } from '../store';
import { useVariableStore } from '../stores/variableStore';
import {
  Send, MessageSquare, XCircle, Loader2, Copy, Check, RotateCcw, X
} from 'lucide-react';

export const RunPanel = () => {
  const { isOpen, closePanel } = useRunPanelStore();
  const { nodes, edges, updateNodeData } = useStore();
  const { setVariable, getVariable, getAllVariables, variables, clearAllVariables } = useVariableStore();

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentValidation, setCurrentValidation] = useState({ valid: false, message: '' });
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  const messagesEndRef = useRef(null);

  const validateWorkflow = useCallback(() => {
    if (nodes.length === 0) {
      return { valid: false, message: 'No nodes in workflow' };
    }

    const inputNodes = nodes.filter(n => ['inputNode', 'customInput', 'input'].includes(n.type));
    const geminiNodes = nodes.filter(n => ['geminiLLMNode', 'gemini'].includes(n.type));
    const outputNodes = nodes.filter(n => ['outputNode', 'customOutput', 'output'].includes(n.type));

    if (inputNodes.length === 0) return { valid: false, message: 'Add Input node' };
    if (geminiNodes.length === 0) return { valid: false, message: 'Add Gemini node' };
    if (outputNodes.length === 0) return { valid: false, message: 'Add Output node' };
    if (edges.length === 0) return { valid: false, message: 'Connect nodes' };

    const connectedNodes = new Set();
    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    const disconnectedInputs = inputNodes.filter(node => !connectedNodes.has(node.id));
    const disconnectedOutputs = outputNodes.filter(node => !connectedNodes.has(node.id));

    if (disconnectedInputs.length > 0) return { valid: false, message: 'Connect Input node' };
    if (disconnectedOutputs.length > 0) return { valid: false, message: 'Connect Output node' };

    return { valid: true, message: 'Ready' };
  }, [nodes, edges]);

  const getValidConnections = useCallback(() => {
    const validEdges = edges.filter(edge => {
      const sourceExists = nodes.some(n => n.id === edge.source);
      const targetExists = nodes.some(n => n.id === edge.target);
      return sourceExists && targetExists;
    });
    return validEdges.length;
  }, [edges, nodes]);

  const executeWorkflow = useCallback(async (userInput) => {
    const validation = validateWorkflow();
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    const executionOrder = [
      ...nodes.filter(n => ['inputNode', 'customInput', 'input'].includes(n.type)),
      ...nodes.filter(n => ['conditionNode', 'condition'].includes(n.type) && n.data?.isActive !== false),
      ...nodes.filter(n => ['geminiLLMNode', 'gemini'].includes(n.type)),
      ...nodes.filter(n => ['text', 'textNode', 'TextNode'].includes(n.type) && n.data?.isActive !== false),
      ...nodes.filter(n => ['outputNode', 'customOutput', 'output'].includes(n.type))
    ];

    const nodeOutputs = {};
    let finalResponse = '';

    for (const node of executionOrder) {
      const currentNode = nodes.find(n => n.id === node.id);
      if (!currentNode) {
        throw new Error(`Node ${node.id} was removed`);
      }

      const upstreamInputs = edges
        .filter(e => e.target === node.id)
        .map(e => nodeOutputs[e.source])
        .filter(Boolean);

      let result = '';

      switch (node.type) {
        case 'inputNode':
        case 'customInput':
        case 'input':
          result = userInput || node.data?.value || '';
          if (node.data?.variableName) setVariable(node.data.variableName, result);
          break;

        case 'conditionNode':
        case 'condition':
          if (node.data?.isActive && node.data?.instructions) {
            const variableName = node.data.variableName || 'con';
            setVariable(variableName, node.data.instructions);
            result = node.data.instructions;
          }
          break;

        case 'geminiLLMNode':
        case 'gemini':
          const allVars = getAllVariables();
          const userVar = Object.entries(allVars).find(([k, v]) => k.includes('input') && v?.trim())?.[3];
          const conditionVar = getVariable('con');

          let prompt = userVar || upstreamInputs.join(' ') || node.data?.prompt || '';
          if (conditionVar) prompt += `\n\nInstruction: ${conditionVar}`;

          if (!prompt.trim()) throw new Error('No prompt available');

          // Add this API_BASE_URL configuration
          const API_BASE_URL = process.env.NODE_ENV === 'production'
            ? `https://${process.env.REACT_APP_API_URL}`
            : 'http://localhost:8000';

          const response = await fetch(`${API_BASE_URL}/api/gemini`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              personalApiKey: node.data?.personalAPI || null,
              prompt,
              model: "gemini-2.5-flash"
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API error: ${response.status}`);
          }

          const apiResult = await response.json();
          result = apiResult.output || 'No response';
          if (node.data?.variableName) setVariable(node.data.variableName, result);
          updateNodeData(node.id, { response: result });
          break;

        case 'text':
        case 'textNode':
          if (node.data?.isActive && upstreamInputs.length > 0) {
            const inputText = upstreamInputs.join('\n\n');
            result = inputText.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').trim();
            if (node.data?.variableName) setVariable(node.data.variableName, result);
            updateNodeData(node.id, { processedText: result });
          } else {
            result = upstreamInputs[0] || '';
          }
          break;

        case 'outputNode':
        case 'customOutput':
        case 'output':
          result = upstreamInputs[upstreamInputs.length - 1] || '';
          if (!result.trim()) {
            const outputVars = Object.entries(variables).filter(([key, value]) =>
              (key.includes('processed') || key.includes('gemini')) && value?.trim()
            );
            if (outputVars.length > 0) {
              result = outputVars[outputVars.length - 1][1];
            }
          }
          if (node.data?.variableName) setVariable(node.data.variableName, result);
          updateNodeData(node.id, { outputContent: result });
          break;

        default:
          break;
      }

      nodeOutputs[node.id] = result;
      if (result) finalResponse = result;
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return finalResponse || 'No output generated';
  }, [nodes, edges, variables, setVariable, getVariable, getAllVariables, updateNodeData, validateWorkflow]);

  const onSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isProcessing || !currentValidation.valid) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputValue,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    const currentInput = inputValue;
    setInputValue('');
    setIsProcessing(true);

    try {
      const response = await executeWorkflow(currentInput);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: response,
        timestamp: new Date()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'error',
        text: error.message,
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessing(false);
    }
  }, [inputValue, isProcessing, currentValidation.valid, executeWorkflow]);

  const copyText = useCallback(async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  }, []);

  const resetChat = useCallback(() => {
    setMessages([]);
    clearAllVariables();
  }, [clearAllVariables]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  }, [onSendMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      const validation = validateWorkflow();
      setCurrentValidation(validation);
    }
  }, [isOpen, validateWorkflow]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-3">
      <div className="bg-white rounded-lg shadow-lg border w-full max-w-4xl h-[80vh] flex flex-col">

        <div className="flex items-center justify-between p-3 border-b bg-slate-100">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-700" />
            <h1 className="text-base font-medium text-slate-900">AI Workflow</h1>
            <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded">
              {nodes.length} nodes • {getValidConnections()} connections
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={resetChat}
              className="p-1 text-slate-600 hover:bg-slate-200 rounded text-xs"
              title="Reset"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            <button
              onClick={closePanel}
              className="p-1 text-slate-600 hover:bg-slate-200 rounded"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">

          {!currentValidation.valid && (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center max-w-sm">
                <XCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-slate-900 mb-2">Setup Required</h3>
                <p className="text-xs text-slate-600 mb-4">{currentValidation.message}</p>

                <div className="bg-slate-50 p-3 rounded text-left">
                  <p className="text-xs font-medium mb-2 text-slate-700">Required:</p>
                  <div className="space-y-1">
                    {[
                      { name: 'Input node', present: nodes.some(n => ['inputNode', 'customInput', 'input'].includes(n.type)) },
                      { name: 'Gemini node', present: nodes.some(n => ['geminiLLMNode', 'gemini'].includes(n.type)) },
                      { name: 'Output node', present: nodes.some(n => ['outputNode', 'customOutput', 'output'].includes(n.type)) },
                      { name: 'Connections', present: edges.length > 0 }
                    ].map(({ name, present }) => (
                      <div key={name} className="flex items-center gap-2 text-xs">
                        <div className={`w-1 h-1 rounded-full ${present ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className={present ? 'text-green-700' : 'text-red-700'}>{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentValidation.valid && (
            <>
              <div className="flex-1 p-3 overflow-y-auto bg-slate-50">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 bg-green-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-900 mb-1">Ready to Chat</h3>
                    <p className="text-xs text-slate-600">Your workflow is configured.</p>
                  </div>
                )}

                <div className="space-y-3">
                  {messages.map(({ id, sender, text, timestamp }) => (
                    <div key={id} className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`group max-w-xs px-3 py-2 rounded-lg text-sm ${sender === 'user'
                          ? 'bg-slate-700 text-white'
                          : sender === 'error'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-white text-slate-900 border border-slate-200'
                        }`}>
                        <div className="whitespace-pre-wrap">{text}</div>
                        <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                          <span>{timestamp.toLocaleTimeString()}</span>
                          {sender !== 'user' && (
                            <button
                              onClick={() => copyText(text, id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {copiedMessageId === id ?
                                <Check className="w-3 h-3 text-green-600" /> :
                                <Copy className="w-3 h-3" />
                              }
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {isProcessing && (
                  <div className="flex justify-start mt-3">
                    <div className="bg-white border px-3 py-2 rounded-lg flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin text-slate-600" />
                      <span className="text-xs text-slate-600">Processing...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="border-t p-3 bg-white">
                <div className="flex gap-2">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type message..."
                    disabled={isProcessing}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-500 resize-none disabled:opacity-50"
                    rows={1}
                    style={{ minHeight: '36px', maxHeight: '72px' }}
                  />
                  <button
                    onClick={onSendMessage}
                    disabled={!inputValue.trim() || isProcessing || !currentValidation.valid}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                  >
                    <Send className="w-3 h-3" />
                    Send
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RunPanel;

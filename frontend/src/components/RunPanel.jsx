import React, { useEffect, useState, useRef } from 'react';
import { useRunPanelStore } from '../stores/useRunPanelStore';
import { useStore } from '../store';
import { Send, MessageSquare, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';

export const RunPanel = () => {
  const { isOpen, closePanel } = useRunPanelStore();
  const nodes = useStore(state => state.nodes);
  const edges = useStore(state => state.edges);
  const validateWorkflow = useStore(state => state.validateWorkflow);
  const executeWorkflow = useStore(state => state.executeWorkflow);

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentValidation, setCurrentValidation] = useState({ valid: false, message: '' });
  const messagesEndRef = useRef(null);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Validate workflow when panel opens or nodes/edges change
  useEffect(() => {
    if (!isOpen) return;
    const validation = validateWorkflow();
    setCurrentValidation(validation);
  }, [isOpen, nodes, edges, validateWorkflow]);

  // Send message and execute workflow
  const onSendMessage = async () => {
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
      console.log('Sending message:', currentInput);
      const response = await executeWorkflow(currentInput);
      
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'bot', 
        text: response,
        timestamp: new Date()
      }]);
      
    } catch (error) {
      console.error('RunPanel error:', error);
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'system', 
        text: `Error: ${error.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Enter key in input
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center p-6">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center border-b p-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Run Panel</h2>
            <div className="flex items-center gap-2 ml-4">
              <div className={`w-2 h-2 rounded-full ${
                currentValidation.valid ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-600">
                {nodes.length} nodes, {edges.length} connections
              </span>
            </div>
          </div>
          <button 
            onClick={closePanel} 
            className="text-gray-700 hover:text-gray-900 font-bold text-2xl leading-none"
          >
            ×
          </button>
        </header>

        {/* Content */}
        <section className="flex-1 flex flex-col overflow-hidden">
          {/* No nodes or invalid pipeline */}
          {!currentValidation.valid && (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Pipeline Not Ready</h3>
              <p className="text-gray-500 max-w-md">{currentValidation.message}</p>
              
              {/* Quick setup guide */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 max-w-md">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">Quick Setup:</h4>
                <ol className="text-sm text-blue-700 space-y-1 text-left">
                  <li>1. Add an Input node</li>
                  <li>2. Add a Gemini node</li>
                  <li>3. Add an Output node</li>
                  <li>4. Connect them with edges</li>
                </ol>
              </div>
            </div>
          )}

          {/* Valid pipeline - show chat interface */}
          {currentValidation.valid && (
            <div className="flex flex-1 overflow-hidden">
              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 px-6 py-4 overflow-y-auto space-y-3 bg-gray-50">
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-1">Pipeline Ready!</h3>
                      <p className="text-gray-500 mb-4">Your workflow is connected and ready to process messages.</p>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full text-sm text-green-700">
                        <Zap className="w-3 h-3" />
                        Start chatting below
                      </div>
                    </div>
                  )}

                  {messages.map(({ id, sender, text, timestamp }) => (
                    <div
                      key={id}
                      className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-3 rounded-lg ${
                          sender === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : sender === 'system'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-white border shadow-sm'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{text}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-white border px-4 py-3 rounded-lg flex items-center gap-2 shadow-sm">
                        <Clock className="w-4 h-4 animate-spin text-blue-600" />
                        <span className="text-gray-600">Processing through pipeline...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t p-4 bg-white">
                  <div className="flex gap-3 items-end">
                    <textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your message... (Press Enter to send)"
                      disabled={isProcessing}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none nodrag"
                      rows={inputValue.split('\n').length || 1}
                      style={{ minHeight: '40px', maxHeight: '120px' }}
                    />
                    <button
                      onClick={onSendMessage}
                      disabled={!inputValue.trim() || isProcessing}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </button>
                  </div>
                </div>
              </div>

              {/* Execution Status Sidebar */}
              <div className="w-72 border-l bg-gray-50 p-4">
                <h3 className="font-semibold mb-4 text-gray-800">Execution Status</h3>
                <ExecutionStatusPanel nodes={nodes} />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

// Component to show node execution status
const ExecutionStatusPanel = ({ nodes }) => {
  const relevantNodes = nodes.filter(n => 
    ['customInput', 'gemini', 'customOutput'].includes(n.type)
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing': return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'success': return 'text-green-700 bg-green-50 border-green-200';
      case 'error': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-3">
      {relevantNodes.map(node => (
        <div 
          key={node.id} 
          className={`p-3 rounded border ${getStatusColor(node.data?.status)}`}
        >
          <div className="flex items-center gap-3 mb-2">
            {getStatusIcon(node.data?.status)}
            <div className="flex-1">
              <div className="font-medium text-sm">
                {node.data?.title || node.type}
              </div>
              <div className="text-xs opacity-70">
                {node.id}
              </div>
            </div>
          </div>
          
          {node.data?.value && (
            <div className="text-xs mt-2 p-2 bg-white bg-opacity-50 rounded">
              <strong>Value:</strong> {node.data.value.substring(0, 50)}
              {node.data.value.length > 50 && '...'}
            </div>
          )}
          
          {node.data?.output && node.data.output !== node.data?.value && (
            <div className="text-xs mt-2 p-2 bg-white bg-opacity-50 rounded">
              <strong>Output:</strong> {node.data.output.substring(0, 50)}
              {node.data.output.length > 50 && '...'}
            </div>
          )}
          
          {node.data?.lastUpdated && (
            <div className="text-xs mt-1 opacity-70">
              Updated: {new Date(node.data.lastUpdated).toLocaleTimeString()}
            </div>
          )}
        </div>
      ))}
      
      {relevantNodes.length === 0 && (
        <div className="text-center text-gray-500 text-sm py-8">
          No workflow nodes detected
        </div>
      )}
    </div>
  );
};

export default RunPanel;

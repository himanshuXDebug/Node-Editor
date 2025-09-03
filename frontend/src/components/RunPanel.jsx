import React, { useEffect, useState, useRef } from 'react';
import { useRunPanelStore } from '../stores/useRunPanelStore';
import { useStore } from '../store'; // Your global React Flow store managing nodes/edges
import { X } from 'lucide-react';

export const RunPanel = () => {
  const { isOpen, closePanel } = useRunPanelStore();
  const nodes = useStore(state => state.nodes);
  const edges = useStore(state => state.edges);

  const [validationResult, setValidationResult] = useState({ valid: false, error: null });
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Validate graph on open or changes
  useEffect(() => {
    if (!isOpen) return;

    const result = validateGraph(nodes, edges);
    setValidationResult(result);

    // Reset chat messages if new open
    setMessages([]);
    setInputValue('');
  }, [isOpen, nodes, edges]);

  if (!isOpen) return null;

  // Simple handler to simulate chat send
  const onSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMsg = { id: Date.now(), sender: 'user', text: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsProcessing(true);

    try {
      // Replace with your real runtime evaluation
      await new Promise((r) => setTimeout(r, 1000)); // Simulate delay
      const botReply = `Simulated reply to: "${userMsg.text}"`;
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: botReply }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: 'Error processing your message.' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center p-6">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[85vh] flex flex-col">
        <header className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold">Run Panel</h2>
          <button onClick={closePanel} className="text-gray-700 hover:text-gray-900 font-bold text-2xl leading-none">×</button>
        </header>

        <section className="flex-1 flex flex-col overflow-hidden">
          {/* No nodes */}
          {nodes.length === 0 && (
            <div className="flex-grow flex items-center justify-center text-gray-500 text-lg select-none">
              Drop some nodes to create a pipeline.
            </div>
          )}

          {/* Validation error */}
          {nodes.length > 0 && !validationResult.valid && (
            <div className="flex-grow flex flex-col items-center justify-center text-red-600 p-10 text-center">
              <p className="text-2xl font-semibold mb-4">Pipeline Incomplete</p>
              <p className="max-w-lg">{validationResult.error}</p>
            </div>
          )}

          {/* Validated - show chat UI */}
          {nodes.length > 0 && validationResult.valid && (
            <div className="flex flex-col h-full">
              <div className="flex-grow px-6 py-4 overflow-y-auto space-y-3 bg-gray-50 rounded-b-lg">
                {messages.length === 0 && (
                  <p className="text-center text-gray-400 select-none">Start chatting by typing below...</p>
                )}

                {messages.map(({ id, sender, text }) => (
                  <div
                    key={id}
                    className={`max-w-[70%] px-4 py-2 rounded-lg whitespace-pre-wrap ${
                      sender === 'user' ? 'bg-blue-600 text-white self-end' : 'bg-white border self-start'
                    }`}
                  >
                    {text}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t p-4 bg-white flex gap-3 items-center">
                <input
                  type="text"
                  className="flex-grow border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && onSendMessage()}
                  disabled={isProcessing}
                />
                <button
                  onClick={onSendMessage}
                  disabled={!inputValue.trim() || isProcessing}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

// Simple graph validation logic example - adapt based on your node types and requirements
function validateGraph(nodes, edges) {
  if (nodes.length === 0) {
    return { valid: false, error: null };
  }

  const hasInput = nodes.some(n => n.type.toLowerCase() === 'custominput');
  const hasLLM = nodes.some(n => n.type.toLowerCase() === 'llm');
  const hasOutput = nodes.some(n => n.type.toLowerCase() === 'customoutput');

  if (!hasInput) return { valid: false, error: "Add an Input node to receive user messages." };
  if (!hasLLM) return { valid: false, error: "Add an LLM node to process messages." };
  if (!hasOutput) return { valid: false, error: "Add an Output node to send responses." };

  // Basic connectivity check (implement your own)
  const connected = checkNodeConnectivity(nodes, edges);
  if (!connected) return { valid: false, error: "Connect your nodes to create a complete workflow." };

  return { valid: true, error: null };
}

// Simplified connectivity checking for example
function checkNodeConnectivity(nodes, edges) {
  const inputNodes = nodes.filter(n => n.type.toLowerCase() === 'custominput');
  const outputNodes = nodes.filter(n => n.type.toLowerCase() === 'customoutput');

  for (const inputNode of inputNodes) {
    for (const outputNode of outputNodes) {
      if (hasPath(inputNode.id, outputNode.id, edges)) return true;
    }
  }

  return false;
}

function hasPath(sourceId, targetId, edges, visited = new Set()) {
  if (sourceId === targetId) return true;
  if (visited.has(sourceId)) return false;

  visited.add(sourceId);

  const outgoingEdges = edges.filter(e => e.source === sourceId);
  for (const edge of outgoingEdges) {
    if (hasPath(edge.target, targetId, edges, visited)) return true;
  }

  return false;
}

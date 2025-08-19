import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { NodeBase } from '../components/NodeBase';
import { useReactFlow } from 'reactflow';
import { useVariableStore } from '../stores/variableStore';

export const LLMNode = ({ id, data }) => {
  const [model, setModel] = useState(data?.model || 'Gemini');
  const [prompt, setPrompt] = useState(data?.prompt || '');
  const [response, setResponse] = useState(data?.response || 'Waiting...');
  const [variableName, setVariableName] = useState(data?.variableName || `llm_${id.split('-')[1]}`);
  const [loading, setLoading] = useState(false);

  const { setVariable } = useVariableStore();
  const { setNodes } = useReactFlow();

  // Update node metadata on mount or when variableName changes
  useEffect(() => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                model,
                prompt,
                response,
                variableName,
                type: 'llm',
                title: 'LLM Node',
              },
            }
          : node
      )
    );
  }, [id, model, prompt, response, variableName, setNodes]);

  // Interpolate input using current global variables
  const interpolatePrompt = (raw) => {
    return raw.replace(/{{(.*?)}}/g, (_, v) => {
      const val = useVariableStore.getState().variables?.[v.trim()];
      return val || `[${v.trim()}]`;
    });
  };

  // On click, run the LLM prompt
  const handleRun = async () => {
    if (!prompt.trim()) {
      setResponse('Prompt cannot be empty');
      return;
    }

    const finalPrompt = interpolatePrompt(`Only reply with your direct output. Task: ${prompt}`);
    setLoading(true);
    setResponse('Generating...');

    try {
      const res = await axios.post('http://localhost:8000/api/gemini', { prompt: finalPrompt });
      const output = res?.data?.output || 'No response';
      setResponse(output);

      // Store variable in global variable store
      setVariable(variableName, output);

      // Update internal response data
      setNodes((prev) =>
        prev.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  response: output,
                  variableName,
                },
              }
            : node
        )
      );
    } catch (err) {
      console.error('[LLMNode] Gemini Error:', err.message);
      setResponse('Error: Gemini failed to respond');
    } finally {
      setLoading(false);
    }
  };

  const leftPanel = (
    <div className="space-y-3 text-xs text-gray-700">
      <div>
        <label className="font-medium text-gray-600 block mb-1">Model</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full border rounded px-2 py-1 bg-white"
        >
          <option value="Gemini">Gemini</option>
          <option value="OpenAI" disabled>OpenAI (coming soon)</option>
        </select>
      </div>

      <div>
        <label className="font-medium text-gray-600 block mb-1">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Summarize a paragraph..."
          rows={4}
          className="w-full border px-3 py-2 rounded resize-none font-mono text-sm"
        />
      </div>

      <div>
        <label className="font-medium text-gray-600 block mb-1">Variable Name</label>
        <input
          type="text"
          value={variableName}
          onChange={(e) => setVariableName(e.target.value)}
          className="w-full border px-3 py-1 rounded text-sm"
          placeholder="e.g. llmResult"
        />
        <p className="mt-1 text-[11px] text-gray-500">
          Available as <code>{`{{${variableName}}}`}</code> in other nodes.
        </p>
      </div>

      <button
        onClick={handleRun}
        disabled={loading}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-1.5 rounded text-sm font-semibold disabled:opacity-60 transition-all"
      >
        {loading ? 'Generating...' : 'Run'}
      </button>
    </div>
  );

  const rightPanel = (
    <div className="text-xs text-gray-700 h-full flex flex-col">
      <label className="block font-medium text-gray-600 mb-1">LLM Output</label>
      <div className="border bg-gray-50 rounded p-2 font-mono text-sm text-gray-800 flex-1 overflow-y-auto whitespace-pre-wrap max-h-60">
        {response}
      </div>
    </div>
  );

  return (
    <NodeBase
      id={id}
      title="LLM Node"
      layout="split"
      inputHandles={[{ id: 'input', color: 'bg-purple-600' }]}
      outputHandles={[{ id: 'output', color: 'bg-purple-600' }]}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
    />
  );
};

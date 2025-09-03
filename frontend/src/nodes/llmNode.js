import React, { useState, useEffect } from "react";
import axios from "axios";
import { NodeBase } from "../components/NodeBase";
import { useReactFlow } from "reactflow";
import { useVariableStore } from "../stores/variableStore";

export const LLMNode = ({ id, data }) => {
  const [model, setModel] = useState(data?.model || "Gemini");
  const [apiKey, setApiKey] = useState(data?.apiKey || "");
  const [prompt, setPrompt] = useState(data?.prompt || "");
  const [response, setResponse] = useState(data?.response || "Waiting...");
  const [variableName, setVariableName] = useState(
    data?.variableName || `llm_${id.split("-")[1]}`
  );
  const [loading, setLoading] = useState(false);

  const { setVariable } = useVariableStore();
  const { setNodes } = useReactFlow();

  // Update node state in ReactFlow whenever something changes
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
                apiKey,
                variableName,
                type: "llm",
                title: "LLM Node",
              },
            }
          : node
      )
    );
  }, [id, model, prompt, response, apiKey, variableName, setNodes]);

  // Replace {{var}} with values from variable store
  const interpolatePrompt = (raw) => {
    return raw.replace(/{{(.*?)}}/g, (_, v) => {
      const val = useVariableStore.getState().variables?.[v.trim()];
      return val || `[${v.trim()}]`;
    });
  };

  // Run LLM
  const handleRun = async () => {
    if (!prompt.trim()) {
      setResponse("⚠️ Prompt cannot be empty");
      return;
    }
    if (!apiKey.trim()) {
      setResponse("⚠️ API Key required");
      return;
    }

    const finalPrompt = interpolatePrompt(prompt);
    setLoading(true);
    setResponse("⏳ Generating...");

    try {
      // hit your backend, pass apiKey + model + prompt
      const res = await axios.post("http://localhost:8000/api/llm", {
        apiKey,
        model,
        prompt: finalPrompt,
      });

      const output = res?.data?.output || "No response";
      setResponse(output);
      setVariable(variableName, output); // save result globally
    } catch (err) {
      console.error("[LLMNode] Error:", err.message);
      setResponse("❌ Error: LLM request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <NodeBase
      id={id}
      title="LLM Node"
      inputHandles={[{ id: "in", color: "#9333ea" }]}
      outputHandles={[{ id: "out", color: "#9333ea" }]}
    >
      {/* Inside node UI */}
      <div className="space-y-2 text-xs text-gray-700">
        {/* Model select */}
        <div>
          <label className="block font-medium text-gray-600 mb-1">Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full border rounded px-2 py-1 bg-white"
          >
            <option value="Gemini">Gemini</option>
            <option value="OpenAI">OpenAI</option>
          </select>
        </div>

        {/* API key input */}
        <div>
          <label className="block font-medium text-gray-600 mb-1">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full border px-2 py-1 rounded text-sm"
            placeholder="Enter your API key"
          />
        </div>

        {/* Prompt input */}
        <div>
          <label className="block font-medium text-gray-600 mb-1">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Ask the model something..."
            className="w-full border px-2 py-1 rounded resize-none font-mono text-sm"
          />
        </div>

        {/* Variable name */}
        <div>
          <label className="block font-medium text-gray-600 mb-1">
            Variable Name
          </label>
          <input
            type="text"
            value={variableName}
            onChange={(e) => setVariableName(e.target.value)}
            className="w-full border px-2 py-1 rounded text-sm"
            placeholder="e.g. llmResult"
          />
          <p className="mt-1 text-[11px] text-gray-500">
            Use <code>{`{{${variableName}}}`}</code> in other nodes.
          </p>
        </div>

        {/* Run button */}
        <button
          onClick={handleRun}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-1.5 rounded text-sm font-semibold disabled:opacity-60"
        >
          {loading ? "Generating..." : "Run"}
        </button>

        {/* Response preview */}
        <div>
          <label className="block font-medium text-gray-600 mb-1">
            Response
          </label>
          <div className="border bg-gray-50 rounded p-2 font-mono text-sm text-gray-800 whitespace-pre-wrap max-h-40 overflow-y-auto">
            {response}
          </div>
        </div>
      </div>
    </NodeBase>
  );
};

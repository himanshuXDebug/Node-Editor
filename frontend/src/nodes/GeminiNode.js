import React, { useState, useEffect } from "react";
import { Zap, Key, User, Server, Sparkles, Filter, Settings } from "lucide-react";
import { NodeBase } from "../components/NodeBase";
import { useStore } from "../store";

export const GeminiLLMNode = ({ id, data, selected }) => {
  const [prompt, setPrompt] = useState(data?.prompt || "");
  const [conditionGuidelines, setConditionGuidelines] = useState(data?.conditionGuidelines || "");
  const [response, setResponse] = useState(data?.response || "Waiting for input...");
  const [variableName, setVariableName] = useState(data?.variableName || `gemini_${id.split("-")[1]}`);
  const [loading, setLoading] = useState(false);
  const [localPersonalAPI, setLocalPersonalAPI] = useState(data?.personalAPI || "");
  const [useConditions, setUseConditions] = useState(data?.useConditions || false);

  const updateNodeData = useStore((state) => state.updateNodeData);
  const isPersonalAPIActive = localPersonalAPI.trim() !== "";

  // Update node data in store
  useEffect(() => {
    updateNodeData(id, {
      prompt,
      conditionGuidelines,
      response,
      variableName,
      personalAPI: localPersonalAPI,
      useConditions,
      isUsingPersonalAPI: isPersonalAPIActive,
      model: "Gemini",
      lastUpdated: new Date().toISOString(),
    });
  }, [id, prompt, conditionGuidelines, response, variableName, localPersonalAPI, useConditions, isPersonalAPIActive, updateNodeData]);

  const handleRun = async () => {
    if (!prompt.trim()) {
      setResponse("⚠️ Prompt cannot be empty");
      return;
    }

    setLoading(true);
    setResponse("⏳ Generating with Gemini...");

    try {
      // Combine prompt with conditions if enabled
      let finalPrompt = prompt;
      
      if (useConditions && conditionGuidelines.trim()) {
        finalPrompt = `${prompt}

Please follow these guidelines strictly:
${conditionGuidelines}

Ensure your response adheres to all the above guidelines while providing a helpful and informative answer.`;
      }

      const payload = {
        personalApiKey: isPersonalAPIActive ? localPersonalAPI : null,
        prompt: finalPrompt,
        model: "gemini-2.5-flash"
      };

      const res = await fetch("http://localhost:8000/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`API error: ${res.statusText}`);

      const result = await res.json();
      let output = result?.output || "No response received";
      
      // Clean up asterisks and markdown formatting
      output = output
        .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove **bold**
        .replace(/\*(.*?)\*/g, '$1')     // Remove *italic*
        .replace(/#{1,6}\s/g, '')       // Remove headers
        .replace(/\n\s*\n/g, '\n')      // Remove extra line breaks
        .trim();

      setResponse(output);
    } catch (err) {
      console.error("[GeminiNode] Error:", err.message);
      setResponse("❌ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // **WIDER RIGHT PANEL** content
  const expandPanelContent = (
    <div className="space-y-4">
      {/* API Configuration - Side by Side */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="font-semibold text-gray-800 text-sm">Gemini Config</span>
          </div>
          <div className="text-xs">
            {isPersonalAPIActive ? (
              <div className="flex items-center gap-1 text-green-600">
                <User className="w-3 h-3" />
                <span>Personal API</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-blue-600">
                <Server className="w-3 h-3" />
                <span>Backend API</span>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-orange-600" />
            <span className="font-semibold text-gray-800 text-sm">Conditions</span>
          </div>
          <button
            onClick={() => setUseConditions(!useConditions)}
            className={`px-3 py-1 text-xs font-medium rounded ${
              useConditions 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            } nodrag transition-colors`}
          >
            {useConditions ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Personal API Key */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Key className="w-4 h-4 inline mr-1" />
          Personal API Key (Optional)
        </label>
        <textarea
          value={localPersonalAPI}
          onChange={(e) => setLocalPersonalAPI(e.target.value)}
          className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 nodrag resize-none"
          placeholder="AIzaSyD... (Google AI API key)"
          rows={2}
        />
      </div>

      {/* Condition Guidelines */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content Guidelines
        </label>
        <textarea
          value={conditionGuidelines}
          onChange={(e) => setConditionGuidelines(e.target.value)}
          className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 nodrag resize-none"
          placeholder="e.g., don't include political party names or controversial topics"
          rows={3}
          disabled={!useConditions}
        />
        <p className="text-xs text-gray-500 mt-1">
          Guidelines will be automatically applied to your prompt
        </p>
      </div>

      {/* Node Info */}
      <div className="p-3 bg-purple-50 rounded border border-purple-200">
        <div className="text-sm font-medium text-purple-800 mb-1">Google Gemini 2.5 Flash</div>
        <div className="text-xs text-purple-600 space-y-1">
          <div><strong>Node ID:</strong> {id}</div>
          <div><strong>Variable:</strong> {variableName}</div>
          <div><strong>Conditions:</strong> {useConditions ? 'Enabled' : 'Disabled'}</div>
        </div>
      </div>
    </div>
  );

  return (
    <NodeBase
      id={id}
      data={data}
      title="Smart Gemini"
      icon={Sparkles}
      inputHandles={[
        { id: "prompt", color: "#7c3aed" },
        { id: "conditions", color: "#f59e0b" }
      ]}
      outputHandles={[{ id: "out", color: "#7c3aed" }]}
      color="purple"
      status={
        loading 
          ? { type: 'loading', text: 'Generating...' }
          : response.includes('Error') || response.includes('⚠️')
          ? { type: 'error', text: 'Error' }
          : response !== 'Waiting for input...'
          ? { type: 'success', text: 'Complete' }
          : { type: 'idle', text: 'Ready' }
      }
      expandPanelContent={expandPanelContent}
      className={selected ? "ring-2 ring-purple-400" : ""}
    >
      {/* **HORIZONTAL LAYOUT - WIDER NOT TALLER** */}
      <div className="space-y-3">
        {/* Header with Status */}
        <div className="flex items-center justify-between p-2 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-800">Gemini 2.5 Flash</span>
          </div>
          <div className="flex items-center gap-2">
            {useConditions && (
              <div className="flex items-center gap-1">
                <Filter className="w-3 h-3 text-orange-600" />
                <span className="text-xs text-orange-600 font-medium">Conditions ON</span>
              </div>
            )}
            <div className={`w-2 h-2 rounded-full ${
              isPersonalAPIActive ? 'bg-green-500' : 'bg-blue-500'
            }`}></div>
          </div>
        </div>

        {/* **TWO COLUMN LAYOUT** */}
        <div className="grid grid-cols-2 gap-3">
          {/* Left Column - Prompt */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Enter your prompt..."
              className="w-full px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 nodrag resize-none text-sm"
            />
          </div>

          {/* Right Column - Variable + Conditions Toggle */}
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Output Variable</label>
              <input
                type="text"
                value={variableName}
                onChange={(e) => setVariableName(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 nodrag text-sm"
                placeholder="gemini_response"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Use Conditions</label>
              <button
                onClick={() => setUseConditions(!useConditions)}
                className={`w-full px-3 py-1 text-sm font-medium rounded ${
                  useConditions 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-200 text-gray-700'
                } nodrag transition-colors`}
              >
                {useConditions ? 'Conditions ON' : 'Conditions OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* Conditions Input (when enabled) */}
        {useConditions && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Guidelines</label>
            <input
              type="text"
              value={conditionGuidelines}
              onChange={(e) => setConditionGuidelines(e.target.value)}
              placeholder="e.g., don't include political party names"
              className="w-full px-2 py-1 border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 nodrag text-sm"
            />
          </div>
        )}

        {/* Run Button */}
        <button
          onClick={handleRun}
          disabled={loading}
          className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Generating...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Run Gemini
            </>
          )}
        </button>

        {/* Response Display */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Response</label>
          <div className="p-2 border border-gray-300 rounded bg-gray-50 max-h-24 overflow-y-auto">
            <div className="text-sm font-mono whitespace-pre-wrap text-gray-800">
              {response}
            </div>
          </div>
        </div>
      </div>
    </NodeBase>
  );
};

export default GeminiLLMNode;

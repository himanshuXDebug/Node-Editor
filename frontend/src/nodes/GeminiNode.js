import React, { useState, useEffect } from "react";
import { Zap, Sparkles, Filter, Key } from "lucide-react";
import { NodeBase } from "../components/NodeBase";
import { useStore } from "../store";
import { useVariableStore } from "../stores/variableStore";

export const GeminiLLMNode = ({ id, data, selected }) => {
  const [prompt, setPrompt] = useState(data?.prompt || "");
  const [conditionGuidelines, setConditionGuidelines] = useState(
    data?.conditionGuidelines || ""
  );
  const [response, setResponse] = useState(
    data?.response || "Waiting for input..."
  );
  const [variableName, setVariableName] = useState(
    data?.variableName || `gemini_${id.split("-")[1]}`
  );
  const [loading, setLoading] = useState(false);
  const [localPersonalAPI, setLocalPersonalAPI] = useState(
    data?.personalAPI || ""
  );
  const [useConditions, setUseConditions] = useState(
    data?.useConditions || false
  );

  const { updateNodeData } = useStore();
  const { getAllVariables, interpolateVariables, setVariable } =
    useVariableStore();

  const isPersonalAPIActive = localPersonalAPI.trim() !== "";
  const availableVariables = getAllVariables();

  useEffect(() => {
    updateNodeData(id, {
      prompt,
      conditionGuidelines,
      response,
      variableName,
      personalAPI: localPersonalAPI,
      useConditions,
      isPersonalAPIActive,
      lastUpdated: new Date().toISOString(),
    });

    if (response && response !== "Waiting for input..." && variableName) {
      setVariable(variableName, response);
    }
  }, [
    id,
    prompt,
    conditionGuidelines,
    response,
    variableName,
    localPersonalAPI,
    useConditions,
    isPersonalAPIActive,
  ]);

  const handleRun = async () => {
    if (!prompt.trim()) {
      setResponse("Prompt cannot be empty");
      return;
    }

    setLoading(true);
    setResponse("Generating...");

    try {
      const processedPrompt = interpolateVariables(prompt);
      const processedGuidelines = interpolateVariables(conditionGuidelines);
      let finalPrompt = processedPrompt;
      if (useConditions && processedGuidelines.trim()) {
        finalPrompt = `${processedPrompt}

Please follow these guidelines strictly:
${processedGuidelines}

Ensure your response adheres to all guidelines while being helpful.`;
      }

      const payload = {
        personalApiKey: isPersonalAPIActive ? localPersonalAPI.trim() : null,
        prompt: finalPrompt,
        model: "gemini-2.5-flash",
      };

      const API_BASE_URL =
        process.env.NODE_ENV === "production"
          ? `https://${process.env.REACT_APP_API_URL}`
          : "http://localhost:8000";

      const res = await fetch(`${API_BASE_URL}/api/gemini`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMessage = `API Error: ${res.status} ${res.statusText}`;

        try {
          const errorData = await res.json();
          if (res.status === 401 || res.status === 403) {
            if (isPersonalAPIActive) {
              errorMessage =
                "Invalid Personal API Key - Please check your Gemini API key";
            } else {
              errorMessage =
                "Backend API Authentication Failed - Contact administrator";
            }
          } else if (res.status === 429) {
            errorMessage = "Rate limit exceeded - Please try again later";
          } else if (res.status === 402) {
            errorMessage =
              "API quota exceeded or billing issue - Check your Google AI account";
          } else if (res.status === 400) {
            errorMessage = `Bad Request: ${
              errorData.error?.message || "Invalid request parameters"
            }`;
          } else if (res.status >= 500) {
            errorMessage = "Server Error - API service temporarily unavailable";
          } else if (errorData.error?.message) {
            errorMessage = `Error: ${errorData.error.message}`;
          }
        } catch (parseError) {
          console.error("Error parsing API error response:", parseError);
        }
        setResponse(errorMessage);
        return;
      }

      const result = await res.json();
      if (!result || !result.output) {
        setResponse("No response received from API - Please try again");
        return;
      }

      let output = result.output;

      output = output
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/#{1,6}\s/g, "")
        .replace(/\n\s*\n/g, "\n")
        .trim();

      setResponse(output);
    } catch (err) {
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        setResponse("Network Error - Unable to connect to API server");
      } else if (err.name === "AbortError") {
        setResponse("Request Timeout - Please try again");
      } else {
        setResponse("Unexpected Error: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const expandPanelContent = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="font-semibold text-gray-800 text-sm">
              Gemini Config
            </span>
          </div>
          <div className="text-xs">
            {isPersonalAPIActive ? (
              <div className="flex items-center gap-1 text-green-600">
                <span>Personal API</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-blue-600">
                <span>Backend API</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-orange-600" />
            <span className="font-semibold text-gray-800 text-sm">
              Conditions
            </span>
          </div>
          <button
            onClick={() => setUseConditions(!useConditions)}
            className={`px-3 py-1 text-xs font-medium rounded ${
              useConditions
                ? "bg-orange-500 text-white"
                : "bg-gray-200 text-gray-700"
            } nodrag transition-colors`}
          >
            {useConditions ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Key className="w-4 h-4 inline mr-1" />
          Personal API Key (Optional)
        </label>
        <textarea
          value={localPersonalAPI}
          onChange={(e) => setLocalPersonalAPI(e.target.value)}
          className="w-full px-2 py-2 text-sm border border-gray-300 rounded nodrag resize-none"
          placeholder="AIzaSyD... (Google AI API key)"
          rows={2}
        />
        {localPersonalAPI && localPersonalAPI.trim().length < 30 && (
          <div className="mt-1 text-xs text-red-600">
            API key seems too short. Gemini keys are typically 39+ characters
          </div>
        )}
      </div>

      {useConditions && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content Guidelines
          </label>
          <div className="border border-gray-500 rounded-md p-2 bg-gray-50 max-w-96 max-h-36 min-h-36 overflow-w-auto overflow-y-auto">
            <div className="text-xs text-gray-500">
              {interpolateVariables(conditionGuidelines).substring(0, 800)}
              {interpolateVariables(conditionGuidelines).length > 800
                ? "..."
                : ""}
            </div>
          </div>
        </div>
      )}
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
        { id: "conditions", color: "#7c3aed" },
      ]}
      outputHandles={[{ id: "out", color: "#7c3aed" }]}
      color="purple"
      status={
        loading
          ? { type: "loading", text: "Generating..." }
          : response.includes("Error")
          ? { type: "error", text: "Error" }
          : response !== "Waiting for input..."
          ? { type: "success", text: "Complete" }
          : { type: "idle", text: "Ready" }
      }
      expandPanelContent={expandPanelContent}
      className={selected ? "ring-2 ring-purple-400" : ""}
    >
      <div className="space-y-3 max-w-96">
        {/* Header */}
        <div className="flex items-center justify-between p-2 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-800">
              Gemini 2.5 Flash
            </span>
          </div>
          <div className="flex items-center gap-2">
            {useConditions && <Filter className="w-3 h-3 text-orange-600" />}
            <div
              className={`w-2 h-2 rounded-full ${
                isPersonalAPIActive ? "bg-green-500" : "bg-blue-500"
              }`}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Enter prompt (use {{variableName}} for variables)"
              className="w-full px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 nodrag resize-none text-sm"
            />
            <div className="mt-1 text-xs text-gray-500">
              <strong>Preview:</strong>{" "}
              {interpolateVariables(prompt).substring(0, 50)}
              {interpolateVariables(prompt).length > 50 ? "..." : ""}
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Output Variable
              </label>
              <input
                type="text"
                value={variableName}
                onChange={(e) => setVariableName(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 nodrag text-sm"
                placeholder="gemini_response"
              />
            </div>

            <div>
              <button
                onClick={() => setUseConditions(!useConditions)}
                className={`w-full px-3 py-1 text-sm font-medium rounded ${
                  useConditions
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 text-gray-700"
                } nodrag transition-colors`}
              >
                {useConditions ? "Conditions ON" : "Conditions OFF"}
              </button>
            </div>
          </div>
        </div>

        {useConditions && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Condition Variable
            </label>
            <input
              type="text"
              value={conditionGuidelines}
              onChange={(e) => setConditionGuidelines(e.target.value)}
              placeholder="e.g., {{con}} - variables work here!"
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

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Response
          </label>
          <div className="p-2 border border-gray-300 rounded bg-gray-50 max-h-24 max-w-96 overflow-y-auto">
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

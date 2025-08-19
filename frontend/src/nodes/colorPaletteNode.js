import React, { useEffect, useState, useRef } from 'react';
import { useStore } from 'reactflow';
import { SketchPicker } from 'react-color';
import { NodeBase } from '../components/NodeBase';
import { useVariableStore } from '../stores/variableStore';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export const ColorNode = ({ id }) => {
  const nodes = useStore((s) => Array.from(s.nodeInternals.values()));
  const edges = useStore((s) => s.edges);
  const [connectedNodes, setConnectedNodes] = useState([]);
  const [variablesFromInput, setVariablesFromInput] = useState([]);
  const [selectedVar, setSelectedVar] = useState('');
  const [colorMap, setColorMap] = useState({});
  const originalValues = useRef({});

  const { variables, setVariable } = useVariableStore();

  // Track connected nodes
  useEffect(() => {
    const incoming = edges.filter((e) => e.target === id);
    const sources = incoming
      .map((e) => nodes.find((n) => n.id === e.source))
      .filter(Boolean);
    setConnectedNodes(sources);
  }, [edges, nodes, id]);

  // Extract variable names from connected nodes
  useEffect(() => {
    const vars = [];
    connectedNodes.forEach((node) => {
      const data = node.data;
      if (data?.variableName) vars.push(data.variableName);
    });
    setVariablesFromInput(vars);
    if (!selectedVar && vars.length > 0) setSelectedVar(vars[0]);
  }, [connectedNodes]);

  // Watch for original value updates (store clean value)
  useEffect(() => {
    if (selectedVar && variables[selectedVar]) {
      const raw = variables[selectedVar];
      const isStyled = raw.includes('<span') || raw.includes('<div');
      if (!originalValues.current[selectedVar] || !isStyled) {
        originalValues.current[selectedVar] = raw;
      }
    }
  }, [variables, selectedVar]);

  // Apply selected color to variable (from original clean)
  const handleColorChange = (color) => {
    if (!selectedVar) return;

    const original = originalValues.current[selectedVar] || variables[selectedVar] || selectedVar;

    const styled = `<span style="color:${color.hex}">${original}</span>`;
    setColorMap((prev) => ({ ...prev, [selectedVar]: color.hex }));
    setVariable(selectedVar, styled);
  };

  //  Reset color
  const handleReset = () => {
    if (!selectedVar) return;

    const original = originalValues.current[selectedVar];
    if (original) {
      setVariable(selectedVar, original);
    }
    setColorMap((prev) => {
      const copy = { ...prev };
      delete copy[selectedVar];
      return copy;
    });
  };

  const leftPanel = (
    <div className="space-y-3 text-sm text-gray-700">
      <div>
        <label className="text-xs font-medium text-gray-600">Select Variable</label>
        <select
          value={selectedVar}
          onChange={(e) => setSelectedVar(e.target.value)}
          className="w-full border px-2 py-1 rounded text-sm"
        >
          {variablesFromInput.length > 0 ? (
            variablesFromInput.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))
          ) : (
            <option value="">No variables</option>
          )}
        </select>
      </div>

      {selectedVar && (
        <>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Pick Color</label>
            <SketchPicker
              color={colorMap[selectedVar] || '#000000'}
              onChange={handleColorChange}
              disableAlpha={true}
            />
          </div>

          <button
            onClick={handleReset}
            className="mt-2 text-sm text-red-600 border border-red-400 px-3 py-1 rounded hover:bg-red-50 transition-all flex items-center gap-1"
          >
            <XCircle size={14} />
            Reset Color
          </button>
        </>
      )}
    </div>
  );

  const rightPanel = (
    <div className="text-xs text-gray-700 space-y-4">
      <div>
        <div className="font-semibold text-gray-800 mb-1">Status</div>
        <div
          className={`flex items-start gap-2 p-3 border rounded shadow-sm ${
            selectedVar && colorMap[selectedVar]
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-gray-100 border-gray-300 text-gray-700'
          }`}
        >
          {selectedVar && colorMap[selectedVar] ? (
            <CheckCircle size={16} className="mt-0.5 text-green-500" />
          ) : (
            <AlertTriangle size={16} className="mt-0.5 text-gray-500" />
          )}
          <div className="leading-snug">
            {selectedVar && colorMap[selectedVar]
              ? `Color applied to "${selectedVar}"`
              : 'No color applied yet'}
          </div>
        </div>
      </div>

      <div className="border-t pt-2">
        <div className="font-semibold text-gray-800 mb-1">How to Use</div>
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          <li>Connect a node that defines a variable (e.g., InputNode, LLMNode)</li>
          <li>Select a variable from the dropdown</li>
          <li>Pick a color or paste a hex code in the input field</li>
          <li>The variable will be wrapped in styled HTML automatically</li>
          <li>Use <code>{`{{variableName}}`}</code> in TextNode</li>
          <li>You can <b>remove</b> this node once styling is applied</li>
        </ul>
      </div>
    </div>
  );

  return (
    <NodeBase
      id={id}
      title="Color Palette Node"
      layout="split"
      inputHandles={[{ id: 'input', color: 'bg-amber-600' }]}
      outputHandles={[]}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
    />
  );
};

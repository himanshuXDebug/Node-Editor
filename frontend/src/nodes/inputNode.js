import React, { useEffect, useState } from "react";
import { Handle, Position } from "reactflow";
import { X, Minus, ChevronRight, ChevronLeft } from "lucide-react";
import {NodeBase} from "../components/NodeBase";
import {useVariableStore} from "../stores/variableStore";

export function InputNode({ id, data }) {
  const { registerVariable, setVariable, removeVariable } = useVariableStore();
  const [variableName, setVariableName] = useState(data?.variableName || "");
  const [collapsed, setCollapsed] = useState(false);
  const [rightPanel, setRightPanel] = useState(true);

  // Register variable on mount
  useEffect(() => {
    if (!variableName) {
      const newVar = registerVariable(id);
      setVariableName(newVar);
      data.variableName = newVar; // persist
    }
    return () => {
      removeVariable(variableName);
    };
  }, []);

  return (
    <NodeBase
      id={id}
      title="Input"
      onClose={() => removeVariable(variableName)}
      onMinimize={() => setCollapsed((p) => !p)}
      onToggleRightPanel={() => setRightPanel((p) => !p)}
      collapsed={collapsed}
      rightPanel={rightPanel}
    >
      {!collapsed && (
        <div className="flex flex-col gap-2">
          {/* Variable name */}
          <div className="text-xs font-medium text-gray-400">
            Variable Name
          </div>
          <input
            type="text"
            value={variableName}
            readOnly
            className="px-2 py-1 text-sm border rounded bg-gray-100 text-gray-600"
          />

          {/* Input box */}
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              placeholder="Enter input..."
              className="flex-1 px-2 py-1 text-sm border rounded"
              onChange={(e) => setVariable(variableName, e.target.value)}
            />
            <button
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded"
              onClick={() =>
                console.log("Send clicked →", variableName)
              }
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Handle for connecting */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-400"
      />
    </NodeBase>
  );
}

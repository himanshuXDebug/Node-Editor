import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useVariableStore } from '../stores/variableStore';
import { useReactFlow, useStore } from 'reactflow';
import { Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { NodeBase } from '../components/NodeBase';

export const TextNode = ({ id, data }) => {
  const [text, setText] = useState(data.text || '');
  const [showPreview, setShowPreview] = useState(true);
  const [errors, setErrors] = useState([]);
  const textareaRef = useRef(null);
  const containerRef = useRef(null);

  const { variables } = useVariableStore();
  const { setNodes } = useReactFlow();

  const edges = useStore((s) => s.edges);
  const nodeMap = useStore((s) => s.nodeInternals);

  useEffect(() => {
    console.log('[TextNode] Full variable store:', variables);
  }, [variables]);

  const connectedSources = useMemo(() => {
    const sources = edges
      .filter((e) => e.target === id)
      .map((e) => nodeMap.get(e.source))
      .filter(Boolean);
    console.log('[TextNode] Connected sources:', sources.map(n => ({ id: n.id, title: n?.data?.title, variableName: n?.data?.variableName })));
    return sources;
  }, [edges, nodeMap, id]);

  const usedVariables = useMemo(() => {
    const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
    return [...new Set(matches.map((m) => m.replace(/[{}]/g, '').trim()))];
  }, [text]);

  const connectedVariableNames = useMemo(() => {
    const vars = connectedSources.map((node) => node?.data?.variableName).filter(Boolean);
    console.log('[TextNode] Variable names from connected nodes:', vars);
    return vars;
  }, [connectedSources]);

  const scopedVariables = useMemo(() => {
    const store = useVariableStore.getState().variables;
    const scoped = Object.fromEntries(
      connectedVariableNames.map((key) => [key, store[key]])
    );
    console.log('[TextNode] Scoped variables available:', scoped);
    return scoped;
  }, [connectedVariableNames]);

  // Validate variable names
  useEffect(() => {
    const regex = /\{\{([^}]+)\}\}/g;
    const invalids = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      const name = match[1].trim();
      if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
        invalids.push(`Invalid: ${name}`);
      }
    }
    setErrors(invalids);
  }, [text]);

  const previewHTML = useMemo(() => {
    return text.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
      const k = key.trim();
      const value = scopedVariables[k];

      if (!value) return `<span class="text-red-600">[${k}]</span>`;

      const isImage =
        typeof value === 'string' &&
        (value.startsWith('data:image') ||
          (value.startsWith('http') && value.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)?/i)));

      return isImage
        ? `<img src="${value}" style="max-width:100%; max-height:100px; border-radius:6px;" />`
        : String(value);
    });
  }, [text, scopedVariables]);

  useEffect(() => {
    const el = containerRef.current;
    const ta = textareaRef.current;
    if (!el || !ta) return;

    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';

    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = '14px Inter';
    const width = Math.max(...text.split('\n').map((l) => ctx.measureText(l).width), 150);
    el.style.width = Math.min(width + 80, 420) + 'px';
  }, [text]);

  // Sync to ReactFlow node
  useEffect(() => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                text,
                preview: previewHTML,
                errors,
              },
            }
          : node
      )
    );
  }, [id, text, previewHTML, errors, setNodes]);

  const status = errors.length
    ? { type: 'error', message: errors.join(', ') }
    : { type: 'success', message: 'Ready' };

  const leftPanel = (
    <div ref={containerRef} className="space-y-2">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full p-2 border rounded resize-none text-sm font-mono shadow-sm"
        placeholder="Type something using {{variables}}..."
      />

      <div className="text-xs text-gray-600 flex justify-between items-center">
        <span className="font-medium">Preview</span>
        <button
          onClick={() => setShowPreview((prev) => !prev)}
          className="flex items-center text-blue-500 gap-1 text-xs hover:underline"
        >
          {showPreview ? (
            <>
              <EyeOff size={12} /> Hide
            </>
          ) : (
            <>
              <Eye size={12} /> Show
            </>
          )}
        </button>
      </div>

      {showPreview && (
        <div
          className="p-2 border bg-gray-50 rounded text-sm text-gray-800 whitespace-pre-wrap shadow-inner"
          dangerouslySetInnerHTML={{ __html: previewHTML }}
        />
      )}
    </div>
  );

  const rightPanel = (
    <div className="text-xs space-y-4 text-gray-700">
      {/* Status */}
      <div>
        <div className="font-semibold text-gray-800 mb-1">Status</div>
        <div
          className={`p-2 rounded text-xs border shadow-sm ${
            status.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {status.type === 'success' ? (
            <div className="flex items-center gap-1">
              <CheckCircle size={12} /> {status.message}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <AlertTriangle size={12} /> {status.message}
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="font-semibold text-gray-800 mb-1">Used Variables</div>
        {usedVariables.length > 0 ? (
          <ul className="list-disc list-inside space-y-1">
            {usedVariables.map((v, i) => (
              <li key={i} className="text-gray-700">
                <code>{v}</code>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-400 italic">No variables used</div>
        )}
      </div>

      <div>
        <div className="font-semibold text-gray-800 mb-1">Connected Nodes</div>
        {connectedSources.length > 0 ? (
          <ul className="list-disc list-inside space-y-1">
            {connectedSources.map((n, i) => (
              <li key={i} className="text-gray-700">
                {n?.data?.title || n?.type || `Node ${n.id}`}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-400 italic">None connected</div>
        )}
      </div>
    </div>
  );

  return (
    <NodeBase
      id={id}
      title="Text Node"
      layout="split"
      inputHandles={[{ id: 'input', color: 'bg-blue-600' }]}
      outputHandles={[{ id: 'output', color: 'bg-blue-600' }]}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
    />
  );
};

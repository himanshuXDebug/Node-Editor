import React, { useState, useEffect, useRef } from 'react';
import {
  Handle,
  Position,
  useReactFlow,
  useUpdateNodeInternals,
} from 'reactflow';
import {
  X,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronLeft,
  PlusCircle,
  Edit3,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';

export const NodeBase = ({
  id,
  data = {},
  title: initialTitle = 'Node',
  icon: Icon,
  inputHandles = [],
  outputHandles = [],
  children,
  status = null,
  deletable = true,
  color = 'blue',
  className = '',
  onDelete,
  expandPanelContent = null,
  expandButtonVisible = true,
  collapsed = false,
  onCollapseToggle,
  onCreateSubNodeData,
}) => {
  const { setNodes } = useReactFlow();
  const contentRef = useRef(null);
  const updateNodeInternals = useUpdateNodeInternals();

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(initialTitle);

  // Refresh layout when panel or minimize toggled
  useEffect(() => {
    const t = setTimeout(() => updateNodeInternals(id), 260);
    return () => clearTimeout(t);
  }, [isPanelOpen, isMinimized, updateNodeInternals, id]);

  const glassColors = {
    blue: 'bg-white border-blue-300',
    green: 'bg-white border-green-300',
    purple: 'bg-white border-purple-300',
  };
  const hoverBorders = {
    blue: 'group-hover:border-blue-500',
    green: 'group-hover:border-green-500',
    purple: 'group-hover:border-purple-500',
  };
  const textColors = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    purple: 'text-purple-700',
  };

  const getColor = glassColors[color] || glassColors.blue;
  const getHoverBorder = hoverBorders[color] || hoverBorders.blue;
  const getTextColor = textColors[color] || textColors.blue;

  const StatusIcon =
    status?.type === 'error' ? AlertCircle
      : status?.type === 'success' ? CheckCircle
        : status?.type === 'loading' ? Clock
          : null;

  const statusColorMap = {
    success: 'text-green-600',
    error: 'text-red-500',
    loading: 'text-yellow-500',
    idle: 'text-gray-400',
  };

  const handleDelete = () => {
    if (onDelete) return onDelete(id);
    setNodes((nodes) => nodes.filter((n) => n.id !== id));
  };

  const commitRename = () => {
    setEditingTitle(false);
    setNodes(nodes => nodes.map(n => n.id === id ? { ...n, data: { ...n.data, title } } : n));
  };

  const panelWidth = 320;
  const handleRadii = 18;

  const renderHandle = (handle, type, index) => {
    const isInput = type === 'input';
    const handleId = typeof handle === 'string' ? handle : handle.id;
    const handleColor = typeof handle === 'string' ? '#3b82f6' : (handle.color || '#3b82f6');
    const offsetRight = isInput ? '-9px' : (isPanelOpen && !isMinimized ? `-${panelWidth - 5}px` : '-9px');
    const topPosition = isMinimized ? '22%' : '50%';

    return (
      <div
        key={`${type}-${handleId}`}
        className="absolute transition-all duration-300"
        style={{
          top: isInput ? '50%' : topPosition,
          transform: 'translateY(-50%)',
          [isInput ? 'left' : 'right']: offsetRight,
          zIndex: 40,
        }}
      >
        <Handle
          id={handleId}
          type={isInput ? 'target' : 'source'}
          position={isInput ? Position.Left : Position.Right}
          style={{
            width: handleRadii,
            height: handleRadii,
            backgroundColor: handleColor,
            border: '3px solid white',
            borderRadius: '9999px',
            boxShadow: `0 0 0 2px ${handleColor}`,
            zIndex: 50,
          }}
        />
      </div>
    );
  };

  return (
    <div
      className={`
        relative group rounded-md border border-blue-400 transition-all duration-300
        shadow-sm hover:shadow-lg backdrop-blur-sm
        ${getColor} ${getHoverBorder} ${className}
      `}
      style={{
        minWidth: isMinimized ? 160 : 260,
        width: isMinimized ? 160 : undefined,
        overflow: 'visible',
      }}
    >
      {inputHandles.map((h, i) => renderHandle(h, 'input', i))}
      {outputHandles.map((h, i) => renderHandle(h, 'output', i))}

      {/* Header */}
      <div
        className={`flex items-center justify-between px-3 py-2 border-b ${getTextColor} bg-gray-50 rounded-t-xl`}
        style={{ minHeight: 48 }}
      >
        <div className="flex items-center gap-2 font-medium text-sm">
          {Icon && <Icon className="w-4 h-4" />}
          {editingTitle ? (
            <input
              autoFocus
              className="text-sm px-1 py-0.5 border rounded w-32"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => e.key === 'Enter' && commitRename()}
            />
          ) : (
            <div
              onDoubleClick={() => setEditingTitle(true)}
              className="select-none"
              title="Double click to rename"
            >
              {title}
            </div>
          )}

          {StatusIcon && (
            <div className="ml-2 flex items-center gap-1">
              <StatusIcon className={`w-4 h-4 ${statusColorMap[status?.type] || ''}`} />
              {status?.text && <span className="text-xs text-gray-500">{status.text}</span>}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {expandButtonVisible && expandPanelContent && (
            <button
              onClick={() => setIsPanelOpen((s) => !s)}
              className="hover:bg-gray-200 p-1 rounded "
              title={isPanelOpen ? 'Close preview' : 'Open preview'}
            >
              {isPanelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}

          <button
            onClick={() => {
              setIsMinimized((s) => !s);
              if (!isMinimized) setIsPanelOpen(false);
              onCollapseToggle && onCollapseToggle(!isMinimized);
            }}
            className="hover:bg-gray-200 p-1 rounded-xl "
            title={isMinimized ? 'Maximize node' : 'Minimize node'}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>

          {deletable && (
            <button
              onClick={handleDelete}
              className="hover:bg-red-200 text-red-500 p-1 rounded"
              title="Delete node"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <div className="px-3 py-2 border-b bg-white flex items-center gap-2 text-xs">
          <button
            onClick={() => setEditingTitle(true)}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-50"
            title="Rename"
          >
            <Edit3 size={14} /> Rename
          </button>
          <div className="ml-auto text-xs text-gray-400">Mode: {isPanelOpen ? 'Panel' : 'Main'}</div>
        </div>
      )}

      {!isMinimized && !collapsed && (
        <div ref={contentRef} className="p-3 space-y-3 bg-white">{children}</div>
      )}

      {expandPanelContent && (
        <div
          aria-hidden={!isPanelOpen}
          className="absolute top-2 left-[260px] z-20 bg-white border border-gray-200 rounded-xl shadow-2xl transition-all duration-300 overflow-hidden"
          style={{
            width: isPanelOpen && !isMinimized ? panelWidth : 0,
            opacity: isPanelOpen && !isMinimized ? 1 : 0,
            transform: isPanelOpen && !isMinimized ? 'translateX(0)' : 'translateX(10px)',
          }}
        >
          <div className="h-full flex flex-col">
            <div className="p-3 border-b flex items-center justify-between">
              <div className="font-medium text-sm">Preview</div>
              <button onClick={() => setIsPanelOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="p-3 overflow-auto">{expandPanelContent}</div>
          </div>
        </div>
      )}
    </div>
  );
};

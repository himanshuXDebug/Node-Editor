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

  const panelWidth = 280;
  const handleRadii = 12;

  const renderHandle = (handle, type, index) => {
    const isInput = type === 'input';
    const handleId = typeof handle === 'string' ? handle : handle.id;
    const handleColor = typeof handle === 'string' ? '#3b82f6' : (handle.color || '#3b82f6');
    
    // Fix: Output handles move to right panel when panel is open
    let offsetPosition;
    if (isInput) {
      offsetPosition = '-6px'; // Input handles stay on main node
    } else {
      // Output handles move to right panel edge when panel is open
      offsetPosition = isPanelOpen && !isMinimized ? `-${panelWidth + 6}px` : '-6px';
    }
    
    const topPosition = isMinimized ? '22%' : '50%';

    return (
      <div
        key={`${type}-${handleId}`}
        className="absolute transition-all duration-300"
        style={{
          top: isInput ? '50%' : topPosition,
          transform: 'translateY(-50%)',
          [isInput ? 'left' : 'right']: offsetPosition,
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
            border: '2px solid white',
            borderRadius: '50%',
            boxShadow: `0 0 0 1px ${handleColor}`,
            zIndex: 50,
          }}
        />
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Main Node Container */}
      <div
        className={`
          group rounded-lg border-2 transition-all duration-300
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
          className={`flex items-center justify-between px-3 py-2 border-b ${getTextColor} bg-gray-50 rounded-t-lg`}
          style={{ minHeight: 48 }}
        >
          <div className="flex items-center gap-2 font-medium text-sm">
            {Icon && <Icon className="w-4 h-4" />}
            {editingTitle ? (
              <input
                autoFocus
                className="text-sm px-1 py-0.5 border rounded w-32 nodrag"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => e.key === 'Enter' && commitRename()}
              />
            ) : (
              <div
                onDoubleClick={() => setEditingTitle(true)}
                className="select-none cursor-pointer"
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
                className="hover:bg-gray-200 p-1 rounded transition-colors"
                title={isPanelOpen ? 'Close panel' : 'Open panel'}
              >
                {isPanelOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>
            )}

            <button
              onClick={() => {
                setIsMinimized((s) => !s);
                if (!isMinimized) setIsPanelOpen(false);
                onCollapseToggle && onCollapseToggle(!isMinimized);
              }}
              className="hover:bg-gray-200 p-1 rounded transition-colors"
              title={isMinimized ? 'Maximize node' : 'Minimize node'}
            >
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>

            {deletable && (
              <button
                onClick={handleDelete}
                className="hover:bg-red-200 text-red-500 p-1 rounded transition-colors"
                title="Delete node"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {!isMinimized && !collapsed && (
          <div ref={contentRef} className="p-3 space-y-3 bg-white rounded-b-lg">{children}</div>
        )}

        {/* Minimized content */}
        {isMinimized && (
          <div className="p-2 text-center bg-white rounded-b-lg">
            <div className="text-xs text-gray-600 truncate">{data?.variableName || 'Node'}</div>
          </div>
        )}
      </div>

      {/* Right Side Panel */}
      {expandPanelContent && (
        <div
          className={`absolute top-0 bg-white border-2 border-l-0 rounded-r-lg shadow-lg transition-all duration-300 z-10 ${
            isPanelOpen && !isMinimized ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
          }`}
          style={{
            left: '100%',
            width: panelWidth,
            minHeight: '100%',
          }}
        >
          <div className="h-full flex flex-col">
            <div className="p-3 border-b bg-gray-50 flex items-center justify-between rounded-tr-lg">
              <div className="font-medium text-sm">Settings</div>
              <button 
                onClick={() => setIsPanelOpen(false)} 
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-3 overflow-auto flex-1">{expandPanelContent}</div>
          </div>
        </div>
      )}
    </div>
  );
};

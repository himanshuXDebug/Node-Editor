import React, { useState, useEffect } from 'react';
import { Shield} from 'lucide-react';
import { NodeBase } from '../components/NodeBase';
import { useStore } from '../store';

export const ConditionNode = ({ id, data, selected }) => {
  const [instructions, setInstructions] = useState(data?.instructions || '');
  const [variableName, setVariableName] = useState(data?.variableName || `guidelines_${id.split('-')[1]}`);
  const [conditionType, setConditionType] = useState(data?.conditionType || 'content_filter');
  const [priority, setPriority] = useState(data?.priority || 'medium');
  const [isActive, setIsActive] = useState(data?.isActive !== false);

  const updateNodeData = useStore(state => state.updateNodeData);

  useEffect(() => {
    updateNodeData(id, {
      instructions,
      variableName,
      conditionType,
      priority,
      isActive,
      lastUpdated: new Date().toISOString()
    });
  }, [id, instructions, variableName, conditionType, priority, isActive, updateNodeData]);

  const expandPanelContent = (
    <div className="space-y-4">
      {/* Type and Priority - Side by Side */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={conditionType}
            onChange={(e) => setConditionType(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm nodrag"
          >
            <option value="content_filter">Content Filter</option>
            <option value="tone_guide">Tone Guide</option>
            <option value="format_rules">Format Rules</option>
            <option value="safety_check">Safety Check</option>
            <option value="quality_control">Quality Control</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm nodrag"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Guidelines - Full Width */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Guidelines & Instructions</label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={4}
          placeholder="Enter your guidelines here..."
          className="w-full px-2 py-2 border border-gray-300 rounded text-sm nodrag resize-none"
        />
      </div>

      {/* Variable Name and Toggle */}
      <div className="grid grid-cols-3 gap-3 items-end">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Variable Name</label>
          <input
            type="text"
            value={variableName}
            onChange={(e) => setVariableName(e.target.value)}
            placeholder="guidelines"
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm nodrag"
          />
        </div>
        <div className="text-center">
          <button
            onClick={() => setIsActive(!isActive)}
            className={`px-4 py-1 text-sm font-medium rounded ${
              isActive 
                ? 'bg-yellow-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            } nodrag transition-colors`}
          >
            {isActive ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Quick Templates</label>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => setInstructions("Don't include negative aspects or controversial topics")}
            className="p-2 bg-white rounded border hover:bg-blue-50 nodrag text-left"
          >
             Positive Only
          </button>
          <button
            onClick={() => setInstructions("Use simple, clear language for beginners")}
            className="p-2 bg-white rounded border hover:bg-blue-50 nodrag text-left"
          >
             Beginner-Friendly
          </button>
          <button
            onClick={() => setInstructions("Provide factual, educational content without opinions")}
            className="p-2 bg-white rounded border hover:bg-blue-50 nodrag text-left"
          >
             Educational
          </button>
          <button
            onClick={() => setInstructions("Format as structured bullet points with headers")}
            className="p-2 bg-white rounded border hover:bg-blue-50 nodrag text-left"
          >
            Structured
          </button>
        </div>
      </div>
    </div>
  );

  const getConditionPreview = () => {
    if (!instructions) return 'No guidelines set';
    
    const typeIcons = {
      content_filter: '🛡️',
      tone_guide: '🎭', 
      format_rules: '📋',
      safety_check: '⚠️',
      quality_control: '✅'
    };
    
    return `${typeIcons[conditionType]} ${instructions.substring(0, 40)}${instructions.length > 40 ? '...' : ''}`;
  };

  const getPriorityBadge = () => {
    const colors = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700', 
      critical: 'bg-red-100 text-red-700'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[priority]}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  return (
    <NodeBase
      id={id}
      data={data}
      title={data?.title || 'Smart Condition'}
      icon={Shield}
      inputHandles={[{ id: 'input', color: isActive ? '#f59e0b' : '#9ca3af' }]}
      outputHandles={[{ id: 'output', color: isActive ? '#f59e0b' : '#9ca3af' }]}
      color={isActive ? 'yellow' : 'gray'}
      status={{ 
        type: isActive && instructions ? 'success' : 'idle', 
        text: isActive ? (instructions ? 'Active' : 'No Rules') : 'Disabled'
      }}
      expandPanelContent={expandPanelContent}
      className={selected ? 'ring-2 ring-yellow-400' : ''}
      // Override the panel width in NodeBase
      style={{ 
        '--panel-width': '380px' // Wider panel
      }}
    >
      <div className="space-y-3">
        {/* Header with Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-yellow-500' : 'bg-gray-400'}`}></div>
            <span className="text-sm font-semibold text-gray-700">
              {conditionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>
          {getPriorityBadge()}
        </div>

        {/* Guidelines Preview */}
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <div className="text-xs text-yellow-700 font-mono leading-relaxed">
            {getConditionPreview()}
          </div>
        </div>

        {/* Quick Controls */}
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
              placeholder="e.g., don't include political party names"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 nodrag resize-none"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Variable</label>
              <input
                type="text"
                value={variableName}
                onChange={(e) => setVariableName(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 nodrag"
                placeholder="guidelines"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setIsActive(!isActive)}
                className={`px-3 py-1 text-xs font-medium rounded ${
                  isActive 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-gray-200 text-gray-700'
                } nodrag transition-colors`}
              >
                {isActive ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </NodeBase>
  );
};

export default ConditionNode;

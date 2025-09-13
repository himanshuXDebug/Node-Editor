import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  Play,
  FileDown,
  Zap,
  LogIn,
  LogOut,
  Type,
  ArrowUp,
  ArrowDown,
  Image,
  Download,
  Brain,
  Database,
  MessageSquare,
  Book,
  Webhook,
  Cloud,
  Cpu,
  Search,
  Sparkles,
  GitBranch,
  ChevronDown,
  ChevronUp,
  Palette,
  RotateCcw,
  HelpCircle,
  FileText,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { DraggableNode } from "../draggableNode";
import { useRunPanelStore } from "../stores/useRunPanelStore";
import { useStore } from '../store';
import { shallow } from 'zustand/shallow';
import { HowToUsePopup } from './HowToUse';
import { ReportPopup } from './Report';

const nodeTabs = [
  {
    label: "Start",
    color: "from-indigo-500 to-purple-600",
    nodes: [
      { type: "pipeline", label: "Pipeline", icon: GitBranch, color: "text-indigo-600" },
      { type: "agent", label: "Agent", icon: Sparkles, color: "text-purple-600" },
      { type: "transform", label: "Transform", icon: Cpu, color: "text-blue-600" },
    ],
  },
  {
    label: "Objects",
    color: "from-blue-500 to-cyan-600",
    nodes: [
      { type: "customInput", label: "Input", icon: LogIn, color: "text-blue-600" },
      { type: "customOutput", label: "Output", icon: LogOut, color: "text-cyan-600" },
    ],
  },
  {
    label: "Knowledge",
    color: "from-amber-500 to-orange-600",
    nodes: [
      { type: "knowledge", label: "Knowledge", icon: Book, color: "text-amber-600" },
      { type: "document", label: "Document", icon: FileDown, color: "text-orange-600" },
    ],
  },
  {
    label: "AI",
    color: "from-violet-500 to-fuchsia-600",
    nodes: [
      { type: "gemini", label: "Gemini", icon: Brain, color: "text-violet-600" },
      { type: "Openai", label: "OpenAI", icon: Zap, color: "text-fuchsia-600" },
      { type: "anthropic", label: "Anthropic", icon: Sparkles, color: "text-purple-600" },
    ],
  },
  {
    label: "Integrations",
    color: "from-emerald-500 to-teal-600",
    nodes: [
      { type: "aws", label: "AWS", icon: Cloud, color: "text-emerald-600" },
      { type: "google", label: "Google", icon: Cloud, color: "text-teal-600" },
      { type: "webhook", label: "Webhook", icon: Webhook, color: "text-green-600" },
    ],
  },
  {
    label: "Logic",
    color: "from-rose-500 to-pink-600",
    nodes: [
      { type: "condition", label: "Condition", icon: GitBranch, color: "text-rose-600" },
      { type: "loop", label: "Loop", icon: RotateCcw, color: "text-pink-600" },
    ],
  },
  {
    label: "Data",
    color: "from-slate-500 to-gray-600",
    nodes: [
      { type: "text", label: "Text", icon: Type, color: "text-slate-600" },
      { type: "uppercase", label: "Uppercase", icon: ArrowUp, color: "text-gray-600" },
      { type: "lowercase", label: "Lowercase", icon: ArrowDown, color: "text-slate-500" },
      { type: "Image", label: "Image", icon: Image, color: "text-blue-600" },
      { type: "Download", label: "Download", icon: Download, color: "text-green-600" },
      { type: "database", label: "Database", icon: Database, color: "text-indigo-600" },
      { type: "palette", label: "Palette", icon: Palette, color: "text-purple-600" },
    ],
  },
  {
    label: "Chat",
    color: "from-cyan-500 to-blue-600",
    nodes: [
      { type: "chatbot", label: "Chatbot", icon: MessageSquare, color: "text-cyan-600" },
      { type: "response", label: "Response", icon: Type, color: "text-blue-600" },
    ],
  },
];

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  setNodes: state.setNodes,
  setEdges: state.setEdges,
});

export default function Header() {
  const [activeTab, setActiveTab] = useState("Objects");
  const [searchTerm, setSearchTerm] = useState("");
  const [isNodesVisible, setIsNodesVisible] = useState(true);
  const [pipelineName, setPipelineName] = useState("Untitled Pipeline 1");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const openPanel = useRunPanelStore(state => state.openPanel);
  const { nodes, edges, setNodes, setEdges } = useStore(selector, shallow);

  const getFilteredNodes = () => {
    const currentTab = nodeTabs.find((tab) => tab.label === activeTab);
    if (!currentTab) return [];

    if (!searchTerm.trim()) return currentTab.nodes;

    return currentTab.nodes.filter((node) =>
      node.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleTabClick = (label) => {
    if (activeTab === label) {
      setIsNodesVisible(!isNodesVisible);
    } else {
      setActiveTab(label);
      setSearchTerm("");
      setIsNodesVisible(true);
    }
  };

  const resetCanvas = () => {
    if (window.confirm("Clear entire canvas? This cannot be undone.")) {
      setNodes([]);
      setEdges([]);
    }
  };

  const startEditingName = () => {
    setTempName(pipelineName);
    setIsEditingName(true);
  };

  const savePipelineName = () => {
    if (tempName.trim()) {
      setPipelineName(tempName.trim());
    }
    setIsEditingName(false);
  };

  const cancelEditingName = () => {
    setTempName("");
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') savePipelineName();
    if (e.key === 'Escape') cancelEditingName();
  };

  return (
    <>
      <header className="border-b-2 border-gray-200/60 bg-gradient-to-br from-white via-slate-50/50 to-gray-100/30 backdrop-blur-xl shadow-lg">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 shadow-sm ring-1 ring-gray-200/50">
              <span className="font-semibold text-gray-800">Pipelines</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />

              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={handleNameKeyDown}
                    onBlur={savePipelineName}
                    className="font-bold text-gray-900 bg-transparent border-b border-blue-500 outline-none"
                    autoFocus
                  />
                  <button onClick={savePipelineName} className="p-1 hover:bg-green-100 rounded">
                    <Check className="h-3 w-3 text-green-600" />
                  </button>
                  <button onClick={cancelEditingName} className="p-1 hover:bg-red-100 rounded">
                    <X className="h-3 w-3 text-red-600" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{pipelineName}</span>
                  <button onClick={startEditingName} className="p-1 hover:bg-gray-100 rounded">
                    <Edit2 className="h-3 w-3 text-gray-500" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={resetCanvas}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-red-600 border-2 border-red-200 bg-white/90 hover:bg-red-50 transition-all"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>

            <button
              onClick={() => setShowHowToUse(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-blue-600 border-2 border-blue-200 bg-white/90 hover:bg-blue-50 transition-all"
            >
              <HelpCircle className="h-4 w-4" />
              Help
            </button>

            <button
              onClick={() => setShowReport(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-purple-600 border-2 border-purple-200 bg-white/90 hover:bg-purple-50 transition-all"
            >
              <FileText className="h-4 w-4" />
              Report
            </button>

            <button
              onClick={openPanel}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg transition-all"
            >
              <Play className="h-4 w-4" />
              Run
            </button>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-gray-400/10">
          <div className="flex items-center justify-between h-12 px-10">
            <div className="flex items-center gap-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search nodes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 w-56 pl-10 pr-4 rounded-lg bg-white border-2 border-gray-200/60 text-sm outline-none focus:border-indigo-400 transition-all"
                />
              </div>

              <div className="flex items-center gap-6">
                {nodeTabs.map(({ label, color }) => (
                  <button
                    key={label}
                    onClick={() => handleTabClick(label)}
                    className={`text-sm font-semibold px-2 py-1 rounded-md transition-all ${
                      activeTab === label
                      ? `text-white bg-gradient-to-r ${color} shadow-md`
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsNodesVisible(!isNodesVisible)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/80 border border-gray-300 hover:bg-gray-50 transition-all"
            >
              <span className="text-xs font-medium text-gray-600">
                {isNodesVisible ? 'Hide' : 'Show'}
              </span>
              {isNodesVisible ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {isNodesVisible && (
            <div className="px-6 py-4">
              <div className="flex gap-4 overflow-x-auto pb-2">
                {getFilteredNodes().map(({ label, icon: Icon, type, color }) => (
                  <DraggableNode 
                    key={type} 
                    type={type} 
                    label={label} 
                    icon={Icon} 
                    iconColor={color} 
                    compact={false} 
                  />
                ))}
              </div>

              {getFilteredNodes().length === 0 && searchTerm && (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No nodes found for "{searchTerm}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Popup Components */}
      {showHowToUse && <HowToUsePopup onClose={() => setShowHowToUse(false)} />}
      {showReport && <ReportPopup onClose={() => setShowReport(false)} />}
    </>
  );
}
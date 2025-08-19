import {
  ChevronRight,
  RotateCcw,
  RotateCw,
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
} from "lucide-react";
import { useState } from "react";
import { DraggableNode } from "../draggableNode";

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
      { type: "llm", label: "LLM", icon: Brain, color: "text-violet-600" },
      { type: "openai", label: "OpenAI", icon: Zap, color: "text-fuchsia-600" },
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

export default function Header() {
  const [activeTab, setActiveTab] = useState("Objects");
  const [searchTerm, setSearchTerm] = useState("");
  const [isNodesVisible, setIsNodesVisible] = useState(true);

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
      // If clicking the same tab, toggle nodes visibility
      setIsNodesVisible(!isNodesVisible);
    } else {
      // If switching tabs, show nodes and clear search
      setActiveTab(label);
      setSearchTerm("");
      setIsNodesVisible(true);
    }
  };

  const toggleNodesVisibility = () => {
    setIsNodesVisible(!isNodesVisible);
  };

  return (
    <header className="border-b-2 border-gray-200/60 bg-gradient-to-br from-white via-slate-50/50 to-gray-100/30 backdrop-blur-xl shadow-lg">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3 text-sm text-gray-700">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 shadow-sm ring-1 ring-gray-200/50">
            <span className="font-semibold text-gray-800">Pipelines</span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="font-bold text-gray-900">Untitled Pipeline 1</span>
          </div>
          <button className="px-3 py-1.5 rounded-lg border-2 border-blue-300/60 bg-white/90 text-xs font-semibold text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 shadow-sm">
            Edit
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white/80 rounded-lg p-1 shadow-sm ring-1 ring-gray-200/50">
            <button className="p-2 rounded-md hover:bg-gray-100 transition-colors">
              <RotateCcw className="h-4 w-4 text-gray-600" />
            </button>
            <button className="p-2 rounded-md hover:bg-gray-100 transition-colors">
              <RotateCw className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all duration-200">
            <Play className="h-4 w-4" />
            Run
          </button>
          <button className="px-4 py-2 rounded-lg border-2 border-gray-300 bg-white/90 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm">
            Export
          </button>
        </div>
      </div>

      <div className="border-t h-auto overflow-hidden border-gray-200 bg-gray-400/10">
        <div className="flex items-center justify-between h-12 px-10">
          <div className="flex items-center gap-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 w-56 pl-10 pr-4 rounded-lg bg-white border-2 border-gray-200/60 text-sm outline-none placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-6">
              {nodeTabs.map(({ label, color }) => (
                <button
                  key={label}
                  onClick={() => handleTabClick(label)}
                  className={`relative text-sm font-semibold px-2 py-1 rounded-md transition-all duration-200 ${activeTab === label
                      ? `text-white bg-gradient-to-r ${color} shadow-md after:absolute after:-bottom-3 after:left-1/2 after:-translate-x-1/2 after:w-8 after:h-1 after:bg-gradient-to-r after:${color} after:rounded-full`
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {isNodesVisible && (
            <button
              onClick={toggleNodesVisibility}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/80 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
            >
              <span className="text-xs font-medium text-gray-600">Hide </span>
              <ChevronUp className="h-4 w-4 text-gray-500" />
            </button>
          )}

          {!isNodesVisible && (
            <button
              onClick={toggleNodesVisibility}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/80 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
            >
              <span className="text-xs font-medium text-gray-600">Show </span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>

        <div
          className={`transition-all duration-100 ease-in-out overflow-hidden ${isNodesVisible
              ? "max-h-96 opacity-100 translate-y-0"
              : "max-h-0 opacity-0 -translate-y-2"
            }`}
          style={{
            transitionProperty: 'max-height, opacity, transform',
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >

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
        </div>
      </div>
    </header>
  );
}

import React, { useState } from 'react';
import { 
  X, ArrowRight, Check, Clock, Play, Database, BookOpen, Lightbulb,
  MessageSquare, Download, Bot, FileText, GitBranch, Zap, Globe,
  Cloud, Image, Palette, Type, ArrowUp, ArrowDown, RotateCcw, Repeat,
  MessageCircle, Webhook, Server
} from 'lucide-react';

const AVAILABLE_NODES = [
  { name: 'Input', tab: 'Objects', description: 'Receives user messages and data', icon: MessageSquare },
  { name: 'Output', tab: 'Objects', description: 'Downloads and exports final results', icon: Download },
  { name: 'Gemini', tab: 'AI', description: 'Google AI for text generation', icon: Bot },
  { name: 'Text', tab: 'Data', description: 'Edit and process text content', icon: FileText },
  { name: 'Condition', tab: 'Logic', description: 'Add conditions and rules', icon: GitBranch }
];

const DEVELOPMENT_NODES = [
  { name: 'OpenAI', tab: 'AI', description: 'GPT models integration', icon: Zap },
  { name: 'Anthropic', tab: 'AI', description: 'Claude AI models', icon: Bot },
  { name: 'Pipeline', tab: 'Start', description: 'Advanced workflow management', icon: GitBranch },
  { name: 'Agent', tab: 'Start', description: 'Autonomous AI agents', icon: Bot },
  { name: 'Transform', tab: 'Start', description: 'Data transformation utilities', icon: RotateCcw },
  { name: 'Webhook', tab: 'Integrations', description: 'HTTP webhook triggers', icon: Webhook },
  { name: 'AWS', tab: 'Integrations', description: 'Amazon Web Services', icon: Cloud },
  { name: 'Google', tab: 'Integrations', description: 'Google Cloud services', icon: Globe },
  { name: 'Image', tab: 'Data', description: 'Image processing and manipulation', icon: Image },
  { name: 'Palette', tab: 'Data', description: 'Color palette management', icon: Palette },
  { name: 'Uppercase', tab: 'Data', description: 'Convert text to uppercase', icon: ArrowUp },
  { name: 'Lowercase', tab: 'Data', description: 'Convert text to lowercase', icon: ArrowDown },
  { name: 'Download', tab: 'Data', description: 'File download functionality', icon: Download },
  { name: 'Database', tab: 'Data', description: 'Store and query data', icon: Database },
  { name: 'Loop', tab: 'Logic', description: 'Repeat workflows', icon: Repeat },
  { name: 'Chatbot', tab: 'Chat', description: 'Interactive chat interface', icon: MessageCircle }
];

const TAB_COLORS = {
  'Objects': 'bg-blue-100 text-blue-700',
  'AI': 'bg-purple-100 text-purple-700',
  'Data': 'bg-green-100 text-green-700',
  'Logic': 'bg-orange-100 text-orange-700',
  'Start': 'bg-indigo-100 text-indigo-700',
  'Integrations': 'bg-red-100 text-red-700',
  'Chat': 'bg-pink-100 text-pink-700'
};

export const HowToUsePopup = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('guide');

  const tabs = [
    { id: 'guide', label: 'Quick Start', icon: Play },
    { id: 'nodes', label: 'All Nodes', icon: Database },
    { id: 'tips', label: 'Best Practices', icon: Lightbulb }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-slate-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Workflow Documentation</h2>
              <p className="text-slate-600">Setup guide and node reference</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-white">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all ${
                activeTab === id 
                  ? 'border-slate-900 text-slate-900 bg-slate-50' 
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          
          {/* Quick Start Guide */}
          {activeTab === 'guide' && (
            <div className="p-8">
              <div className="max-w-3xl mx-auto">
                
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Minimum Required Setup</h3>
                  <p className="text-slate-600">Follow these steps to create your first workflow</p>
                </div>

                <div className="space-y-6 mb-10">
                  {[
                    { step: 1, title: "Add Input Node", description: "Drag Input from Objects tab to canvas", location: "Objects → Input" },
                    { step: 2, title: "Add Gemini Node", description: "Add AI processing capability", location: "AI → Gemini" },
                    { step: 3, title: "Add Output Node", description: "Enable result downloads", location: "Objects → Output" },
                    { step: 4, title: "Connect Nodes", description: "Create data flow between components", location: "Drag to connect" },
                    { step: 5, title: "Execute Workflow", description: "Test and run your pipeline", location: "Click Run" }
                  ].map(({ step, title, description, location }) => (
                    <div key={step} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-semibold text-sm">
                        {step}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-1">{title}</h4>
                        <p className="text-slate-600 text-sm mb-2">{description}</p>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">{location}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Flow Diagram */}
                <div className="p-6 bg-slate-50 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-4 text-center">Basic Workflow Structure</h4>
                  <div className="flex items-center justify-center gap-4 mb-3">
                    <div className="px-4 py-2 bg-white border border-gray-300 rounded font-medium text-sm">Input</div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <div className="px-4 py-2 bg-white border border-gray-300 rounded font-medium text-sm">Gemini</div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <div className="px-4 py-2 bg-white border border-gray-300 rounded font-medium text-sm">Output</div>
                  </div>
                  <p className="text-center text-xs text-slate-500">All connections must be established before execution</p>
                </div>
              </div>
            </div>
          )}

          {/* All Nodes */}
        {activeTab === 'nodes' && (
  <div className="p-8">
    <div className="max-w-5xl mx-auto space-y-10">
      
      {/* Available Nodes */}
      <div>
        <h3 className="text-base font-medium text-slate-900 mb-6 flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          Available Nodes ({AVAILABLE_NODES.length})
        </h3>
        
        <div className="grid grid-cols-5 gap-6">
          {AVAILABLE_NODES.map((node, i) => (
            <div key={i} className=" max-w-sm text-center p-2 border rounded-lg hover:shadow-sm transition-shadow">
              <node.icon className="w-8 h-8 text-slate-700 mx-auto mb-3" />
              <h4 className="font-semibold text-slate-900 mb-1">{node.name}</h4>
              <div className="text-xs text-slate-500 mb-3 font-mono">{node.tab}</div>
              <p className="text-sm text-slate-600">{node.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Development Nodes */}
      <div>
        <h3 className="text-base font-medium text-slate-900 mb-6 flex items-center gap-2">
          <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
          In Development ({DEVELOPMENT_NODES.length})
        </h3>
        
        <div className="grid grid-cols-5 gap-6">
          {DEVELOPMENT_NODES.map((node, i) => (
            <div key={i} className="text-center p-5 border rounded-lg bg-slate-50">
              <node.icon className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <h4 className="font-medium text-slate-600 mb-1">{node.name}</h4>
              <div className="text-xs text-slate-400 mb-3 font-mono">{node.tab}</div>
              <p className="text-sm text-slate-500">{node.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)}

          {/* Best Practices */}
          {activeTab === 'tips' && (
            <div className="p-8">
              <div className="max-w-3xl mx-auto">
                
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Best Practices</h3>
                  <p className="text-slate-600">Guidelines for effective workflow development</p>
                </div>

                <div className="space-y-8">
                  {[
                    {
                      title: "Workflow Design",
                      items: [
                        "Start with the basic Input → Gemini → Output pattern",
                        "Test workflows with simple inputs before adding complexity",
                        "Keep node connections logical and easy to follow"
                      ]
                    },
                    {
                      title: "Node Configuration",
                      items: [
                        "Configure API keys in Gemini nodes before testing",
                        "Use meaningful variable names in processing nodes",
                        "Verify all required connections are established"
                      ]
                    },
                    {
                      title: "Troubleshooting",
                      items: [
                        "Check node connection status before execution",
                        "Use the Reset function to clear problematic configurations",
                        "Monitor execution status in the Run Panel"
                      ]
                    }
                  ].map(({ title, items }) => (
                    <div key={title} className="border border-gray-200 rounded-lg p-6">
                      <h4 className="font-semibold text-slate-900 mb-4">{title}</h4>
                      <ul className="space-y-2">
                        {items.map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm text-slate-600">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-8 py-4 bg-slate-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">Documentation v1.0</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
            >
              Close Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo, useCallback } from 'react';
import { X, Send, AlertTriangle, Bug, MessageSquare, User, Mail, UserCircle } from 'lucide-react';

const AVAILABLE_NODES = {
  'Objects': ['Input', 'Output'],
  'AI': ['Gemini'],
  'Data': ['Text'],
  'Logic': ['Condition']
};

const NOT_AVAILABLE_NODES = {
  'AI': ['OpenAI', 'Anthropic'],
  'Start': ['Pipeline', 'Agent', 'Transform'],
  'Integrations': ['Webhook', 'AWS', 'Google'],
  'Data': ['Image', 'Palette', 'Uppercase', 'Lowercase', 'Download', 'Database'],
  'Logic': ['Loop'],
  'Chat': ['Chatbot']
};

export const ReportPopup = ({ onClose }) => {
  const [reportType, setReportType] = useState('bug');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAvailableNode, setSelectedAvailableNode] = useState('');
  const [selectedAvailableTab, setSelectedAvailableTab] = useState('');
  const [selectedRequestNode, setSelectedRequestNode] = useState('');
  const [selectedRequestTab, setSelectedRequestTab] = useState('');

  const availableNodesList = useMemo(() => {
    return Object.entries(AVAILABLE_NODES).flatMap(([tab, nodes]) => 
      nodes.map(node => ({ node, tab }))
    );
  }, []);

  const notAvailableNodesList = useMemo(() => {
    return Object.entries(NOT_AVAILABLE_NODES).flatMap(([tab, nodes]) => 
      nodes.map(node => ({ node, tab }))
    );
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const reportData = {
      type: reportType,
      description,
      email,
      name,
      timestamp: new Date().toISOString(),
      ...(reportType === 'bug' && {
        selectedNode: selectedAvailableNode,
        selectedTab: selectedAvailableTab
      }),
      ...(reportType === 'feature' && {
        requestedNode: selectedRequestNode,
        requestedTab: selectedRequestTab
      })
    };

    try {
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });
    } catch (error) {
      console.log('Report Data:', reportData);
    }

    setTimeout(() => {
      alert('Report submitted successfully!');
      setIsSubmitting(false);
      onClose();
    }, 800);
  }, [reportType, description, email, name, selectedAvailableNode, selectedAvailableTab, selectedRequestNode, selectedRequestTab, onClose]);

  const handleAvailableNodeSelect = useCallback((node, tab) => {
    setSelectedAvailableNode(node);
    setSelectedAvailableTab(tab);
  }, []);

  const handleRequestNodeSelect = useCallback((node, tab) => {
    setSelectedRequestNode(node);
    setSelectedRequestTab(tab);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              reportType === 'bug' ? 'bg-red-100' :
              reportType === 'feature' ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              {reportType === 'bug' ? (
                <Bug className="w-5 h-5 text-red-600" />
              ) : reportType === 'feature' ? (
                <AlertTriangle className="w-5 h-5 text-green-600" />
              ) : (
                <MessageSquare className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {reportType === 'bug' ? 'Report a Bug' : 
                 reportType === 'feature' ? 'Request a Node' : 'Send Feedback'}
              </h2>
              <p className="text-sm text-gray-500">Help us improve the platform</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 flex">
          
          {/* Left Column */}
          <div className="flex-1 p-6 space-y-6 border-r border-gray-100">
            
            {/* Report Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-900">What can we help you with?</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { type: 'bug', icon: Bug, label: 'Report Bug', color: 'red' },
                  { type: 'feature', icon: AlertTriangle, label: 'Request Node', color: 'green' },
                  { type: 'feedback', icon: MessageSquare, label: 'Feedback', color: 'blue' }
                ].map(({ type, icon: Icon, label, color }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setReportType(type)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      reportType === type 
                        ? `border-${color}-300 bg-${color}-50 shadow-md` 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mx-auto mb-2 ${
                      reportType === type ? `text-${color}-600` : 'text-gray-400'
                    }`} />
                    <div className={`text-sm font-medium ${
                      reportType === type ? `text-${color}-700` : 'text-gray-600'
                    }`}>
                      {label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-900">
                  What should we call you? <span className="text-gray-500 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-900">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-900">
                {reportType === 'bug' ? 'Describe the bug' : 
                 reportType === 'feature' ? 'Why do you need this?' : 'Your feedback'}
                <span className="text-red-500"> *</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  reportType === 'bug' 
                    ? "What happened? What did you expect? Steps to reproduce..."
                    : reportType === 'feature'
                    ? "Explain your use case and how this node would help..."
                    : "Share your thoughts and suggestions..."
                }
                required
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all"
              />
              <div className="text-xs text-gray-500 text-right">
                {description.length}/1000 characters
              </div>
            </div>
          </div>

          {/* Right Column - Node Selection */}
          <div className="w-80 p-6">
            
            {/* Bug Report - Available Nodes */}
            {reportType === 'bug' && (
              <div className="space-y-4">
                <label className="text-sm font-semibold text-gray-900">
                  Which node has issues? <span className="text-red-500">*</span>
                </label>
                
                <div className="space-y-3">
                  {Object.entries(AVAILABLE_NODES).map(([tab, nodes]) => (
                    <div key={tab} className="space-y-2">
                      <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide">{tab}</h4>
                      <div className="space-y-1">
                        {nodes.map(node => (
                          <label
                            key={node}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                              selectedAvailableNode === node 
                                ? 'bg-red-50 border-red-300 text-red-700' 
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <input
                              type="radio"
                              name="availableNode"
                              value={node}
                              checked={selectedAvailableNode === node}
                              onChange={() => handleAvailableNodeSelect(node, tab)}
                              required={reportType === 'bug'}
                              className="text-red-600 focus:ring-red-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium">{node}</div>
                              <div className="text-xs text-gray-500">{tab} tab</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feature Request - Not Available Nodes */}
            {reportType === 'feature' && (
              <div className="space-y-4">
                <label className="text-sm font-semibold text-gray-900">Which node would you like?</label>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {Object.entries(NOT_AVAILABLE_NODES).map(([tab, nodes]) => (
                    <div key={tab} className="space-y-2">
                      <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide sticky top-0 bg-white py-1">
                        {tab} <span className="text-gray-400">({nodes.length})</span>
                      </h4>
                      <div className="grid gap-1">
                        {nodes.map(node => (
                          <label
                            key={node}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border ${
                              selectedRequestNode === node 
                                ? 'bg-green-50 border-green-300 text-green-700' 
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <input
                              type="radio"
                              name="requestedNode"
                              value={node}
                              checked={selectedRequestNode === node}
                              onChange={() => handleRequestNodeSelect(node, tab)}
                              className="text-green-600 focus:ring-green-500"
                            />
                            <div className="text-sm font-medium">{node}</div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback - No node selection needed */}
            {reportType === 'feedback' && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                  <p className="text-gray-500">Share your thoughts and suggestions to help us improve!</p>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-white transition-colors font-medium text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="report-form"
              onClick={handleSubmit}
              disabled={!description.trim() || !email.trim() || (reportType === 'bug' && !selectedAvailableNode) || isSubmitting}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl transition-all font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                reportType === 'bug' 
                  ? 'bg-red-600 hover:bg-red-700' :
                reportType === 'feature' 
                  ? 'bg-green-600 hover:bg-green-700' :
                  'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

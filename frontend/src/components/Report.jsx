import React, { useState, useCallback, useMemo } from 'react';
import { X, Send, AlertTriangle, Bug, MessageSquare, UserCircle, Mail, CheckCircle, XCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

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

const ReportTypeCard = React.memo(({ type, icon: Icon, label, color, desc, isSelected, onClick }) => (
  <div
    onClick={onClick}
    className={`cursor-pointer p-4 rounded-xl border transition-all duration-150 hover:shadow-md ${
      isSelected 
        ? `border-${color}-200 bg-${color}-50 shadow-sm ring-1 ring-${color}-100` 
        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
    }`}
  >
    <div className="text-center">
      <div className={`inline-flex p-3 rounded-lg mb-3 transition-colors duration-150 ${
        isSelected ? `bg-${color}-100` : 'bg-gray-100'
      }`}>
        <Icon className={`w-5 h-5 transition-colors duration-150 ${
          isSelected ? `text-${color}-600` : 'text-gray-500'
        }`} />
      </div>
      <h3 className={`font-semibold text-sm mb-1 transition-colors duration-150 ${
        isSelected ? `text-${color}-900` : 'text-gray-900'
      }`}>
        {label}
      </h3>
      <p className="text-xs text-gray-500">{desc}</p>
    </div>
  </div>
));

const NodeCard = React.memo(({ node, tab, isSelected, onSelect, color }) => (
  <div
    onClick={onSelect}
    className={`cursor-pointer p-3 rounded-lg border transition-all duration-150 ${
      isSelected 
        ? `border-${color}-200 bg-${color}-50 shadow-sm` 
        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
    }`}
  >
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full transition-colors duration-150 ${
        isSelected ? `bg-${color}-500` : 'bg-gray-300'
      }`} />
      <div className="flex-1">
        <div className={`font-medium text-sm transition-colors duration-150 ${
          isSelected ? `text-${color}-900` : 'text-gray-900'
        }`}>
          {node}
        </div>
        <div className="text-xs text-gray-500">{tab}</div>
      </div>
    </div>
  </div>
));

export const ReportPopup = ({ onClose }) => {
  const [reportType, setReportType] = useState('bug');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAvailableNode, setSelectedAvailableNode] = useState('');
  const [selectedRequestNode, setSelectedRequestNode] = useState('');

  const API_BASE_URL = useMemo(() => {
    return process.env.NODE_ENV === 'production'
      ? `https://${process.env.REACT_APP_API_URL}`
      : 'http://localhost:8000';
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const reportData = {
      reportType,
      name: name || 'Anonymous',
      email,
      description,
      selectedNode: selectedAvailableNode || selectedRequestNode || 'None'
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Report sent successfully!', {
          description: `Your ${reportType} report has been submitted. Report ID: #${result.report_id}`,
          icon: <CheckCircle className="w-5 h-5" />,
          duration: 4000,
        });
        setTimeout(() => onClose(), 1000);
      } else {
        throw new Error(result.error || 'Failed to send report');
      }
    } catch (error) {
      if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
        toast.error('Connection Error', {
          description: 'Cannot connect to server.',
          icon: <XCircle className="w-5 h-5" />,
          duration: 5000,
        });
      } else {
        toast.error('Failed to send report', {
          description: 'Something went wrong. Please try again.',
          icon: <XCircle className="w-5 h-5" />,
          duration: 5000,
        });
      }
    }
    setIsSubmitting(false);
  }, [reportType, description, email, name, selectedAvailableNode, selectedRequestNode, onClose, API_BASE_URL]);

  const handleAvailableNodeSelect = useCallback((node) => {
    setSelectedAvailableNode(node);
  }, []);

  const handleRequestNodeSelect = useCallback((node) => {
    setSelectedRequestNode(node);
  }, []);

  const handleReportTypeChange = useCallback((type) => {
    setReportType(type);
    setSelectedAvailableNode('');
    setSelectedRequestNode('');
  }, []);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const isFormValid = useMemo(() => {
    const baseValid = description.trim() && email.trim();
    const nodeValid = reportType !== 'bug' || selectedAvailableNode;
    return baseValid && nodeValid;
  }, [description, email, reportType, selectedAvailableNode]);

  const reportTypeButtons = useMemo(() => [
    { type: 'bug', icon: Bug, label: 'Bug Report', color: 'red', desc: 'Something is broken' },
    { type: 'feature', icon: AlertTriangle, label: 'Feature Request', color: 'blue', desc: 'Request new node' },
    { type: 'feedback', icon: MessageSquare, label: 'General Feedback', color: 'green', desc: 'Share your thoughts' }
  ], []);

  const currentReportType = useMemo(() => {
    return reportTypeButtons.find(btn => btn.type === reportType);
  }, [reportTypeButtons, reportType]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex overflow-hidden transform transition-all duration-200 scale-100">
        
        <div className="flex-1 flex flex-col">
          <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Submit Report</h1>
                <p className="text-gray-600">Help us improve by reporting issues or requesting features</p>
              </div>
              <button 
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-150"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="flex-1 p-8 overflow-y-auto">
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">What type of report is this?</h2>
              <div className="grid grid-cols-3 gap-4">
                {reportTypeButtons.map(({ type, icon, label, color, desc }) => (
                  <ReportTypeCard
                    key={type}
                    type={type}
                    icon={icon}
                    label={label}
                    color={color}
                    desc={desc}
                    isSelected={reportType === type}
                    onClick={() => handleReportTypeChange(type)}
                  />
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name <span className="text-gray-400">(Optional)</span>
                  </label>
                  <div className="relative group">
                    <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors duration-150 group-focus-within:text-blue-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-150 hover:border-gray-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors duration-150 group-focus-within:text-blue-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-150 hover:border-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    reportType === 'bug' 
                      ? "Describe the bug you encountered. Include steps to reproduce if possible..."
                      : reportType === 'feature'
                      ? "Describe the feature you'd like to see and why it would be helpful..."
                      : "Share your feedback, suggestions, or general comments..."
                  }
                  required
                  rows={6}
                  maxLength={1000}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all duration-150 hover:border-gray-400"
                />
                <div className="absolute bottom-3 right-3 text-sm text-gray-400 bg-white px-2 rounded">
                  {description.length}/1000
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 border-t border-gray-100 bg-gray-50">
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-150 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl text-white font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 ${
                  currentReportType?.type === 'bug' 
                    ? 'bg-red-600 hover:bg-red-700' :
                  currentReportType?.type === 'feature' 
                    ? 'bg-blue-600 hover:bg-blue-700' :
                    'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="w-80 bg-gray-50 border-l border-gray-200 overflow-y-auto">
          <div className="p-6">
            {reportType === 'bug' && (
              <div className="animate-in fade-in duration-200">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-1">Select Affected Node</h3>
                  <p className="text-sm text-gray-600">Which node is experiencing issues?</p>
                  {!selectedAvailableNode && (
                    <p className="text-xs text-red-500 mt-1">* Required for bug reports</p>
                  )}
                </div>
                
                <div className="space-y-6">
                  {Object.entries(AVAILABLE_NODES).map(([category, nodes]) => (
                    <div key={category}>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        {category}
                        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                          {nodes.length}
                        </span>
                      </h4>
                      <div className="space-y-2">
                        {nodes.map(node => (
                          <NodeCard
                            key={node}
                            node={node}
                            tab={category}
                            isSelected={selectedAvailableNode === node}
                            onSelect={() => handleAvailableNodeSelect(node)}
                            color="red"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reportType === 'feature' && (
              <div className="animate-in fade-in duration-200">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-1">Request a Node</h3>
                  <p className="text-sm text-gray-600">Which node would you like to see added?</p>
                </div>
                
                <div className="space-y-6 max-h-96 overflow-y-auto">
                  {Object.entries(NOT_AVAILABLE_NODES).map(([category, nodes]) => (
                    <div key={category}>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 sticky top-0 bg-gray-50 py-1 flex items-center gap-2">
                        {category}
                        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                          {nodes.length}
                        </span>
                      </h4>
                      <div className="space-y-2">
                        {nodes.map(node => (
                          <NodeCard
                            key={node}
                            node={node}
                            tab={category}
                            isSelected={selectedRequestNode === node}
                            onSelect={() => handleRequestNodeSelect(node)}
                            color="blue"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reportType === 'feedback' && (
              <div className="text-center py-12 animate-in fade-in duration-200">
                <MessageSquare className="w-16 h-16 text-green-300 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">General Feedback</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Share your thoughts about the platform, user experience, or any suggestions for improvement.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

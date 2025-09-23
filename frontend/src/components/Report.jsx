import React, { useState, useCallback, useMemo } from 'react';
import { X, Send, AlertTriangle, Bug, MessageSquare, UserCircle, Mail, CheckCircle } from 'lucide-react';
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
  <button
    onClick={onClick}
    className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
      isSelected 
        ? `border-${color}-400 bg-${color}-50 shadow-md` 
        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
    }`}
  >
    <div className="text-center">
      <div className={`inline-flex p-3 rounded-lg mb-2 ${isSelected ? `bg-${color}-100` : 'bg-gray-100'}`}>
        <Icon className={`w-5 h-5 ${isSelected ? `text-${color}-600` : 'text-gray-500'}`} />
      </div>
      <div className={`font-semibold text-sm mb-1 ${isSelected ? `text-${color}-900` : 'text-gray-900'}`}>
        {label}
      </div>
      <div className="text-xs text-gray-600">{desc}</div>
    </div>
  </button>
));

const NodeCard = React.memo(({ node, tab, isSelected, onSelect, color }) => (
  <button
    onClick={onSelect}
    className={`w-full p-3 rounded-lg border transition-all duration-150 text-left ${
      isSelected 
        ? `border-${color}-300 bg-${color}-50 shadow-sm` 
        : 'border-gray-200 bg-white hover:border-gray-300'
    }`}
  >
    <div className="flex items-center gap-3">
      <div className={`w-2.5 h-2.5 rounded-full ${isSelected ? `bg-${color}-500` : 'bg-gray-300'}`} />
      <div>
        <div className={`font-medium text-sm ${isSelected ? `text-${color}-900` : 'text-gray-900'}`}>
          {node}
        </div>
        <div className="text-xs text-gray-500">{tab}</div>
      </div>
    </div>
  </button>
));

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const ReportPopup = ({ onClose }) => {
  const [reportType, setReportType] = useState('bug');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAvailableNode, setSelectedAvailableNode] = useState('');
  const [selectedRequestNode, setSelectedRequestNode] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleEmailChange = useCallback((e) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(value && !validateEmail(value) ? 'Invalid email' : '');
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      toast.error('Invalid Email');
      return;
    }

    setIsSubmitting(true);

    const reportId = Date.now().toString();
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const emailMessage = `
Hello,

You have received a new ${reportType} report from Visual Node Editor.

Report Details:
- Report ID: #${reportId}
- Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}
- Submitted: ${timestamp}

Reporter Information:
- Name: ${name || 'Anonymous'}
- Email: ${email}
- Component: ${selectedAvailableNode || selectedRequestNode || 'Not specified'}

Description:
${description}

To respond, simply reply to this email.

Best regards,
Visual Node Editor Team
    `;

    const formData = new FormData();
    formData.append('access_key', '955f7131-2354-4a9a-8c4c-f1150e4eac31');
    formData.append('name', name || 'Anonymous');
    formData.append('email', email);
    formData.append('subject', `Visual Node Editor - ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report #${reportId}`);
    formData.append('message', emailMessage);
    formData.append('from_name', 'Visual Node Editor');
    formData.append('replyto', email);

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Report sent successfully!', {
          description: `Report ID: #${reportId}`,
          icon: <CheckCircle className="w-4 h-4" />,
        });
        setTimeout(() => onClose(), 800);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Report submission error:', error);
      toast.error('Failed to send report', {
        description: 'Please try again later.',
        icon: <X className="w-4 h-4" />,
      });
    }
    setIsSubmitting(false);
  }, [reportType, description, email, name, selectedAvailableNode, selectedRequestNode, onClose]);

  const handleReportTypeChange = useCallback((type) => {
    setReportType(type);
    setSelectedAvailableNode('');
    setSelectedRequestNode('');
  }, []);

  const isFormValid = useMemo(() => {
    const baseValid = description.trim() && email.trim() && validateEmail(email);
    const nodeValid = reportType !== 'bug' || selectedAvailableNode;
    return baseValid && nodeValid;
  }, [description, email, reportType, selectedAvailableNode]);

  const reportTypeButtons = useMemo(() => [
    { type: 'bug', icon: Bug, label: 'Bug Report', color: 'red', desc: 'Report issue' },
    { type: 'feature', icon: AlertTriangle, label: 'Feature Request', color: 'blue', desc: 'Request feature' },
    { type: 'feedback', icon: MessageSquare, label: 'Feedback', color: 'green', desc: 'Share thoughts' }
  ], []);

  const currentReportType = useMemo(() => {
    return reportTypeButtons.find(btn => btn.type === reportType);
  }, [reportTypeButtons, reportType]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex overflow-hidden">
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Submit Report</h1>
                <p className="text-sm text-gray-600">Help us improve the platform</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Report Type */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Report Type</label>
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

            {/* Contact Info */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Contact Information</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name (optional)"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${emailError ? 'text-red-400' : 'text-gray-400'}`} />
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="your@email.com *"
                    required
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 outline-none transition-colors ${
                      emailError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {emailError && <div className="text-xs text-red-500 mt-1 pl-1">{emailError}</div>}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Description *</label>
              <div className="relative">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={`Describe your ${reportType} in detail...`}
                  required
                  rows={5}
                  maxLength={1000}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-colors"
                />
                <div className="absolute bottom-3 right-3 text-sm text-gray-400 bg-white px-2 rounded">
                  {description.length}/1000
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gradient-to-r from-gray-50 to-slate-50 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm text-white rounded-lg font-medium transition-all disabled:opacity-50 hover:shadow-lg ${
                currentReportType?.type === 'bug' ? 'bg-red-600 hover:bg-red-700' :
                currentReportType?.type === 'feature' ? 'bg-blue-600 hover:bg-blue-700' :
                'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Report
                </>
              )}
            </button>
          </div>
        </div>

        {/* Fixed Sidebar */}
        <div className="w-80 bg-gradient-to-b from-slate-50 to-gray-100 border-l border-gray-200 flex flex-col">
          {/* Fixed Header */}
          <div className="p-5 border-b border-gray-200">
            {reportType === 'bug' && (
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Select Affected Node</h3>
                <p className="text-sm text-gray-600">Which node has issues?</p>
                {!selectedAvailableNode && <p className="text-xs text-red-500 mt-1 font-medium">* Required for bug reports</p>}
              </div>
            )}
            {reportType === 'feature' && (
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Request a Node</h3>
                <p className="text-sm text-gray-600">What would you like?</p>
              </div>
            )}
            {reportType === 'feedback' && (
              <div>
                <h3 className="font-bold text-gray-900 mb-1">General Feedback</h3>
                <p className="text-sm text-gray-600">Share your thoughts</p>
              </div>
            )}
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {reportType === 'bug' && (
              <div className="space-y-5">
                {Object.entries(AVAILABLE_NODES).map(([category, nodes]) => (
                  <div key={category}>
                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      {category}
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
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
                          onSelect={() => setSelectedAvailableNode(node)}
                          color="red"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {reportType === 'feature' && (
              <div className="space-y-5">
                {Object.entries(NOT_AVAILABLE_NODES).map(([category, nodes]) => (
                  <div key={category}>
                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      {category}
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
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
                          onSelect={() => setSelectedRequestNode(node)}
                          color="blue"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {reportType === 'feedback' && (
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-8 rounded-2xl">
                  <MessageSquare className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Share your thoughts about the platform, user experience, or suggestions for improvement.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

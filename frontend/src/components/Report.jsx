import React, { useState, useCallback, useMemo } from 'react';
import { X, Send, Bug, AlertTriangle, MessageSquare, UserCircle, Mail, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import emailjs from 'emailjs-com';

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
    className={`w-full p-4 rounded-lg border text-left transition-colors ${
      isSelected 
        ? `border-${color}-300 bg-${color}-50 ring-1 ring-${color}-200` 
        : 'border-gray-200 bg-white hover:border-gray-300'
    }`}
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded ${isSelected ? `bg-${color}-100` : 'bg-gray-100'}`}>
        <Icon className={`w-5 h-5 ${isSelected ? `text-${color}-600` : 'text-gray-600'}`} />
      </div>
      <div>
        <div className={`font-semibold text-sm ${isSelected ? `text-${color}-900` : 'text-gray-900'}`}>
          {label}
        </div>
        <div className="text-xs text-gray-500">{desc}</div>
      </div>
    </div>
  </button>
));

const NodeCard = React.memo(({ node, tab, isSelected, onSelect, color }) => (
  <button
    onClick={onSelect}
    className={`w-full p-3 rounded border text-left transition-colors ${
      isSelected 
        ? `border-${color}-200 bg-${color}-50` 
        : 'border-gray-200 bg-white hover:border-gray-300'
    }`}
  >
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${isSelected ? `bg-${color}-500` : 'bg-gray-300'}`} />
      <div>
        <div className={`font-medium text-xs ${isSelected ? `text-${color}-900` : 'text-gray-900'}`}>
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

    const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID;
    const ownerTemplateId = process.env.REACT_APP_EMAILJS_OWNER_TEMPLATE_ID;
    const autoReplyTemplateId = process.env.REACT_APP_EMAILJS_AUTOREPLY_TEMPLATE_ID;
    const userId = process.env.REACT_APP_EMAILJS_USER_ID;

    if (!serviceId || !ownerTemplateId || !autoReplyTemplateId || !userId) {
      toast.error('Service unavailable');
      return;
    }

    setIsSubmitting(true);

    const reportId = Date.now().toString();
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const ownerTemplateParams = {
      report_type: reportType.toUpperCase(),
      report_id: reportId,
      user_name: name || 'Anonymous',
      user_email: email,
      description: description,
      selected_node: selectedAvailableNode || selectedRequestNode || 'Not specified',
      timestamp: timestamp,
      type_color: reportType === 'bug' ? '#dc2626' : reportType === 'feature' ? '#2563eb' : '#16a34a',
      priority_level: reportType === 'bug' ? 'HIGH' : reportType === 'feature' ? 'MEDIUM' : 'LOW',
      priority_color: reportType === 'bug' ? '#dc2626' : reportType === 'feature' ? '#2563eb' : '#16a34a'
    };

    const autoReplyParams = {
      user_name: name || 'User',
      user_email: email,
      report_type: reportType,
      report_id: reportId,
      selected_node: selectedAvailableNode || selectedRequestNode || 'Not specified',
      timestamp: timestamp,
      description: description
    };

    try {
      await emailjs.send(serviceId, ownerTemplateId, ownerTemplateParams, userId);
      await emailjs.send(serviceId, autoReplyTemplateId, autoReplyParams, userId);
      
      toast.success('Report sent successfully', {
        description: `ID: ${reportId}`,
        icon: <CheckCircle className="w-4 h-4" />,
      });
      setTimeout(() => onClose(), 800);
      
    } catch (error) {
      toast.error('Failed to send report');
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
    { type: 'bug', icon: Bug, label: 'Bug Report', color: 'red', desc: 'Technical issue' },
    { type: 'feature', icon: AlertTriangle, label: 'Feature Request', color: 'blue', desc: 'New functionality' },
    { type: 'feedback', icon: MessageSquare, label: 'Feedback', color: 'green', desc: 'General input' }
  ], []);

  const currentReportType = useMemo(() => {
    return reportTypeButtons.find(btn => btn.type === reportType);
  }, [reportTypeButtons, reportType]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl h-[80vh] flex overflow-hidden">
        
        <div className="flex-1 flex flex-col">
          <div className="px-5 py-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-gray-900">Submit Report</h1>
                <p className="text-sm text-gray-600">Help us to improve</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="flex-1 p-5 overflow-y-auto">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Report Type</label>
                <div className="grid grid-cols-3 gap-3">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${emailError ? 'text-red-400' : 'text-gray-400'}`} />
                    <input
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="your@email.com"
                      required
                      className={`w-full pl-9 pr-3 py-3 border rounded-lg focus:ring-2 outline-none ${
                        emailError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    />
                  </div>
                  {emailError && <p className="text-xs text-red-600 mt-1">{emailError}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={`Describe your ${reportType} clearly and concisely...`}
                    required
                    rows={4}
                    maxLength={1000}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white px-2 rounded">
                    {description.length}/1000
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 border-t bg-gray-50 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className={`flex items-center gap-2 px-6 py-2 text-white rounded-lg font-medium disabled:opacity-50 ${
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
                  Submit
                </>
              )}
            </button>
          </div>
        </div>

        <div className="w-72 bg-gray-50 border-l flex flex-col">
          <div className="p-4 border-b">
            {reportType === 'bug' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Affected Node</h3>
                <p className="text-xs text-gray-600">Select the problematic component</p>
                {!selectedAvailableNode && <p className="text-xs text-red-500 mt-1">* Required</p>}
              </div>
            )}
            {reportType === 'feature' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Request Node</h3>
                <p className="text-xs text-gray-600">Choose desired functionality</p>
              </div>
            )}
            {reportType === 'feedback' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">General Feedback</h3>
                <p className="text-xs text-gray-600">Share your thoughts</p>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {reportType === 'bug' && (
              <div className="space-y-4">
                {Object.entries(AVAILABLE_NODES).map(([category, nodes]) => (
                  <div key={category}>
                    <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
                      {category}
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                        {nodes.length}
                      </span>
                    </h4>
                    <div className="space-y-1">
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
              <div className="space-y-4">
                {Object.entries(NOT_AVAILABLE_NODES).map(([category, nodes]) => (
                  <div key={category}>
                    <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
                      {category}
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                        {nodes.length}
                      </span>
                    </h4>
                    <div className="space-y-1">
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
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-600">No additional selection needed</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, ExternalLink, AlertTriangle, Globe, ArrowRight, X } from 'lucide-react';

export const DeviceAndLinkCheck = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isVercelLink, setIsVercelLink] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent.toLowerCase());
      const screenWidth = window.innerWidth;
      
      return isMobileDevice || isTablet || screenWidth <= 1024;
    };

    const checkVercelLink = () => {
      const hostname = window.location.hostname;
      return hostname.includes('.vercel.app') || hostname.includes('.vercel.com')  ||  hostname.includes('localhost');
    };

    setIsMobile(checkDevice());
    setIsVercelLink(checkVercelLink());
  }, []);

  const handleRedirect = () => {
    setIsRedirecting(true);
    const productionUrl = 'https://your-production-domain.com';
    window.open(productionUrl, '_blank');
  };

  // Mobile Block Screen
  if (isMobile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-full max-w-sm mx-auto">
          
          {/* Card */}
          <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
            
            {/* Header */}
            <div className="px-6 py-8 text-center border-b">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Monitor className="w-6 h-6 text-slate-600" />
              </div>
              <h1 className="text-lg font-semibold text-slate-900 mb-2">Desktop Required</h1>
              <p className="text-sm text-slate-600">This application is designed for desktop use only</p>
            </div>
            
            {/* Content */}
            <div className="px-6 py-6">
              <div className="space-y-4">
                
                {/* Current Device */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Smartphone className="w-4 h-4 text-slate-500" />
                  <div>
                    <div className="text-sm font-medium text-slate-700">Mobile Device Detected</div>
                    <div className="text-xs text-slate-500">Screen: {window.innerWidth}px</div>
                  </div>
                </div>
                
                {/* Requirements */}
                <div className="text-sm">
                  <div className="font-medium text-slate-700 mb-2">System Requirements:</div>
                  <ul className="space-y-1 text-slate-600">
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                      Desktop or laptop computer
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                      Minimum 1024px screen width
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                      Modern web browser
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="text-center mt-4">
            <p className="text-xs text-slate-500">Please switch to a desktop device to continue</p>
          </div>
        </div>
      </div>
    );
  }

  // Vercel Warning Screen
  if (isVercelLink) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          
          {/* Main Card */}
          <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
            
            {/* Header */}
            <div className="px-6 py-6 text-center border-b">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <h1 className="text-lg font-semibold text-slate-900 mb-2">Preview Mode</h1>
              <p className="text-sm text-slate-600">Limited functionality available</p>
            </div>
            
            {/* Content */}
            <div className="px-6 py-6 space-y-6">
              
              {/* Current URL */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Current URL</span>
                </div>
                <div className="text-xs font-mono text-slate-600 bg-slate-50 p-2 rounded border break-all">
                  {window.location.hostname}
                </div>
              </div>
              
              {/* Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  You're using a Vercel preview deployment. Backend features and AI processing are disabled.
                </p>
              </div>
              
              {/* Features Comparison */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-slate-700">Available Features:</div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-2">
                    <div className="font-medium text-slate-600">Preview Mode</div>
                    <div className="space-y-1 text-slate-500">
                      <div className="flex items-center gap-2">
                        <X className="w-3 h-3 text-red-500" />
                        <span>No backend</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <X className="w-3 h-3 text-red-500" />
                        <span>No AI processing</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <X className="w-3 h-3 text-red-500" />
                        <span>Limited features</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="font-medium text-slate-600">Production Mode</div>
                    <div className="space-y-1 text-slate-500">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Full backend</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>AI enabled</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>All features</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t space-y-3">
              <button
                onClick={handleRedirect}
                disabled={isRedirecting}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-lg hover:bg-slate-800 transition-colors font-medium disabled:opacity-50 text-sm"
              >
                {isRedirecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Opening...</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Production App</span>
                    <ArrowRight className="w-3 h-3" />
                  </>
                )}
              </button>
              
              <button 
                onClick={() => setIsVercelLink(false)}
                className="w-full text-xs text-slate-500 hover:text-slate-700 py-2"
              >
                Continue with preview mode
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default DeviceAndLinkCheck;

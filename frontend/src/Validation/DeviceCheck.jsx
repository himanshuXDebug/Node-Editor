import React, { useState, useEffect } from 'react';
import { Monitor, Eye, Zap, Link } from 'lucide-react';

export const DeviceAndLinkCheck = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isVercelLink, setIsVercelLink] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

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
      return hostname.includes('.vercel.app') || hostname.includes('.vercel.com') || hostname.includes('localhost');
    };

    const updateStates = () => {
      setIsMobile(checkDevice());
      setIsVercelLink(checkVercelLink());
      setCurrentUrl(window.location.href);
    };

    updateStates();
    const handleResize = () => {
      setIsMobile(checkDevice());
    };

    window.addEventListener('resize', handleResize);

    window.addEventListener('orientationchange', () => {
      setTimeout(handleResize, 100);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const handleRedirect = () => {
     setIsRedirecting(true);
    window.location.href = 'https://visual-node-editor.up.railway.app/';
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border rounded-lg p-6 max-w-sm w-full text-center">
          <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Desktop Required</h1>
          <p className="text-gray-600 mb-4">This app works best on desktop devices</p>
          
          <div className="mb-4 p-3 bg-gray-50 rounded border text-left">
            <div className="flex items-center gap-2 mb-2">
              <Link className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">You are here:</span>
            </div>
            <div className="text-xs font-mono bg-gray-400 text-gray-600 break-all">
              {currentUrl}
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            Screen width: {window.innerWidth}px (minimum: 1024px)
          </div>
        </div>
      </div>
    );
  }

  if (isVercelLink) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border rounded-lg p-6 max-w-lg w-full">
          
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Visual Node Editor</h1>
            <p className="text-gray-600">Choose your experience</p>
          </div>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Link className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">You are here with:</span>
            </div>
            <div className="text-sm font-mono text-blue-800 break-all mb-2">
              {currentUrl}
            </div>
            <p className="text-xs text-blue-700">
              This URL is only for preview - limited functionality available
            </p>
          </div>

          <div className="space-y-4 mb-6">
            
            <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-gray-900">Preview Mode</h3>
                <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">Current</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Frontend-only version for design exploration. Perfect if you just want to see the project interface.
              </p>
              <div className="text-xs text-gray-500">
                ✓ UI Preview • ✗ No Backend • ✗ No AI Processing
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-gray-900">Production Mode</h3>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Full App</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Complete application with backend and AI processing. Use this for actual workflow automation.
              </p>
              <div className="text-xs text-gray-500">
                ✓ Full Features • ✓ Backend API • ✓ AI Processing
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRedirect}
              className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >Open Production App</button>
            
            <button 
              onClick={() => setIsVercelLink(false)}
              className="w-full text-gray-600 py-3 hover:text-gray-800 transition-colors"
            >
              Continue with Preview Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default DeviceAndLinkCheck;

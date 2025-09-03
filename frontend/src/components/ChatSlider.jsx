import React, { useEffect, useRef } from 'react';

export function ChatSlider({ visible, onClose }) {
  const panelRef = useRef(null);

  // Scrolls to bottom when visible or new messages are added.
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = panelRef.current.scrollHeight;
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div 
      ref={panelRef}
      className="fixed top-0 right-0 h-full w-96 bg-white shadow-lg border-l z-50 flex flex-col transition-transform duration-300"
      style={{ transform: visible ? 'translateX(0)' : 'translateX(100%)' }}
    >
      <div className="flex justify-between items-center border-b p-4">
        <h2 className="text-lg font-semibold">Chatbot</h2>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-900 font-bold">×</button>
      </div>
      <div className="flex-grow p-4 overflow-auto">
        {/* Messages will be rendered here later */}
        <p className="text-gray-500 text-center">Conversation will appear here.</p>
      </div>
      <div className="p-4 border-t">
        <input
          type="text"
          placeholder="Type your message..."
          className="w-full border px-3 py-2 rounded outline-none"
          disabled
        />
      </div>
    </div>
  );
}

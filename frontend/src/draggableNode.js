const toast = {
  error: (message) => {
    const el = document.createElement("div");
    el.className =
      "fixed top-4 right-4 bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-xl shadow-lg z-50 text-sm font-semibold transition-all duration-300";
    el.textContent = message;
    document.body.appendChild(el);

    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateX(100%)";
      setTimeout(() => el.remove(), 300);
    }, 3000);
  }
};

const availableNodes = [
  "customInput",
  "customOutput",
  "gemini",
  "text",
  "uppercase",
  "lowercase",
  "Image",
  "Download",
  "palette",
  "pipeline",
  "agent", 
  "transform",
  "knowledge",
  "document",
  "Openai",
  "anthropic",
  "aws",
  "google",
  "webhook",
  "condition",
  "loop",
  "database",
  "chatbot",
  "response"
];

export const DraggableNode = ({
  type,
  label,
  icon: Icon,
  iconColor = "text-white",
  compact = false
}) => {
  const isAvailable = availableNodes.includes(type);

  const handleDragStart = (event) => {
    if (!isAvailable) {
      event.preventDefault();
      toast.error(`${label} node not available yet`);
      return;
    }

    const payload = JSON.stringify({ nodeType: type });
    
    // Set data in multiple formats to ensure compatibility
    event.dataTransfer.setData("application/reactflow", payload);
    event.dataTransfer.setData("text/plain", payload);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleClick = () => {
    if (!isAvailable) {
      toast.error(`${label} node not available yet`);
    }
  };

  const handleDragEnd = (event) => {
    // Clean up any drag state if needed
    event.dataTransfer.clearData();
  };

  return (
    <div
      draggable={isAvailable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      className={`group flex flex-col items-center justify-center min-w-[100px] h-20 rounded-xl border-2 border-blue-500 select-none 
     bg-gradient-to-br from-purple-400/10 to-purple-600/20 transition-all duration-200
        ${isAvailable
          ? "bg-white/90 border-gray-200/60 cursor-grab hover:bg-white hover:border-green-700 hover:shadow-lg active:cursor-grabbing active:scale-95"
          : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      style={{ userSelect: "none" }}
    >
      <div className={`p-3 rounded-lg transition-all duration-200  ${
        isAvailable 
          ? "bg-gradient-to-br from-blue-800/10 to-white shadow-sm group-hover:shadow-md" 
          : "bg-gray-900"
      }`}>
        <Icon 
          className={`h-4 w- transition-transform duration-200   ${
            isAvailable 
              ? `${iconColor} group-hover:scale-110` 
              : "text-gray-400"
          }`} 
        />
      </div>
      <span className={`text-xs font-semibold mt-2 text-center px-2 ${
        isAvailable ? "text-gray-700" : "text-gray-400"
      }`}>
        {label}
      </span>
    </div>
  );
};

import { toast } from 'sonner';

const availableNodes = [
  "customInput",
  "customOutput", 
  "gemini",
  "text",
 "condition"
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
    event.dataTransfer.setData("application/reactflow", payload);
    event.dataTransfer.setData("text/plain", payload);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleClick = () => {
    if (!isAvailable) {
      toast.error(`${label} node not available yet`);
    }
  };

  return (
    <div
      draggable={isAvailable}
      onDragStart={handleDragStart}
      onClick={handleClick}
      className={`group flex flex-col items-center justify-center min-w-[100px] h-20 rounded-xl border-2 select-none 
        bg-gradient-to-br from-purple-400/10 to-purple-600/20 transition-all duration-200
        ${isAvailable
          ? "border-gray-200/60 cursor-grab hover:bg-white hover:border-green-700 hover:shadow-lg active:cursor-grabbing active:scale-95"
          : "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed opacity-60"
        }`}
      style={{ userSelect: "none" }}
    >
      <div className={`p-3 rounded-lg transition-all duration-200 ${
        isAvailable 
          ? "bg-gradient-to-br from-blue-800/10 to-white shadow-sm group-hover:shadow-md" 
          : "bg-gray-200"
      }`}>
        <Icon 
          className={`h-4 w-4 transition-transform duration-200 ${
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
import { useState } from "react";
import {
  Sparkles,
  Settings,
  TextCursorInput,
  Image,
  ArrowUpDown,
  Type,
  Brain,
  FileText,
  Download,
  Palette,
} from "lucide-react";
import { DraggableNode } from "../draggableNode";

const Section = ({ title, icon: Icon, children }) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-white/40 backdrop-blur-sm border border-slate-200/60 rounded-xl p-3 shadow-sm hover:shadow-lg transition-all duration-300">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-[11px] font-bold text-slate-700 mb-3 hover:text-slate-900 transition-colors duration-200"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <span className="uppercase tracking-wider font-semibold">{title}</span>
        </div>
        <ArrowUpDown
          className={`w-3.5 h-3.5 transition-transform duration-300 text-slate-500 ${open ? "rotate-180" : "rotate-0"}`}
        />
      </button>
      {open && (
        <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

export default function Sidebar() {
  return (
    <aside className="w-64 shrink-0 bg-gradient-to-b from-slate-50/80 to-white/90 backdrop-blur-sm border-r border-slate-200/60 p-4 overflow-y-auto shadow-xl">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-slate-200/50">
        <h1 className="text-sm font-bold text-slate-800 mb-1">Node Library</h1>
        <p className="text-xs text-slate-500">Drag nodes to build your flow</p>
      </div>

      <div className="space-y-4">
        <Section title="Basic" icon={Settings}>
          <DraggableNode type="customInput" label="Input" icon={Type} />
          <DraggableNode type="customOutput" label="Output" icon={Type} />
        </Section>

        <Section title="AI & ML" icon={Brain}>
          <DraggableNode type="llm" label="LLM" icon={Sparkles} />
        </Section>

        <Section title="Text Processing" icon={TextCursorInput}>
          <DraggableNode type="text" label="Text" icon={FileText} />
          <DraggableNode type="uppercase" label="Uppercase" icon={Type} />
          <DraggableNode type="lowercase" label="Lowercase" icon={Type} />
        </Section>


        <Section title="Media & Files" icon={Image}>
          <DraggableNode type="Image" label="Image" icon={Image} />
          <DraggableNode type="Download" label="Download" icon={Download} />
        </Section>

        <Section title="Utilities" icon={Settings}>
          <DraggableNode type="palette" label="Color" icon={Palette}/>
        </Section>
      </div>

      <style jsx>{`
        @keyframes slide-in-from-top-2 {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-in {
          animation: slide-in-from-top-2 0.2s ease-out;
        }
        
        /* Custom scrollbar */
        aside::-webkit-scrollbar {
          width: 6px;
        }
        aside::-webkit-scrollbar-track {
          background: transparent;
        }
        aside::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 3px;
        }
        aside::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }
      `}</style>
    </aside>
  );
}
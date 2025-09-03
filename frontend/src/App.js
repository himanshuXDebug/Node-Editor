import { useState } from "react";
import { useStore } from "./store";
import Header from "./components/Header";
import { PipelineUI } from "./ui";
import { handleSubmit } from "./submit";
import { RunPanel } from "./components/RunPanel";
// import Sidebar from './components/Sidebar';

function App() {
  const [popup, setPopup] = useState({ visible: false, content: "" });

  const onReset = () => {
    useStore.setState({ nodes: [], edges: [] });
  };

  const onSubmit = () => {
    handleSubmit(setPopup);
  };

  return (
    <div className="h-screen flex flex-col from:bg-gray-50 to:bg-blue-600 ">
      <Header onReset={onReset} onSubmit={onSubmit} />

      <div className="flex flex-1 overflow-hidden">
        {/* <Sidebar /> */}
        <main className="flex-grow p-4 overflow-auto">
          <PipelineUI />
        </main>
        <RunPanel />
      </div>

      {popup.visible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full text-gray-800 relative">
            <button
              onClick={() => setPopup({ visible: false, content: "" })}
              className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 text-xl"
            >
              &times;
            </button>
            <pre className="whitespace-pre-wrap text-sm">{popup.content}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

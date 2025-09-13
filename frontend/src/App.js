import { useState } from "react";
import { useStore } from "./store";
import Header from "./components/Header";
import { PipelineUI } from "./ui";
import { handleSubmit } from "./submit";
import { RunPanel } from "./components/RunPanel";
import {DeviceAndLinkCheck} from "./Validation/DeviceCheck";
import { Toaster } from "sonner";
function App() {
  const [popup, setPopup] = useState({ visible: false, content: "" });

  const onReset = () => {
    useStore.setState({ nodes: [], edges: [] });
  };

  const onSubmit = () => {
    handleSubmit(setPopup);
  };

  return (
    <DeviceAndLinkCheck>
    <div className="h-screen flex flex-col from:bg-gray-50 to:bg-blue-600 ">
      <Header onReset={onReset} onSubmit={onSubmit} />
       <Toaster position="top-right" />
      <div className="flex flex-1 overflow-hidden">
        {/* <Sidebar /> */}
        <main className="flex-grow p-4 overflow-auto">
          <PipelineUI />
        </main>
        <RunPanel />
      </div>
    </div>
    </DeviceAndLinkCheck>
  );
}

export default App;

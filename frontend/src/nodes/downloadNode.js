import React, { useEffect, useState } from 'react';
import { useStore } from 'reactflow';
import { NodeBase } from '../components/NodeBase';
import { Download, Info, FileImage } from 'lucide-react';

export const DownloadNode = ({ id }) => {
  const nodeMap = useStore((s) => s.nodeInternals);
  const edges = useStore((s) => s.edges);

  const [format, setFormat] = useState('txt');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const inputNodeId = edges.find((e) => e.target === id)?.source;
  const inputNode = inputNodeId ? nodeMap.get(inputNodeId) : null;

  useEffect(() => {
    if (inputNode && inputNode.data?.output) {
      const output = inputNode.data.output;
      if (/<img\s+src=/.test(output)) {
        setError('Image output is not supported in current formats.');
        setContent('');
      } else {
        setError('');
        setContent(output);
      }
    }
  }, [inputNode]);

  const handleDownload = () => {
    if (!content) return;

    let mime = 'text/plain';
    let ext = 'txt';

    if (format === 'pdf') {
      mime = 'application/pdf';
      ext = 'pdf';
    } else if (format === 'docx') {
      mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      ext = 'docx';
    }

    const blob = new Blob([content], { type: mime });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `download.${ext}`;
    link.click();
  };

  const inputHandles = [{ id: 'input', color: 'bg-green-600' }];
  const outputHandles = [];

  const leftPanel = (
    <div className="space-y-4 text-sm text-gray-700">
      <div className="flex items-center gap-2 font-semibold text-gray-800">
        <Download size={16} className="text-green-600" />
        Export Content
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">Select Format</label>
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white shadow focus:ring-2 focus:ring-green-500 focus:outline-none"
        >
          <option value="txt">Text (.txt)</option>
          <option value="pdf">PDF (.pdf)</option>
          <option value="docx">Word (.docx)</option>
        </select>
      </div>

      <button
        onClick={handleDownload}
        disabled={!content || !!error}
        className={`w-full py-2 font-semibold rounded-md transition text-sm shadow ${
          !content || error
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        Download Now
      </button>

      {error && (
        <div className="text-sm border border-red-300 bg-red-50 p-3 rounded-md text-red-700 font-medium shadow-inner">
          ⚠ {error}
        </div>
      )}
    </div>
  );

  const rightPanel = (
    <div className="space-y-5 text-sm text-gray-800">
      <div>
        <div className="flex items-center gap-2 font-semibold mb-2">
          <Info size={14} className="text-blue-600" />
          How to Use
        </div>
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-md shadow-inner leading-relaxed space-y-2 text-[13px]">
          <ul className="list-disc list-inside space-y-1">
            <li>
              Use <code>.txt</code> for simple text download.
            </li>
            <li>
              <code>.pdf</code> and <code>.docx</code> are supported for plain text only.
            </li>
            <li className="text-red-600 flex items-center gap-1 font-semibold">
              <FileImage size={14} />
              Image output is not supported.
            </li>
          </ul>
        </div>
      </div>

      <div>
        <div className="font-semibold mb-1">Connected Output</div>
        {inputNode ? (
          <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded shadow-sm">
            {inputNode.data?.title || inputNode.type || `Node ${inputNode.id}`}
          </div>
        ) : (
          <div className="italic text-gray-500">No node connected</div>
        )}
      </div>
    </div>
  );

  return (
    <NodeBase
      id={id}
      title="Download Node"
      layout="split"
      inputHandles={inputHandles}
      outputHandles={outputHandles}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
    />
  );
};

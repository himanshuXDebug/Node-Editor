import React, { useState, useEffect, useRef } from 'react';
import { Upload, Link } from 'lucide-react';
import { useVariableStore } from '../stores/variableStore';
import { NodeBase } from '../components/NodeBase';

export const ImageNode = ({ id, data, setNodes }) => {
  const [inputType, setInputType] = useState('file');
  const [imageURL, setImageURL] = useState(data?.image || '');
  const [variableName, setVariableName] = useState(data?.variableName || 'image');
  const [fileName, setFileName] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [response, setResponse] = useState('Ready to upload');
  const fileInputRef = useRef(null);
  const { setVariable } = useVariableStore();

  useEffect(() => {
    setNodes?.((prev) =>
      prev.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                variableName,
                image: imageURL,
                imageUrl: imageURL,
                type: 'image',
              },
            }
          : node
      )
    );

    if (variableName && imageURL) {
      setVariable(variableName, imageURL);
    }
  }, [variableName, imageURL, setNodes, id, setVariable]);

  const handleFileUpload = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setResponse('Error: Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageURL(event.target.result);
      setFileName(file.name);
      setResponse('Image uploaded successfully');
    };
    reader.onerror = () => setResponse('Error: Failed to read file');
    reader.readAsDataURL(file);
  };

  const handleUrlLoad = () => {
    if (!urlInput.trim()) return setResponse('Error: Please enter a URL');
    if (!urlInput.match(/^https?:\/\/.+/i)) {
      return setResponse('Error: Invalid URL format');
    }

    const img = new Image();
    img.onload = () => {
      setImageURL(urlInput);
      setFileName(urlInput.split('/').pop() || 'URL Image');
      setResponse('Image loaded from URL');
    };
    img.onerror = () => setResponse('Error: Could not load image from URL');
    img.src = urlInput;
  };

  const clearImage = () => {
    setImageURL('');
    setFileName('');
    setUrlInput('');
    setResponse('Ready to upload');
  };

  const leftPanel = (
    <div className="space-y-3">
      <div className="flex gap-1 p-1 bg-gray-100 rounded">
        <button
          onClick={() => setInputType('file')}
          className={`flex-1 px-3 py-1 rounded text-xs font-semibold transition-colors ${
            inputType === 'file'
              ? 'bg-white text-gray-900 shadow'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Upload className="w-3 h-3 inline mr-1" /> File
        </button>
        <button
          onClick={() => setInputType('url')}
          className={`flex-1 px-3 py-1 rounded text-xs font-semibold transition-colors ${
            inputType === 'url'
              ? 'bg-white text-gray-900 shadow'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Link className="w-3 h-3 inline mr-1" /> URL
        </button>
      </div>

      {inputType === 'file' && (
        <div className="flex gap-2">
          <button
            onClick={handleFileUpload}
            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2 text-sm"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
          <input
            type="text"
            placeholder="No file selected"
            value={fileName}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50"
          />
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {inputType === 'url' && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="https://example.com/image.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleUrlLoad()}
          />
          <button
            onClick={handleUrlLoad}
            className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          >
            Load
          </button>
        </div>
      )}

      {imageURL && (
        <div className="bg-gray-50 border border-gray-200 rounded p-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-gray-700">PREVIEW</span>
            <button onClick={clearImage} className="text-xs text-red-500 hover:text-red-700">
              Clear
            </button>
          </div>
          <img
            src={imageURL}
            alt="Preview"
            className="w-full max-h-32 object-contain rounded border border-gray-200"
            onError={() => setResponse('Error: Failed to display image')}
          />
        </div>
      )}
    </div>
  );

  const rightPanel = (
    <div className="space-y-3 text-xs text-gray-700">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Variable Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={variableName}
          onChange={(e) => setVariableName(e.target.value)}
          className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-400 focus:outline-none"
          placeholder="e.g. photo"
        />
        <p className="text-gray-500 mt-1">Use in TextNode: <code>{`{{${variableName}}}`}</code></p>
      </div>

      <div>
        <span className="font-semibold text-gray-700">Status</span>
        <div
          className={`mt-1 p-2 rounded border shadow-sm ${
            response.startsWith('Error')
              ? 'bg-red-50 border-red-200 text-red-700'
              : response.includes('success') || response.includes('loaded')
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}
        >
          {response}
        </div>
      </div>

      {imageURL && (
        <div>
          <span className="font-semibold text-gray-700">Image Info</span>
          <div className="p-2 bg-gray-50 border border-gray-200 rounded shadow-inner">
            <div><strong>Type:</strong> {imageURL.startsWith('data:') ? 'Uploaded File' : 'URL Image'}</div>
            <div className="truncate"><strong>Variable:</strong> {variableName}</div>
           
          </div>
        </div>
      )}

      <div className="border border-gray-300 rounded p-2 shadow-sm">
        <div className="text-xs font-semibold mb-1 text-gray-700">How to use:</div>
        <ol className="list-decimal list-inside space-y-1 text-gray-600">
          <li>Upload image or enter URL</li>
          <li>Set a variable name</li>
          <li>Connect to a TextNode</li>
          <li>Use <code>{`{{${variableName}}}`}</code> in TextNode</li>
        </ol>
      </div>
    </div>
  );

  return (
    <NodeBase
      id={id}
      title="Image Node"
      layout="split"
      outputHandles={[{ id: 'output', color: 'bg-purple-500' }]}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      setNodes={setNodes}
    />
  );
};

export default ImageNode;

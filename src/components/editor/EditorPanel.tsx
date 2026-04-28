import { Code, Eye, Terminal } from 'lucide-react';
import ResizeHandle from '../resize/ResizeHandle';

interface EditorPanelProps {
  codeSplitRatio: number;
  terminalHeight: number;
  onCodeSplitResize: (delta: number) => void;
  onTerminalResize: (delta: number) => void;
}

export default function EditorPanel({
  codeSplitRatio,
  terminalHeight,
  onCodeSplitResize,
  onTerminalResize,
}: EditorPanelProps) {
  const codeWidth = `${codeSplitRatio * 100}%`;
  const previewWidth = `${(1 - codeSplitRatio) * 100}%`;

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Code + Preview area */}
      <div className="flex-1 flex min-h-0">
        {/* Code editor */}
        <div style={{ width: codeWidth }} className="flex flex-col min-w-[100px]">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border-b border-gray-700">
            <Code size={14} className="text-gray-400" />
            <span className="text-xs text-gray-400">src/App.tsx</span>
          </div>
          <div className="flex-1 overflow-auto p-4 font-mono text-sm text-gray-300">
            <pre className="text-gray-500">
{`1  import React from 'react';
2  
3  function App() {
4    return (
5      <div className="app">
6        <h1>Hello World</h1>
7        <p>Edit this file to get started</p>
8      </div>
9    );
10 }
11
12 export default App;`}
            </pre>
          </div>
        </div>

        <ResizeHandle direction="horizontal" onResize={onCodeSplitResize} />

        {/* Preview */}
        <div style={{ width: previewWidth }} className="flex flex-col min-w-[100px]">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border-b border-gray-700">
            <Eye size={14} className="text-gray-400" />
            <span className="text-xs text-gray-400">Preview</span>
          </div>
          <div className="flex-1 bg-white flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Hello World</h1>
              <p className="text-gray-500">Edit this file to get started</p>
            </div>
          </div>
        </div>
      </div>

      <ResizeHandle direction="vertical" onResize={onTerminalResize} />

      {/* Terminal */}
      <div style={{ height: terminalHeight }} className="bg-gray-950 border-t border-gray-700 min-h-[50px]">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border-b border-gray-700">
          <Terminal size={14} className="text-gray-400" />
          <span className="text-xs text-gray-400">Terminal</span>
        </div>
        <div className="p-3 font-mono text-xs text-green-400 overflow-auto h-[calc(100%-32px)]">
          <div>$ npm run dev</div>
          <div className="text-gray-500">VITE v6.3.4 ready in 234 ms</div>
          <div className="text-gray-500">
            ➜ Local: <span className="text-cyan-400">http://localhost:5173/</span>
          </div>
          <div className="text-gray-500 mt-1">
            <span className="animate-pulse">▊</span>
          </div>
        </div>
      </div>
    </div>
  );
}

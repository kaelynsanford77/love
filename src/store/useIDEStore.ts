import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  FileNode,
  ChatMessage,
  RuntimeError,
  ConsoleEntry,
  NetworkRequest,
  NpmPackage,
  GitSnapshot,
  AccessibilityViolation,
  LighthouseScore,
  SubAgentResult,
  PreviewSize,
  Attachment,
} from '@/types';

// Default project files
const DEFAULT_APP_TSX = `import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4" data-component="App">
        <h1 className="text-3xl font-bold text-gray-900 mb-2" data-line="8">
          Welcome to Lovable ✨
        </h1>
        <p className="text-gray-600 mb-6" data-line="11">
          Start building your dream app with AI
        </p>
        <div className="flex items-center gap-4" data-line="14">
          <button
            onClick={() => setCount(c => c + 1)}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            data-line="16"
          >
            Count: {count}
          </button>
          <button
            onClick={() => setCount(0)}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            data-line="23"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}`;

const DEFAULT_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My App</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    import React from 'https://esm.sh/react@18';
    import ReactDOM from 'https://esm.sh/react-dom@18/client';
    import App from './App.tsx';
    ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
  </script>
</body>
</html>`;

interface IDEState {
  // File system
  files: FileNode[];
  activeFile: string | null;
  fileContents: Record<string, string>;

  // Editor
  clickToEditLine: number | null;
  hoveredElement: { path: string; line: number } | null;

  // Chat
  messages: ChatMessage[];
  isAiThinking: boolean;

  // Preview
  previewKey: number;
  previewSize: PreviewSize;
  showResponsiveComparison: boolean;
  shareableLink: string | null;

  // Runtime errors
  runtimeErrors: RuntimeError[];

  // Console & Network
  consoleEntries: ConsoleEntry[];
  networkRequests: NetworkRequest[];

  // Packages
  installedPackages: NpmPackage[];
  packageSearchResults: NpmPackage[];

  // Assets
  assets: { name: string; path: string; dataUrl: string }[];

  // Git / Undo
  snapshots: GitSnapshot[];
  currentSnapshotIndex: number;

  // Lighthouse & Accessibility
  lighthouseScore: LighthouseScore | null;
  accessibilityViolations: AccessibilityViolation[];

  // Sub-agents
  subAgentResults: SubAgentResult[];

  // Inspector panel
  activeInspectorTab: 'console' | 'network' | 'elements';

  // Bottom panel
  activeBottomPanel: 'inspector' | 'packages' | 'assets' | 'lighthouse' | 'accessibility' | 'agents' | null;

  // shadcn browser
  showShadcnBrowser: boolean;

  // Actions
  setActiveFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
  addFile: (path: string, content: string) => void;
  deleteFile: (path: string) => void;

  setClickToEditLine: (line: number | null) => void;
  setHoveredElement: (el: { path: string; line: number } | null) => void;

  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  setAiThinking: (v: boolean) => void;
  undoToMessage: (messageId: string) => void;

  refreshPreview: () => void;
  setPreviewSize: (size: PreviewSize) => void;
  toggleResponsiveComparison: () => void;
  generateShareableLink: () => void;

  addRuntimeError: (err: Omit<RuntimeError, 'id' | 'timestamp'>) => void;
  clearRuntimeErrors: () => void;

  addConsoleEntry: (entry: Omit<ConsoleEntry, 'id' | 'timestamp'>) => void;
  clearConsoleEntries: () => void;

  addNetworkRequest: (req: Omit<NetworkRequest, 'id' | 'timestamp'>) => void;
  clearNetworkRequests: () => void;

  searchPackages: (query: string) => void;
  installPackage: (name: string) => void;
  uninstallPackage: (name: string) => void;

  addAsset: (name: string, dataUrl: string) => void;
  removeAsset: (name: string) => void;

  takeSnapshot: (message: string) => void;
  restoreSnapshot: (id: string) => void;
  forkFromSnapshot: (id: string) => void;

  runLighthouseAudit: () => void;
  runAccessibilityCheck: () => void;

  runSubAgents: () => void;

  setActiveInspectorTab: (tab: 'console' | 'network' | 'elements') => void;
  setActiveBottomPanel: (panel: IDEState['activeBottomPanel']) => void;
  setShowShadcnBrowser: (v: boolean) => void;
}

// Mock NPM registry
const MOCK_PACKAGES: NpmPackage[] = [
  { name: 'axios', version: '1.6.7', description: 'Promise based HTTP client for the browser and node.js' },
  { name: 'date-fns', version: '3.3.1', description: 'Modern JavaScript date utility library' },
  { name: 'framer-motion', version: '11.0.3', description: 'A production-ready motion library for React' },
  { name: 'react-query', version: '3.39.3', description: 'Hooks for fetching, caching and updating async data' },
  { name: '@tanstack/react-query', version: '5.17.0', description: 'Powerful async state management' },
  { name: 'zod', version: '3.22.4', description: 'TypeScript-first schema validation' },
  { name: 'react-hook-form', version: '7.50.0', description: 'Performant forms with easy validation' },
  { name: 'react-router-dom', version: '6.22.0', description: 'Declarative routing for React' },
  { name: 'lodash', version: '4.17.21', description: 'A modern JavaScript utility library' },
  { name: 'recharts', version: '2.12.0', description: 'Composable charting library built on React components' },
  { name: 'sonner', version: '1.4.0', description: 'An opinionated toast component for React' },
  { name: 'react-icons', version: '5.0.1', description: 'SVG React icons of popular icon packs' },
];

export const useIDEStore = create<IDEState>((set, get) => ({
  // Initial state
  files: [
    {
      name: 'src',
      path: 'src',
      type: 'directory',
      children: [
        { name: 'App.tsx', path: 'src/App.tsx', type: 'file' },
        { name: 'index.html', path: 'src/index.html', type: 'file' },
      ],
    },
    {
      name: 'public',
      path: 'public',
      type: 'directory',
      children: [],
    },
  ],
  activeFile: 'src/App.tsx',
  fileContents: {
    'src/App.tsx': DEFAULT_APP_TSX,
    'src/index.html': DEFAULT_INDEX_HTML,
  },

  clickToEditLine: null,
  hoveredElement: null,

  messages: [
    {
      id: uuidv4(),
      role: 'assistant',
      content: 'Welcome to Lovable IDE! 🚀 I can help you build your app. Try:\n\n• **Paste a screenshot** and I\'ll generate matching UI\n• **Describe what you want** and I\'ll code it\n• **Paste a URL** and I\'ll clone the design\n• Click any element in the preview to jump to its code',
      timestamp: Date.now(),
    },
  ],
  isAiThinking: false,

  previewKey: 0,
  previewSize: 'desktop',
  showResponsiveComparison: false,
  shareableLink: null,

  runtimeErrors: [],
  consoleEntries: [],
  networkRequests: [],

  installedPackages: [
    { name: 'react', version: '18.3.1', description: 'A JavaScript library for building user interfaces', installed: true },
    { name: 'react-dom', version: '18.3.1', description: 'React package for working with the DOM', installed: true },
  ],
  packageSearchResults: [],

  assets: [],

  snapshots: [],
  currentSnapshotIndex: -1,

  lighthouseScore: null,
  accessibilityViolations: [],

  subAgentResults: [],

  activeInspectorTab: 'console',
  activeBottomPanel: null,
  showShadcnBrowser: false,

  // Actions
  setActiveFile: (path) => set({ activeFile: path, clickToEditLine: null }),

  updateFileContent: (path, content) => {
    set((state) => ({
      fileContents: { ...state.fileContents, [path]: content },
    }));
  },

  addFile: (path, content) => {
    set((state) => {
      const newContents = { ...state.fileContents, [path]: content };
      const parts = path.split('/');
      const fileName = parts[parts.length - 1];

      // Add to file tree
      const newFiles = JSON.parse(JSON.stringify(state.files)) as FileNode[];
      let current = newFiles;
      for (let i = 0; i < parts.length - 1; i++) {
        const dir = current.find((f) => f.name === parts[i] && f.type === 'directory');
        if (dir && dir.children) {
          current = dir.children;
        }
      }
      if (!current.find((f) => f.name === fileName)) {
        current.push({ name: fileName, path, type: 'file' });
      }

      return { files: newFiles, fileContents: newContents, activeFile: path };
    });
  },

  deleteFile: (path) => {
    set((state) => {
      const newContents = { ...state.fileContents };
      delete newContents[path];

      const parts = path.split('/');
      const fileName = parts[parts.length - 1];
      const newFiles = JSON.parse(JSON.stringify(state.files)) as FileNode[];
      let current = newFiles;
      for (let i = 0; i < parts.length - 1; i++) {
        const dir = current.find((f) => f.name === parts[i] && f.type === 'directory');
        if (dir && dir.children) {
          current = dir.children;
        }
      }
      const idx = current.findIndex((f) => f.name === fileName);
      if (idx !== -1) current.splice(idx, 1);

      return {
        files: newFiles,
        fileContents: newContents,
        activeFile: state.activeFile === path ? null : state.activeFile,
      };
    });
  },

  setClickToEditLine: (line) => set({ clickToEditLine: line }),
  setHoveredElement: (el) => set({ hoveredElement: el }),

  addMessage: (msg) => {
    const state = get();
    // Take snapshot before AI response
    if (msg.role === 'assistant' && !msg.error) {
      state.takeSnapshot(`Before: ${msg.content.substring(0, 50)}...`);
    }
    set((s) => ({
      messages: [
        ...s.messages,
        {
          ...msg,
          id: uuidv4(),
          timestamp: Date.now(),
          snapshotId: s.snapshots.length > 0 ? s.snapshots[s.snapshots.length - 1].id : undefined,
        },
      ],
    }));
  },

  clearMessages: () =>
    set({
      messages: [
        {
          id: uuidv4(),
          role: 'assistant',
          content: 'Chat cleared. How can I help you?',
          timestamp: Date.now(),
        },
      ],
    }),

  setAiThinking: (v) => set({ isAiThinking: v }),

  undoToMessage: (messageId) => {
    const state = get();
    const msg = state.messages.find((m) => m.id === messageId);
    if (msg?.snapshotId) {
      state.restoreSnapshot(msg.snapshotId);
      // Remove messages after this one
      const idx = state.messages.findIndex((m) => m.id === messageId);
      set((s) => ({
        messages: [
          ...s.messages.slice(0, idx),
          {
            id: uuidv4(),
            role: 'system',
            content: '↩️ Undid changes from this message',
            timestamp: Date.now(),
          },
        ],
      }));
    }
  },

  refreshPreview: () => set((s) => ({ previewKey: s.previewKey + 1 })),
  setPreviewSize: (size) => set({ previewSize: size }),
  toggleResponsiveComparison: () => set((s) => ({ showResponsiveComparison: !s.showResponsiveComparison })),

  generateShareableLink: () => {
    // Simulate generating a shareable link
    const id = uuidv4().substring(0, 8);
    const link = `https://lovable.app/preview/${id}`;
    set({ shareableLink: link });
    // Auto-copy to clipboard
    navigator.clipboard?.writeText(link);
  },

  addRuntimeError: (err) =>
    set((s) => ({
      runtimeErrors: [...s.runtimeErrors, { ...err, id: uuidv4(), timestamp: Date.now() }],
    })),

  clearRuntimeErrors: () => set({ runtimeErrors: [] }),

  addConsoleEntry: (entry) =>
    set((s) => ({
      consoleEntries: [
        ...s.consoleEntries,
        { ...entry, id: uuidv4(), timestamp: Date.now() },
      ],
    })),

  clearConsoleEntries: () => set({ consoleEntries: [] }),

  addNetworkRequest: (req) =>
    set((s) => ({
      networkRequests: [
        ...s.networkRequests,
        { ...req, id: uuidv4(), timestamp: Date.now() },
      ],
    })),

  clearNetworkRequests: () => set({ networkRequests: [] }),

  searchPackages: (query) => {
    if (!query.trim()) {
      set({ packageSearchResults: [] });
      return;
    }
    const results = MOCK_PACKAGES.filter(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase())
    );
    set({ packageSearchResults: results });
  },

  installPackage: (name) => {
    const pkg = MOCK_PACKAGES.find((p) => p.name === name);
    if (pkg) {
      set((s) => ({
        installedPackages: [...s.installedPackages, { ...pkg, installed: true }],
      }));
    }
  },

  uninstallPackage: (name) => {
    set((s) => ({
      installedPackages: s.installedPackages.filter((p) => p.name !== name),
    }));
  },

  addAsset: (name, dataUrl) => {
    const path = `public/${name}`;
    set((s) => ({
      assets: [...s.assets, { name, path, dataUrl }],
    }));
  },

  removeAsset: (name) => {
    set((s) => ({
      assets: s.assets.filter((a) => a.name !== name),
    }));
  },

  takeSnapshot: (message) => {
    const state = get();
    const snapshot: GitSnapshot = {
      id: uuidv4(),
      message,
      timestamp: Date.now(),
      files: { ...state.fileContents },
    };
    set((s) => ({
      snapshots: [...s.snapshots, snapshot],
      currentSnapshotIndex: s.snapshots.length,
    }));
  },

  restoreSnapshot: (id) => {
    const state = get();
    const snapshot = state.snapshots.find((s) => s.id === id);
    if (snapshot) {
      set({
        fileContents: { ...snapshot.files },
        previewKey: state.previewKey + 1,
      });
    }
  },

  forkFromSnapshot: (id) => {
    const state = get();
    const snapshot = state.snapshots.find((s) => s.id === id);
    if (snapshot) {
      set({
        fileContents: { ...snapshot.files },
        previewKey: state.previewKey + 1,
        messages: [
          ...state.messages,
          {
            id: uuidv4(),
            role: 'system',
            content: `🔀 Forked from snapshot: "${snapshot.message}"`,
            timestamp: Date.now(),
          },
        ],
      });
    }
  },

  runLighthouseAudit: () => {
    // Simulated Lighthouse audit
    set({
      lighthouseScore: {
        performance: Math.floor(Math.random() * 30) + 70,
        accessibility: Math.floor(Math.random() * 20) + 80,
        bestPractices: Math.floor(Math.random() * 25) + 75,
        seo: Math.floor(Math.random() * 15) + 85,
        diagnostics: [
          'Reduce unused JavaScript (-120ms)',
          'Serve images in next-gen formats',
          'Minimize main-thread work (1.2s)',
          'Reduce DOM size (1,200 elements)',
        ],
      },
      activeBottomPanel: 'lighthouse',
    });
  },

  runAccessibilityCheck: () => {
    // Simulated axe-core check
    set({
      accessibilityViolations: [
        {
          id: 'color-contrast',
          impact: 'serious',
          description: 'Elements must have sufficient color contrast',
          help: 'Ensures the contrast between foreground and background colors meets WCAG 2 AA minimum',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.8/color-contrast',
          nodes: [
            { html: '<p class="text-gray-400">Subtle text</p>', target: ['p.text-gray-400'] },
          ],
        },
        {
          id: 'image-alt',
          impact: 'critical',
          description: 'Images must have alternate text',
          help: 'Ensures <img> elements have alternate text or a role of none or presentation',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.8/image-alt',
          nodes: [
            { html: '<img src="/logo.png">', target: ['img'] },
          ],
        },
        {
          id: 'button-name',
          impact: 'critical',
          description: 'Buttons must have discernible text',
          help: 'Ensures buttons have discernible text',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.8/button-name',
          nodes: [
            { html: '<button class="icon-btn"><svg>...</svg></button>', target: ['button.icon-btn'] },
          ],
        },
      ],
      activeBottomPanel: 'accessibility',
    });
  },

  runSubAgents: () => {
    const results: SubAgentResult[] = [
      {
        agent: 'typecheck',
        status: 'pass',
        issues: [],
        timestamp: Date.now(),
      },
      {
        agent: 'lint',
        status: 'warning',
        issues: [
          { message: "Unexpected 'any' type", file: 'src/App.tsx', line: 5, severity: 'warning' },
        ],
        timestamp: Date.now(),
      },
      {
        agent: 'security',
        status: 'pass',
        issues: [],
        timestamp: Date.now(),
      },
      {
        agent: 'qa',
        status: 'pass',
        issues: [],
        timestamp: Date.now(),
      },
    ];
    set({ subAgentResults: results, activeBottomPanel: 'agents' });
  },

  setActiveInspectorTab: (tab) => set({ activeInspectorTab: tab }),
  setActiveBottomPanel: (panel) =>
    set((s) => ({ activeBottomPanel: s.activeBottomPanel === panel ? null : panel })),
  setShowShadcnBrowser: (v) => set({ showShadcnBrowser: v }),
}));

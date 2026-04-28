import { useState } from 'react';
import { FileText, ChevronRight, ChevronDown, X, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: FileNode[];
}

const DEMO_TREE: FileNode[] = [
  {
    name: 'src', path: 'src', type: 'dir', children: [
      { name: 'App.tsx', path: 'src/App.tsx', type: 'file' },
      { name: 'main.tsx', path: 'src/main.tsx', type: 'file' },
      { name: 'index.css', path: 'src/index.css', type: 'file' },
      {
        name: 'components', path: 'src/components', type: 'dir', children: [
          { name: 'Button.tsx', path: 'src/components/Button.tsx', type: 'file' },
        ]
      },
    ]
  },
  { name: 'package.json', path: 'package.json', type: 'file' },
  { name: 'tsconfig.json', path: 'tsconfig.json', type: 'file' },
];

const DEMO_CONTENT: Record<string, string> = {
  'src/App.tsx': `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Hello World</h1>
        <button 
          onClick={() => setCount(c => c + 1)}
          className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
        >
          Count: {count}
        </button>
      </div>
    </div>
  );
}`,
};

function FileTreeNode({ node, depth, onSelect, selected }: {
  node: FileNode;
  depth: number;
  onSelect: (path: string) => void;
  selected: string;
}) {
  const [open, setOpen] = useState(depth < 1);

  if (node.type === 'dir') {
    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 w-full px-2 py-0.5 hover:bg-accent/20 text-left text-muted-foreground hover:text-foreground transition-colors text-xs"
          style={{ paddingLeft: `${8 + depth * 12}px` }}
        >
          {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          {node.name}
        </button>
        {open && node.children?.map((c) => (
          <FileTreeNode key={c.path} node={c} depth={depth + 1} onSelect={onSelect} selected={selected} />
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelect(node.path)}
      className={cn(
        'flex items-center gap-1.5 w-full px-2 py-0.5 text-xs transition-colors',
        selected === node.path
          ? 'bg-primary/20 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/20',
      )}
      style={{ paddingLeft: `${20 + depth * 12}px` }}
    >
      <FileText size={11} />
      {node.name}
    </button>
  );
}

export default function CodePanel() {
  const [openTabs, setOpenTabs] = useState<string[]>(['src/App.tsx']);
  const [activeTab, setActiveTab] = useState('src/App.tsx');
  const [dirty, setDirty] = useState<Set<string>>(new Set());

  const selectFile = (path: string) => {
    if (!openTabs.includes(path)) {
      setOpenTabs((t) => [...t, path]);
    }
    setActiveTab(path);
  };

  const closeTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = openTabs.filter((t) => t !== path);
    setOpenTabs(newTabs);
    if (activeTab === path) setActiveTab(newTabs[newTabs.length - 1] ?? '');
    setDirty((d) => { const s = new Set(d); s.delete(path); return s; });
  };

  const content = DEMO_CONTENT[activeTab] ?? '// File content not available';

  return (
    <div className="flex h-full bg-[oklch(0.13_0_0)]">
      {/* File tree */}
      <div className="w-52 flex-shrink-0 border-r border-border bg-card overflow-y-auto">
        <div className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
          Explorer
        </div>
        {DEMO_TREE.map((n) => (
          <FileTreeNode key={n.path} node={n} depth={0} onSelect={selectFile} selected={activeTab} />
        ))}
      </div>

      {/* Editor area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center border-b border-border bg-card overflow-x-auto">
          {openTabs.map((tab) => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-r border-border select-none group',
                activeTab === tab
                  ? 'bg-background text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/20',
              )}
            >
              {dirty.has(tab) ? (
                <Circle size={7} className="text-primary fill-primary" />
              ) : (
                <FileText size={11} />
              )}
              {tab.split('/').pop()}
              <button
                onClick={(e) => closeTab(tab, e)}
                className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity ml-0.5"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>

        {/* Code content */}
        <div className="flex-1 overflow-auto p-4">
          <pre className="text-xs font-mono text-foreground whitespace-pre leading-relaxed" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: '14px' }}>
            {content}
          </pre>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-3 py-0.5 border-t border-border bg-card/50 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>Ln 1, Col 1</span>
            <span>TypeScript React</span>
          </div>
          <div className="flex items-center gap-3">
            <span>UTF-8</span>
            <span>LF</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { X, Plus, Terminal } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function TerminalDrawer({ onClose }: { onClose: () => void }) {
  const [tabs, setTabs] = useState(['Terminal 1']);
  const [activeTab, setActiveTab] = useState('Terminal 1');
  const [lines] = useState([
    '$ npm run dev',
    '',
    '> web@1.0.0 dev',
    '> vite',
    '',
    '  VITE v5.3.5  ready in 234 ms',
    '',
    '  ➜  Local:   http://localhost:5173/',
    '  ➜  Network: use --host to expose',
    '  ➜  press h + enter to show help',
  ]);

  const addTab = () => {
    const name = `Terminal ${tabs.length + 1}`;
    setTabs((t) => [...t, name]);
    setActiveTab(name);
  };

  return (
    <div
      className="flex flex-col border-t border-border bg-card"
      style={{ height: '220px' }}
    >
      {/* Tab bar */}
      <div className="flex items-center border-b border-border bg-card/50 px-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 text-xs border-r border-border',
              activeTab === tab
                ? 'bg-background text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Terminal size={11} />
            {tab}
          </button>
        ))}
        <button
          onClick={addTab}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors ml-1"
        >
          <Plus size={13} />
        </button>
        <div className="flex-1" />
        <button
          onClick={onClose}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={13} />
        </button>
      </div>

      {/* Terminal output */}
      <div className="flex-1 overflow-y-auto p-3" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>
        {lines.map((line, i) => (
          <div key={i} className={cn(
            'leading-relaxed',
            line.startsWith('$') ? 'text-green-400' : 
            line.includes('➜') ? 'text-primary' :
            line.includes('VITE') ? 'text-yellow-400' :
            'text-muted-foreground',
          )}>
            {line || '\u00A0'}
          </div>
        ))}
        <div className="flex items-center gap-1">
          <span className="text-green-400">$</span>
          <span className="text-foreground">█</span>
        </div>
      </div>
    </div>
  );
}

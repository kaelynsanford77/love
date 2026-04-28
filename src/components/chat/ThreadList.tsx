import { useState } from 'react';
import { Plus, MessageSquare, Trash2, X } from 'lucide-react';
import type { ChatThread } from '../../types';

interface ThreadListProps {
  threads: ChatThread[];
  activeThreadId: string | null;
  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
}

export default function ThreadList({ threads, activeThreadId, onSelect, onAdd, onDelete }: ThreadListProps) {
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd(newName.trim());
    setNewName('');
    setShowNew(false);
  };

  return (
    <div className="bg-gray-900 border-b border-gray-700 p-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Threads</span>
        <button
          onClick={() => setShowNew(true)}
          className="ml-auto text-gray-400 hover:text-purple-400 cursor-pointer"
          title="New thread"
        >
          <Plus size={16} />
        </button>
      </div>

      {showNew && (
        <div className="flex gap-1 mb-2">
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Thread name..."
            className="flex-1 bg-gray-800 text-gray-200 rounded px-2 py-1 text-xs border border-gray-700 focus:outline-none focus:border-purple-500"
          />
          <button onClick={handleAdd} className="text-purple-400 hover:text-purple-300 cursor-pointer">
            <Plus size={14} />
          </button>
          <button onClick={() => setShowNew(false)} className="text-gray-500 hover:text-gray-300 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto">
        {threads.map(t => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs whitespace-nowrap cursor-pointer ${
              t.id === activeThreadId
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                : 'text-gray-400 hover:bg-gray-800 border border-transparent'
            }`}
          >
            <MessageSquare size={12} />
            {t.name}
            {threads.length > 1 && (
              <span
                onClick={e => {
                  e.stopPropagation();
                  onDelete(t.id);
                }}
                className="ml-1 hover:text-red-400"
              >
                <Trash2 size={10} />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

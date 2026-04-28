import { useState } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, Key } from 'lucide-react';
import type { EnvVar } from '../../types';

interface EnvManagerProps {
  envVars: EnvVar[];
  onAdd: (key: string, value: string) => void;
  onUpdate: (index: number, updates: Partial<EnvVar>) => void;
  onDelete: (index: number) => void;
}

export default function EnvManager({ envVars, onAdd, onUpdate, onDelete }: EnvManagerProps) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    if (!newKey.trim()) return;
    onAdd(newKey.trim(), newValue);
    setNewKey('');
    setNewValue('');
  };

  return (
    <div className="h-full bg-gray-900 p-6 overflow-y-auto">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Key size={20} /> Environment Variables
      </h2>

      <p className="text-xs text-gray-500 mb-4">
        Manage your .env variables visually — add, edit, and toggle without touching files.
      </p>

      {/* Add new var */}
      <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 mb-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-400 block mb-1">Key</label>
            <input
              value={newKey}
              onChange={e => setNewKey(e.target.value)}
              placeholder="VARIABLE_NAME"
              className="w-full bg-gray-900 text-gray-200 rounded px-3 py-1.5 text-sm border border-gray-700 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-400 block mb-1">Value</label>
            <input
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              placeholder="value"
              className="w-full bg-gray-900 text-gray-200 rounded px-3 py-1.5 text-sm border border-gray-700 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!newKey.trim()}
            className="bg-purple-600 text-white px-3 py-1.5 rounded text-sm hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {envVars.map((v, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 bg-gray-800 rounded-lg p-3 border transition-colors ${
              v.enabled ? 'border-gray-700' : 'border-gray-800 opacity-50'
            }`}
          >
            <button
              onClick={() => onUpdate(i, { enabled: !v.enabled })}
              className="text-gray-400 hover:text-purple-400 cursor-pointer"
              title={v.enabled ? 'Disable' : 'Enable'}
            >
              {v.enabled ? <ToggleRight size={20} className="text-purple-400" /> : <ToggleLeft size={20} />}
            </button>

            <input
              value={v.key}
              onChange={e => onUpdate(i, { key: e.target.value })}
              className="bg-gray-900 text-gray-200 rounded px-2 py-1 text-sm border border-gray-700 focus:outline-none focus:border-purple-500 font-mono w-40"
            />
            <span className="text-gray-600">=</span>
            <input
              value={v.value}
              onChange={e => onUpdate(i, { value: e.target.value })}
              className="flex-1 bg-gray-900 text-gray-200 rounded px-2 py-1 text-sm border border-gray-700 focus:outline-none focus:border-purple-500 font-mono"
            />
            <button
              onClick={() => onDelete(i)}
              className="text-gray-500 hover:text-red-400 cursor-pointer"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {envVars.length === 0 && (
        <p className="text-center text-gray-600 text-sm mt-8">No environment variables yet.</p>
      )}
    </div>
  );
}

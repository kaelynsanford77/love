import { Database, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface CloudPanelProps {
  seedSql: string;
  onGenerateSeed: () => void;
}

export default function CloudPanel({ seedSql, onGenerateSeed }: CloudPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(seedSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full bg-gray-900 p-6 overflow-y-auto">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Database size={20} /> Cloud Panel
      </h2>

      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-medium text-gray-300 mb-3">🌱 Database Seed Generator</h3>
        <p className="text-xs text-gray-500 mb-4">
          Generate realistic test data for your database. AI creates seed SQL with tables, relationships, and sample rows.
        </p>

        <button
          onClick={onGenerateSeed}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors cursor-pointer flex items-center gap-2"
        >
          <Database size={16} />
          Generate test data
        </button>

        {seedSql && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Generated SQL</span>
              <button
                onClick={handleCopy}
                className="text-gray-400 hover:text-white text-xs flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="bg-gray-950 text-green-400 text-xs p-4 rounded-lg overflow-auto max-h-96 border border-gray-700">
              {seedSql}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

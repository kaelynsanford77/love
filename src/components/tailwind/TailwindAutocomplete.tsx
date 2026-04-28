import { useState } from 'react';
import { Wand2 } from 'lucide-react';

const TAILWIND_SUGGESTIONS: Record<string, string[]> = {
  'center': ['flex items-center justify-center', 'mx-auto text-center', 'grid place-items-center'],
  'card': ['rounded-lg shadow-md p-6 bg-white', 'rounded-xl border p-4 hover:shadow-lg transition-shadow', 'bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm'],
  'button': ['px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600', 'px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white', 'px-4 py-2 border-2 border-gray-300 rounded-lg hover:border-gray-400'],
  'responsive': ['sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3', 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8', 'text-sm sm:text-base lg:text-lg'],
  'dark mode': ['dark:bg-gray-900 dark:text-white', 'bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100', 'border-gray-200 dark:border-gray-700'],
  'spacing': ['space-y-4', 'gap-4', 'p-4 m-2'],
  'gradient': ['bg-gradient-to-r from-blue-500 to-purple-600', 'bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600', 'bg-gradient-to-t from-gray-900 to-transparent'],
  'animation': ['transition-all duration-300 ease-in-out', 'animate-pulse', 'hover:scale-105 transition-transform'],
  'input': ['w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none', 'bg-gray-50 border-gray-300 rounded-md px-3 py-2 text-sm', 'border-b-2 border-gray-300 focus:border-blue-500 outline-none px-2 py-1'],
  'text': ['text-lg font-semibold text-gray-900', 'text-sm text-gray-500 leading-relaxed', 'text-3xl font-bold tracking-tight'],
};

export default function TailwindAutocomplete() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [copied, setCopied] = useState<number | null>(null);

  const handleSearch = (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const lower = q.toLowerCase();
    const matches: string[] = [];
    for (const [key, classes] of Object.entries(TAILWIND_SUGGESTIONS)) {
      if (key.includes(lower) || lower.includes(key)) {
        matches.push(...classes);
      }
    }
    if (matches.length === 0) {
      matches.push(
        `${lower.replace(/\s+/g, '-')}`,
        `hover:${lower.replace(/\s+/g, '-')}`,
      );
    }
    setResults([...new Set(matches)]);
  };

  const handleCopy = (text: string, i: number) => {
    navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="h-full bg-gray-900 p-6 overflow-y-auto">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Wand2 size={20} /> Tailwind Class Autocomplete
      </h2>

      <p className="text-xs text-gray-500 mb-4">
        Describe what you want to style and get Tailwind CSS class suggestions.
      </p>

      <input
        value={query}
        onChange={e => handleSearch(e.target.value)}
        placeholder="Describe your style (e.g. 'card', 'center', 'dark mode')..."
        className="w-full bg-gray-800 text-gray-200 rounded-lg px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-purple-500 mb-4"
      />

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((cls, i) => (
            <div
              key={i}
              onClick={() => handleCopy(cls, i)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 cursor-pointer hover:border-purple-500/50 transition-colors group"
            >
              <code className="text-sm text-green-400 font-mono">{cls}</code>
              <span className="text-xs text-gray-500 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {copied === i ? '✓ Copied!' : 'Click to copy'}
              </span>
            </div>
          ))}
        </div>
      )}

      {query && results.length === 0 && (
        <p className="text-gray-600 text-sm">No suggestions found. Try: card, button, center, dark mode, gradient</p>
      )}

      {!query && (
        <div className="mt-4">
          <p className="text-xs text-gray-500 mb-2">Try these keywords:</p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(TAILWIND_SUGGESTIONS).map(k => (
              <button
                key={k}
                onClick={() => handleSearch(k)}
                className="px-3 py-1 text-xs rounded-full bg-gray-800 text-gray-400 border border-gray-700 hover:border-purple-500/50 cursor-pointer"
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

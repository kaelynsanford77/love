import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import type { ChatThread } from '../../types';

interface ChatPanelProps {
  thread: ChatThread;
  onSend: (content: string) => void;
  onSuggestionClick: (suggestion: string) => void;
}

export default function ChatPanel({ thread, onSend, onSuggestionClick }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  };

  const lastAssistantMsg = [...thread.messages].reverse().find(m => m.role === 'assistant');

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {thread.messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <p className="text-lg">Start a conversation</p>
            <p className="text-sm mt-2">Ask me anything about your project</p>
          </div>
        )}
        {thread.messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-200 border border-gray-700'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* AI follow-up suggestion chips */}
      {lastAssistantMsg?.suggestions && lastAssistantMsg.suggestions.length > 0 && (
        <div className="px-4 pb-2 flex gap-2 flex-wrap">
          {lastAssistantMsg.suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSuggestionClick(s)}
              className="px-3 py-1.5 text-xs rounded-full bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/40 transition-colors cursor-pointer"
            >
              💡 {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask AI anything..."
            className="flex-1 bg-gray-800 text-gray-200 rounded-lg px-4 py-2 text-sm border border-gray-700 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}

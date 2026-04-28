import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, ChatThread, Message, EnvVar, TokenUsage, DeepLinkState } from '../types';

const SUGGESTIONS_POOL = [
  'Add dark mode toggle',
  'Make it responsive',
  'Add loading spinner',
  'Improve error handling',
  'Add form validation',
  'Create a modal component',
  'Add pagination',
  'Implement search filter',
  'Add toast notifications',
  'Create a sidebar nav',
  'Add drag and drop',
  'Implement infinite scroll',
];

function pickSuggestions(): string[] {
  const shuffled = [...SUGGESTIONS_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

function createThread(name: string): ChatThread {
  return {
    id: uuidv4(),
    name,
    messages: [],
    createdAt: Date.now(),
  };
}

const initialThread = createThread('General');

const defaultState: AppState = {
  threads: [initialThread],
  activeThreadId: initialThread.id,
  envVars: [
    { key: 'DATABASE_URL', value: 'postgres://localhost:5432/mydb', enabled: true },
    { key: 'API_KEY', value: 'sk-placeholder', enabled: true },
    { key: 'NODE_ENV', value: 'development', enabled: true },
  ],
  tokenUsage: [
    { date: '2026-04-21', model: 'gpt-4o', promptTokens: 1200, completionTokens: 800, cost: 0.08 },
    { date: '2026-04-22', model: 'gpt-4o', promptTokens: 2400, completionTokens: 1600, cost: 0.16 },
    { date: '2026-04-23', model: 'claude-sonnet', promptTokens: 1800, completionTokens: 1200, cost: 0.12 },
    { date: '2026-04-24', model: 'gpt-4o', promptTokens: 3000, completionTokens: 2000, cost: 0.20 },
    { date: '2026-04-25', model: 'gpt-4o-mini', promptTokens: 5000, completionTokens: 3500, cost: 0.05 },
    { date: '2026-04-26', model: 'claude-sonnet', promptTokens: 2200, completionTokens: 1500, cost: 0.15 },
    { date: '2026-04-27', model: 'gpt-4o', promptTokens: 1900, completionTokens: 1300, cost: 0.13 },
    { date: '2026-04-28', model: 'gpt-4o-mini', promptTokens: 4000, completionTokens: 2800, cost: 0.04 },
  ],
  panelSizes: {
    chatWidth: 380,
    terminalHeight: 200,
    codeSplitRatio: 0.5,
  },
  deepLink: { mode: 'chat' },
  seedSql: '',
};

export function useAppStore() {
  const [state, setState] = useState<AppState>(defaultState);

  const setDeepLink = useCallback((dl: DeepLinkState) => {
    setState(prev => ({ ...prev, deepLink: dl }));
    const params = new URLSearchParams();
    params.set('mode', dl.mode);
    if (dl.file) params.set('file', dl.file);
    if (dl.line) params.set('line', String(dl.line));
    window.history.replaceState({}, '', `?${params.toString()}`);
  }, []);

  const addThread = useCallback((name: string) => {
    const thread = createThread(name);
    setState(prev => ({
      ...prev,
      threads: [...prev.threads, thread],
      activeThreadId: thread.id,
    }));
  }, []);

  const setActiveThread = useCallback((id: string) => {
    setState(prev => ({ ...prev, activeThreadId: id }));
  }, []);

  const deleteThread = useCallback((id: string) => {
    setState(prev => {
      const threads = prev.threads.filter(t => t.id !== id);
      if (threads.length === 0) {
        const fallback = createThread('General');
        return { ...prev, threads: [fallback], activeThreadId: fallback.id };
      }
      const activeThreadId = prev.activeThreadId === id ? threads[0].id : prev.activeThreadId;
      return { ...prev, threads, activeThreadId };
    });
  }, []);

  const sendMessage = useCallback((content: string) => {
    setState(prev => {
      const userMsg: Message = {
        id: uuidv4(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };
      const aiMsg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: `I'll help you with that! Here's what I can do regarding "${content.slice(0, 50)}...":\n\n1. Analyze the current codebase\n2. Suggest improvements\n3. Implement the changes\n\nWould you like me to proceed?`,
        timestamp: Date.now() + 1,
        suggestions: pickSuggestions(),
      };
      const newUsage: TokenUsage = {
        date: new Date().toISOString().split('T')[0],
        model: 'gpt-4o',
        promptTokens: Math.floor(content.length * 1.5),
        completionTokens: Math.floor(aiMsg.content.length * 1.3),
        cost: +(Math.random() * 0.05 + 0.01).toFixed(4),
      };
      return {
        ...prev,
        threads: prev.threads.map(t =>
          t.id === prev.activeThreadId
            ? { ...t, messages: [...t.messages, userMsg, aiMsg] }
            : t
        ),
        tokenUsage: [...prev.tokenUsage, newUsage],
      };
    });
  }, []);

  const addEnvVar = useCallback((key: string, value: string) => {
    setState(prev => ({
      ...prev,
      envVars: [...prev.envVars, { key, value, enabled: true }],
    }));
  }, []);

  const updateEnvVar = useCallback((index: number, updates: Partial<EnvVar>) => {
    setState(prev => ({
      ...prev,
      envVars: prev.envVars.map((v, i) => (i === index ? { ...v, ...updates } : v)),
    }));
  }, []);

  const deleteEnvVar = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      envVars: prev.envVars.filter((_, i) => i !== index),
    }));
  }, []);

  const setPanelSizes = useCallback((sizes: Partial<AppState['panelSizes']>) => {
    setState(prev => ({
      ...prev,
      panelSizes: { ...prev.panelSizes, ...sizes },
    }));
  }, []);

  const generateSeedSql = useCallback(() => {
    const sql = `-- Generated seed data for testing
-- Created at ${new Date().toISOString()}

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  owner_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(300) NOT NULL,
  status VARCHAR(20) DEFAULT 'todo',
  project_id INTEGER REFERENCES projects(id),
  assignee_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO users (name, email, role) VALUES
  ('Alice Johnson', 'alice@example.com', 'admin'),
  ('Bob Smith', 'bob@example.com', 'user'),
  ('Carol Williams', 'carol@example.com', 'user'),
  ('David Brown', 'david@example.com', 'editor'),
  ('Eve Davis', 'eve@example.com', 'user');

INSERT INTO projects (name, description, owner_id) VALUES
  ('E-commerce Platform', 'Full-stack online store with payments', 1),
  ('Blog Engine', 'Markdown-powered blogging platform', 2),
  ('Task Tracker', 'Project management tool', 1);

INSERT INTO tasks (title, status, project_id, assignee_id) VALUES
  ('Design homepage', 'done', 1, 3),
  ('Implement auth', 'in_progress', 1, 2),
  ('Setup CI/CD', 'todo', 1, 4),
  ('Write first post', 'done', 2, 2),
  ('Add comments', 'in_progress', 2, 5),
  ('Create board view', 'todo', 3, 1),
  ('Add drag and drop', 'todo', 3, 3);
`;
    setState(prev => ({ ...prev, seedSql: sql }));
  }, []);

  const activeThread = state.threads.find(t => t.id === state.activeThreadId) ?? state.threads[0];

  return {
    ...state,
    activeThread,
    setDeepLink,
    addThread,
    setActiveThread,
    deleteThread,
    sendMessage,
    addEnvVar,
    updateEnvVar,
    deleteEnvVar,
    setPanelSizes,
    generateSeedSql,
  };
}

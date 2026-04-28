import React, { useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { useIDEStore } from '@/store/useIDEStore';

export function CodeEditor() {
  const { activeFile, fileContents, updateFileContent, clickToEditLine } = useIDEStore();

  const content = activeFile ? fileContents[activeFile] ?? '' : '';

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (activeFile && value !== undefined) {
        updateFileContent(activeFile, value);
      }
    },
    [activeFile, updateFileContent]
  );

  const handleEditorDidMount = useCallback(
    (editor: any) => {
      if (clickToEditLine && clickToEditLine > 0) {
        editor.revealLineInCenter(clickToEditLine);
        editor.setPosition({ lineNumber: clickToEditLine, column: 1 });
        editor.focus();
      }
    },
    [clickToEditLine]
  );

  if (!activeFile) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">No file selected</p>
          <p className="text-sm">Select a file from the explorer or ask AI to create one</p>
        </div>
      </div>
    );
  }

  const lang = activeFile.endsWith('.tsx') || activeFile.endsWith('.ts')
    ? 'typescript'
    : activeFile.endsWith('.css')
    ? 'css'
    : activeFile.endsWith('.html')
    ? 'html'
    : activeFile.endsWith('.json')
    ? 'json'
    : 'plaintext';

  return (
    <div className="h-full">
      <div className="h-8 bg-background border-b border-border flex items-center px-3">
        <span className="text-xs text-muted-foreground">{activeFile}</span>
      </div>
      <Editor
        height="calc(100% - 32px)"
        language={lang}
        value={content}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          fontSize: 13,
          lineHeight: 20,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          padding: { top: 8 },
          tabSize: 2,
          wordWrap: 'on',
          automaticLayout: true,
        }}
      />
    </div>
  );
}

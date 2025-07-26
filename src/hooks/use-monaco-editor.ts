import { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';

// Monaco Editor worker configuration
declare global {
  interface Window {
    MonacoEnvironment?: monaco.Environment;
  }
}

if (typeof window !== 'undefined') {
  window.MonacoEnvironment = {
    getWorkerUrl: function (label) {
      return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
        self.MonacoEnvironment = {
          baseUrl: 'https://unpkg.com/monaco-editor@0.43.0/min/'
        };
        importScripts('https://unpkg.com/monaco-editor@0.43.0/min/vs/base/worker/workerMain.js');`
      )}`;
    },
  };
}

export interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  theme?: 'light' | 'dark';
  readOnly?: boolean;
  onValidation?: (markers: monaco.editor.IMarkerData[]) => void;
}

export const useMonacoEditor = () => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Configure Mermaid language
    const configureMermaidLanguage = () => {
      // Register Mermaid language
      monaco.languages.register({ id: 'mermaid' });

      // Define Mermaid syntax highlighting
      monaco.languages.setMonarchTokensProvider('mermaid', {
        tokenizer: {
          root: [
            // Comments
            [/%%.*$/, 'comment'],

            // Keywords for different diagram types
            [/\b(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|gitgraph|mindmap|timeline|zenuml|sankey)\b/, 'keyword'],

            // Direction keywords
            [/\b(TD|TB|BT|RL|LR|DT)\b/, 'keyword.control'],

            // Node shapes
            [/[\[\]{}()]/, 'delimiter.bracket'],
            [/[<>]/, 'delimiter.angle'],

            // Arrows and connections
            [/-->|---|\-\.\->|\-\.-|==>|==|\|\|/, 'operator'],

            // Node labels in quotes
            [/"([^"\\]|\\.)*$/, 'string.invalid'],
            [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
            [/'([^'\\]|\\.)*$/, 'string.invalid'],
            [/'/, { token: 'string.quote', bracket: '@open', next: '@string_single' }],

            // Numbers
            [/\d+/, 'number'],

            // Identifiers
            [/[a-zA-Z_]\w*/, 'identifier'],

            // Whitespace
            [/[ \t\r\n]+/, 'white'],
          ],

          string: [
            [/[^\\"]+/, 'string'],
            [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
          ],

          string_single: [
            [/[^\\']+/, 'string'],
            [/'/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
          ],
        },
      });

      // Define Mermaid theme
      monaco.editor.defineTheme('mermaid-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6A9955' },
          { token: 'keyword', foreground: 'C586C0' },
          { token: 'keyword.control', foreground: '569CD6' },
          { token: 'string', foreground: 'CE9178' },
          { token: 'number', foreground: 'B5CEA8' },
          { token: 'operator', foreground: 'D4D4D4' },
          { token: 'delimiter.bracket', foreground: 'FFD700' },
          { token: 'identifier', foreground: '9CDCFE' },
        ],
        colors: {
          'editor.background': '#1e1e1e',
          'editor.foreground': '#d4d4d4',
          'editorLineNumber.foreground': '#858585',
          'editorIndentGuide.background': '#404040',
          'editorIndentGuide.activeBackground': '#707070',
        },
      });

      monaco.editor.defineTheme('mermaid-light', {
        base: 'vs',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '008000' },
          { token: 'keyword', foreground: '0000FF' },
          { token: 'keyword.control', foreground: 'AF00DB' },
          { token: 'string', foreground: 'A31515' },
          { token: 'number', foreground: '09885A' },
          { token: 'operator', foreground: '000000' },
          { token: 'delimiter.bracket', foreground: 'FF8C00' },
          { token: 'identifier', foreground: '001080' },
        ],
        colors: {
          'editor.background': '#ffffff',
          'editor.foreground': '#000000',
          'editorLineNumber.foreground': '#237893',
          'editorIndentGuide.background': '#D3D3D3',
          'editorIndentGuide.activeBackground': '#939393',
        },
      });

      // Configure completion provider
      monaco.languages.registerCompletionItemProvider('mermaid', {
        provideCompletionItems: (model, position, context, token) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn
          };

          const suggestions = [
            {
              label: 'flowchart TD',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'flowchart TD\n    A[Start] --> B[End]',
              documentation: 'Basic flowchart template',
              range: range
            },
            {
              label: 'sequenceDiagram',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'sequenceDiagram\n    participant A\n    participant B\n    A->>B: Message',
              documentation: 'Basic sequence diagram template',
              range: range
            },
            {
              label: 'classDiagram',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'classDiagram\n    class Animal {\n        +String name\n        +makeSound()\n    }',
              documentation: 'Basic class diagram template',
              range: range
            },
            {
              label: 'stateDiagram-v2',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'stateDiagram-v2\n    [*] --> State1\n    State1 --> [*]',
              documentation: 'Basic state diagram template',
              range: range
            },
            {
              label: 'gantt',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'gantt\n    title Sample Gantt\n    dateFormat YYYY-MM-DD\n    section Section\n    Task : 2023-01-01, 30d',
              documentation: 'Basic gantt chart template',
              range: range
            },
            {
              label: '-->',
              kind: monaco.languages.CompletionItemKind.Operator,
              insertText: '-->',
              documentation: 'Arrow connection',
              range: range
            },
            {
              label: '---',
              kind: monaco.languages.CompletionItemKind.Operator,
              insertText: '---',
              documentation: 'Line connection',
              range: range
            },
          ];

          return { suggestions };
        }
      });
    };

    configureMermaidLanguage();
    setIsLoaded(true);
  }, []);

  const createEditor = (
    container: HTMLElement,
    value: string,
    onChange: (value: string) => void,
    theme: 'light' | 'dark' = 'dark',
    readOnly = false,
    onValidation?: (markers: monaco.editor.IMarkerData[]) => void
  ) => {
    if (!isLoaded) return null;

    const editor = monaco.editor.create(container, {
      value,
      language: 'mermaid',
      theme: theme === 'dark' ? 'mermaid-dark' : 'mermaid-light',
      readOnly,
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      lineNumbers: 'on',
      folding: true,
      selectOnLineNumbers: true,
      roundedSelection: false,
      cursorStyle: 'line',
      fontSize: 14,
      fontFamily: 'Fira Code, Monaco, Consolas, "Ubuntu Mono", monospace',
      fontLigatures: true,
      tabSize: 2,
      insertSpaces: true,
      detectIndentation: false,
    });

    // Handle content changes
    editor.onDidChangeModelContent(() => {
      const newValue = editor.getValue();
      onChange(newValue);
    });

    // Handle validation
    if (onValidation) {
      const model = editor.getModel();
      if (model) {
        const disposable = monaco.editor.onDidChangeMarkers((uris) => {
          if (uris.includes(model.uri)) {
            const markers = monaco.editor.getModelMarkers({ resource: model.uri });
            onValidation(markers);
          }
        });
        
        // Store disposable for cleanup
        editor.onDidDispose(() => {
          disposable.dispose();
        });
      }
    }

    return editor;
  };

  const destroyEditor = () => {
    if (editorRef.current) {
      editorRef.current.dispose();
      editorRef.current = null;
    }
  };

  return {
    createEditor,
    destroyEditor,
    isLoaded,
    containerRef,
    editorRef,
  };
};

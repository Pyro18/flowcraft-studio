'use client';

import { useEffect, useRef, useState } from 'react';
import { useMonacoEditor } from '@/hooks/use-monaco-editor';
import { useTauri, ValidationResult } from '@/hooks/use-tauri';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Save,
  FolderOpen,
  Download,
  Play,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useToast } from '@/hooks/use-toast';

interface MermaidEditorProps {
  initialValue?: string;
  onContentChange?: (content: string) => void;
  onValidationChange?: (validation: ValidationResult) => void;
}

export function MermaidEditor({
  initialValue = '',
  onContentChange,
  onValidationChange
}: MermaidEditorProps) {
  const { theme } = useTheme();
  const { toast } = useToast();
  const { createEditor, destroyEditor, isLoaded, containerRef, editorRef } = useMonacoEditor();
  const {
    saveFile,
    loadFile,
    validateMermaidSyntax,
    exportDiagram,
    isLoading,
    error
  } = useTauri();

  const [content, setContent] = useState(initialValue);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Initialize editor
  useEffect(() => {
    if (!isLoaded || !containerRef.current || editorRef.current) return;

    const editor = createEditor(
      containerRef.current,
      content,
      handleContentChange,
      theme as 'light' | 'dark',
      false,
      handleValidationMarkers
    );

    if (editor) {
      editorRef.current = editor;
    }

    return () => {
      destroyEditor();
    };
  }, [isLoaded, theme]);

  // Update editor theme when theme changes
  useEffect(() => {
    if (editorRef.current) {
      const themeToUse = theme === 'dark' ? 'mermaid-dark' : 'mermaid-light';
      editorRef.current.updateOptions({ theme: themeToUse });
    }
  }, [theme]);

  // Validate content when it changes
  useEffect(() => {
    if (content.trim()) {
      validateContent();
    }
  }, [content]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    onContentChange?.(newContent);
  };

  const handleValidationMarkers = (markers: any[]) => {
    // Handle Monaco editor validation markers if needed
    console.log('Validation markers:', markers);
  };

  const validateContent = async () => {
    if (!content.trim()) {
      setValidation(null);
      return;
    }

    setIsValidating(true);
    try {
      const result = await validateMermaidSyntax(content);
      setValidation(result);
      onValidationChange?.(result);
    } catch (err) {
      console.error('Validation error:', err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async () => {
    try {
      const filePath = await saveFile(content, currentFilePath || undefined);
      setCurrentFilePath(filePath);
      toast({
        title: "File salvato",
        description: `File salvato in: ${filePath}`,
      });
    } catch (err) {
      toast({
        title: "Errore nel salvare",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleLoad = async () => {
    try {
      const fileContent = await loadFile();
      setContent(fileContent.content);
      setCurrentFilePath(fileContent.path || null);

      if (editorRef.current) {
        editorRef.current.setValue(fileContent.content);
      }

      toast({
        title: "File caricato",
        description: `File caricato: ${fileContent.path}`,
      });
    } catch (err) {
      toast({
        title: "Errore nel caricare",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleExport = async (format: 'png' | 'svg' | 'pdf') => {
    try {
      const exportPath = await exportDiagram(content, format);
      toast({
        title: "Export completato",
        description: `Diagramma esportato in: ${exportPath}`,
      });
    } catch (err) {
      toast({
        title: "Errore nell'export",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  const getValidationBadge = () => {
    if (isValidating) {
      return <Badge variant="secondary">Validazione...</Badge>;
    }

    if (!validation) {
      return null;
    }

    if (validation.is_valid) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Valido
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <AlertCircle className="w-3 h-3 mr-1" />
          Errori trovati
        </Badge>
      );
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Editor Mermaid</CardTitle>
            <div className="flex items-center gap-2">
              {getValidationBadge()}
              {currentFilePath && (
                <Badge variant="outline" className="text-xs">
                  {currentFilePath.split(/[/\\]/).pop()}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              size="sm"
              variant="default"
            >
              <Save className="w-4 h-4 mr-2" />
              Salva
            </Button>

            <Button
              onClick={handleLoad}
              disabled={isLoading}
              size="sm"
              variant="outline"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Apri
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button
              onClick={() => handleExport('png')}
              disabled={isLoading || !validation?.is_valid}
              size="sm"
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              PNG
            </Button>

            <Button
              onClick={() => handleExport('svg')}
              disabled={isLoading || !validation?.is_valid}
              size="sm"
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              SVG
            </Button>

            <Button
              onClick={() => handleExport('pdf')}
              disabled={isLoading || !validation?.is_valid}
              size="sm"
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button
              onClick={validateContent}
              disabled={isValidating || !content.trim()}
              size="sm"
              variant="outline"
            >
              <Play className="w-4 h-4 mr-2" />
              Valida
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Validation Messages */}
      {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="mb-4 space-y-2">
          {validation.errors.map((error, index) => (
            <Alert key={`error-${index}`} variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ))}

          {validation.warnings.map((warning, index) => (
            <Alert key={`warning-${index}`}>
              <Info className="h-4 w-4" />
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Editor Container */}
      <Card className="flex-1">
        <CardContent className="p-0 h-full">
          <div
            ref={containerRef}
            className="h-full min-h-[400px] w-full"
            style={{
              border: 'none',
              borderRadius: '0.5rem',
              overflow: 'hidden'
            }}
          />
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

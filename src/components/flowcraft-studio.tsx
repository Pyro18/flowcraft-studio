'use client';

import { useState, useEffect } from 'react';
import { MermaidEditor } from '@/components/mermaid-editor';
import { MermaidPreview } from '@/components/mermaid-preview';
import { TemplateManager } from '@/components/template-manager';
import { useTauri, Template, RecentFile, ValidationResult } from '@/hooks/use-tauri';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Eye,
  Sparkles,
  History,
  Moon,
  Sun,
  Palette,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useToast } from '@/hooks/use-toast';

export function FlowCraftStudio() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { getRecentFiles, clearRecentFiles, loadFile } = useTauri();

  const [content, setContent] = useState(`flowchart TD
    A[Start] --> B{Decision?}
    B -->|Yes| C[Process 1]
    B -->|No| D[Process 2]
    C --> E[End]
    D --> E`);

  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [activeTab, setActiveTab] = useState('editor');

  useEffect(() => {
    loadRecentFiles();
  }, []);

  const loadRecentFiles = async () => {
    try {
      const files = await getRecentFiles();
      setRecentFiles(files);
    } catch (error) {
      console.error('Failed to load recent files:', error);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setContent(template.content);
    setActiveTab('editor');
    toast({
      title: "Template caricato",
      description: `Template "${template.name}" applicato con successo`,
    });
  };

  const handleRecentFileOpen = async (file: RecentFile) => {
    try {
      const fileContent = await loadFile(file.path);
      setContent(fileContent.content);
      setActiveTab('editor');
      await loadRecentFiles(); // Refresh recent files list
      toast({
        title: "File caricato",
        description: `File "${file.name}" aperto con successo`,
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: `Impossibile aprire il file: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  const handleClearRecentFiles = async () => {
    try {
      await clearRecentFiles();
      setRecentFiles([]);
      toast({
        title: "File recenti cancellati",
        description: "La lista dei file recenti è stata svuotata",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: `Impossibile cancellare i file recenti: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data non valida';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">FlowCraft Studio</h1>
                  <p className="text-sm text-muted-foreground">Visual Mermaid Editor</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {validation && (
                <Badge
                  variant={validation.is_valid ? "default" : "destructive"}
                  className={validation.is_valid ? "bg-green-100 text-green-800 border-green-200" : ""}
                >
                  {validation.is_valid ? "✓ Valido" : "⚠ Errori"}
                </Badge>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Template
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Recenti
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="editor" className="mt-0">
              <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-200px)]">
                <ResizablePanel defaultSize={50} minSize={30}>
                  <MermaidEditor
                    initialValue={content}
                    onContentChange={setContent}
                    onValidationChange={setValidation}
                  />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={50} minSize={30}>
                  <MermaidPreview
                    content={content}
                    isValid={validation?.is_valid ?? true}
                  />
                </ResizablePanel>
              </ResizablePanelGroup>
            </TabsContent>

            <TabsContent value="preview" className="mt-0">
              <div className="h-[calc(100vh-200px)]">
                <MermaidPreview
                  content={content}
                  isValid={validation?.is_valid ?? true}
                />
              </div>
            </TabsContent>

            <TabsContent value="templates" className="mt-0">
              <div className="h-[calc(100vh-200px)] overflow-auto">
                <TemplateManager onTemplateSelect={handleTemplateSelect} />
              </div>
            </TabsContent>

            <TabsContent value="recent" className="mt-0">
              <Card className="h-[calc(100vh-200px)]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      <CardTitle>File Recenti</CardTitle>
                    </div>
                    {recentFiles.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearRecentFiles}
                      >
                        Cancella tutto
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[calc(100vh-320px)]">
                    {recentFiles.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium">Nessun file recente</p>
                          <p className="text-sm">I file aperti di recente appariranno qui</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {recentFiles.map((file, index) => (
                          <Card
                            key={`${file.path}-${index}`}
                            className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20"
                            onClick={() => handleRecentFileOpen(file)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                                    <p className="font-medium truncate">{file.name}</p>
                                  </div>
                                  <p className="text-sm text-muted-foreground truncate mt-1">
                                    {file.path}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Aperto il {formatDate(file.last_opened)}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRecentFileOpen(file);
                                  }}
                                >
                                  Apri
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}

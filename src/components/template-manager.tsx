'use client';

import { useEffect, useState } from 'react';
import { useTauri, Template } from '@/hooks/use-tauri';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Zap,
  Download,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TemplateManagerProps {
  onTemplateSelect: (template: Template) => void;
}

export function TemplateManager({ onTemplateSelect }: TemplateManagerProps) {
  const { toast } = useToast();
  const { getTemplates, isLoading, error } = useTauri();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const templateList = await getTemplates();
      setTemplates(templateList);
    } catch (err) {
      toast({
        title: "Errore nel caricare i template",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleTemplateSelect = (template: Template) => {
    onTemplateSelect(template);
    toast({
      title: "Template applicato",
      description: `Template "${template.name}" caricato nell'editor`,
    });
  };

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];
  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    const icons = {
      'Flowchart': '🔄',
      'Sequence': '📊',
      'Class': '🏗️',
      'State': '🔀',
      'Gantt': '📅',
      'Pie': '🥧',
      'all': '📋'
    };
    return icons[category as keyof typeof icons] || '📄';
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <div>
              <CardTitle className="text-xl">Template Mermaid</CardTitle>
              <CardDescription>
                Inizia rapidamente con template predefiniti per diversi tipi di diagrammi
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-7 mb-6">
              {categories.map(category => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="text-xs"
                >
                  <span className="mr-1">
                    {getCategoryIcon(category)}
                  </span>
                  {category === 'all' ? 'Tutti' : category}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-0">
              <ScrollArea className="h-96">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <Card key={index} className="animate-pulse">
                        <CardHeader className="pb-3">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="h-3 bg-muted rounded"></div>
                            <div className="h-3 bg-muted rounded w-5/6"></div>
                            <div className="h-3 bg-muted rounded w-4/6"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : filteredTemplates.length === 0 ? (
                    <div className="col-span-full flex items-center justify-center py-12">
                      <div className="text-center text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Nessun template trovato</p>
                        <p className="text-sm">
                          {selectedCategory === 'all'
                            ? 'Non sono disponibili template al momento'
                            : `Nessun template disponibile per la categoria "${selectedCategory}"`
                          }
                        </p>
                      </div>
                    </div>
                  ) : (
                    filteredTemplates.map((template) => (
                      <Card
                        key={template.id}
                        className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20"
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base flex items-center gap-2">
                                <span>{getCategoryIcon(template.category)}</span>
                                {template.name}
                              </CardTitle>
                              <CardDescription className="text-sm mt-1">
                                {template.description}
                              </CardDescription>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {template.category}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="bg-muted rounded-md p-3 mb-3">
                            <pre className="text-xs text-muted-foreground font-mono overflow-hidden">
                              {template.content.split('\n').slice(0, 3).join('\n')}
                              {template.content.split('\n').length > 3 && '\n...'}
                            </pre>
                          </div>
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTemplateSelect(template);
                            }}
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            Usa Template
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {!isLoading && filteredTemplates.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
                  {selectedCategory !== 'all' ? ` nella categoria ${selectedCategory}` : ' disponibili'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadTemplates}
                  disabled={isLoading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Aggiorna
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

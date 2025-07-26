'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Download,
  AlertCircle,
  Eye
} from 'lucide-react';
import { useTheme } from 'next-themes';

interface MermaidPreviewProps {
  content: string;
  isValid?: boolean;
  onRenderError?: (error: string) => void;
  onRenderSuccess?: () => void;
}

export function MermaidPreview({
  content,
  isValid = true,
  onRenderError,
  onRenderSuccess
}: MermaidPreviewProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [lastRenderedContent, setLastRenderedContent] = useState('');

  // Initialize Mermaid
  useEffect(() => {
    const initMermaid = () => {
      mermaid.initialize({
        startOnLoad: true,
        theme: theme === 'dark' ? 'dark' : 'default',
        securityLevel: 'loose',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 14,
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: 'basis',
        },
        sequence: {
          actorMargin: 50,
          width: 150,
          height: 65,
          boxMargin: 10,
          boxTextMargin: 5,
          noteMargin: 10,
          messageMargin: 35,
          mirrorActors: true,
          bottomMarginAdj: 1,
          useMaxWidth: true,
        },
        gantt: {
          titleTopMargin: 25,
          barHeight: 20,
          fontSize: 12,
          sectionFontSize: 24,
          gridLineStartPadding: 35,
          leftPadding: 75,
          topPadding: 50,
          topAxis: false,
        },
        class: {
          useMaxWidth: true,
        },
        state: {
          useMaxWidth: true,
        },
        er: {
          useMaxWidth: true,
        },
        pie: {
          useMaxWidth: true,
        },
      });
    };

    initMermaid();
  }, [theme]);

  // Re-initialize when theme changes
  useEffect(() => {
    mermaid.initialize({
      theme: theme === 'dark' ? 'dark' : 'default',
      securityLevel: 'loose',
    });

    // Re-render if content exists
    if (content.trim() && content !== lastRenderedContent) {
      renderDiagram();
    }
  }, [theme]);

  // Render diagram when content changes
  useEffect(() => {
    if (content.trim() && content !== lastRenderedContent && isValid) {
      const timeoutId = setTimeout(() => {
        renderDiagram();
      }, 500); // Debounce rendering

      return () => clearTimeout(timeoutId);
    }
  }, [content, isValid]);

  const renderDiagram = async () => {
    if (!containerRef.current || !content.trim()) return;

    setIsRendering(true);
    setRenderError(null);

    try {
      // Clear previous content
      containerRef.current.innerHTML = '';

      // Generate unique ID for this render
      const id = `mermaid-${Date.now()}`;

      // Create a temporary div for rendering
      const tempDiv = document.createElement('div');
      tempDiv.id = id;
      containerRef.current.appendChild(tempDiv);

      // Render the diagram
      const { svg } = await mermaid.render(id, content);

      // Replace the temp div with the rendered SVG
      containerRef.current.innerHTML = svg;

      // Apply zoom
      const svgElement = containerRef.current.querySelector('svg');
      if (svgElement) {
        svgElement.style.transform = `scale(${zoom})`;
        svgElement.style.transformOrigin = 'top left';
        svgElement.style.width = '100%';
        svgElement.style.height = 'auto';
      }

      setLastRenderedContent(content);
      onRenderSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore di rendering sconosciuto';
      setRenderError(errorMessage);
      onRenderError?.(errorMessage);

      // Show error in container
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div class="flex items-center justify-center h-full text-red-500">
            <div class="text-center">
              <div class="text-lg font-semibold mb-2">Errore di Rendering</div>
              <div class="text-sm">${errorMessage}</div>
            </div>
          </div>
        `;
      }
    } finally {
      setIsRendering(false);
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.2, 3);
    setZoom(newZoom);

    const svgElement = containerRef.current?.querySelector('svg');
    if (svgElement) {
      svgElement.style.transform = `scale(${newZoom})`;
    }
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.2, 0.5);
    setZoom(newZoom);

    const svgElement = containerRef.current?.querySelector('svg');
    if (svgElement) {
      svgElement.style.transform = `scale(${newZoom})`;
    }
  };

  const handleReset = () => {
    setZoom(1);
    renderDiagram();
  };

  const handleDownloadSVG = () => {
    const svgElement = containerRef.current?.querySelector('svg');
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = 'mermaid-diagram.svg';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(svgUrl);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Preview Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Live Preview
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Zoom: {Math.round(zoom * 100)}%
              </Badge>
              {isRendering && (
                <Badge variant="secondary" className="text-xs">
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Rendering...
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleReset}
              disabled={isRendering}
              size="sm"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Aggiorna
            </Button>

            <Button
              onClick={handleZoomIn}
              disabled={isRendering || zoom >= 3}
              size="sm"
              variant="outline"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>

            <Button
              onClick={handleZoomOut}
              disabled={isRendering || zoom <= 0.5}
              size="sm"
              variant="outline"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>

            <Button
              onClick={handleDownloadSVG}
              disabled={isRendering || !lastRenderedContent}
              size="sm"
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              SVG
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Content */}
      <Card className="flex-1">
        <CardContent className="p-4 h-full">
          {!content.trim() ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nessun contenuto da visualizzare</p>
                <p className="text-sm">Inizia a scrivere del codice Mermaid per vedere il preview</p>
              </div>
            </div>
          ) : !isValid ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                <p className="text-lg font-medium text-red-700">Errori di sintassi</p>
                <p className="text-sm">Correggi gli errori nell'editor per vedere il preview</p>
              </div>
            </div>
          ) : (
            <div
              ref={containerRef}
              className="w-full h-full overflow-auto bg-background rounded-md border"
              style={{
                minHeight: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {renderError && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Errore di rendering:</strong> {renderError}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

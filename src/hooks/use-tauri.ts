import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import { useState, useCallback } from 'react';

// Types matching the Rust backend
export interface RecentFile {
  path: string;
  name: string;
  last_opened: string;
}

export interface FileContent {
  content: string;
  path?: string;
}

export interface ValidationResult {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  category: string;
}

export const useTauri = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveFile = useCallback(async (content: string, path?: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await invoke<string>('save_file', { content, path });
      return result;
    } catch (err) {
      const errorMessage = err as string;
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadFile = useCallback(async (path?: string): Promise<FileContent> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await invoke<FileContent>('load_file', { path });
      return result;
    } catch (err) {
      const errorMessage = err as string;
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateMermaidSyntax = useCallback(async (content: string): Promise<ValidationResult> => {
    try {
      const result = await invoke<ValidationResult>('validate_mermaid_syntax', { content });
      return result;
    } catch (err) {
      const errorMessage = err as string;
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const getRecentFiles = useCallback(async (): Promise<RecentFile[]> => {
    try {
      const result = await invoke<RecentFile[]>('get_recent_files');
      return result;
    } catch (err) {
      const errorMessage = err as string;
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const clearRecentFiles = useCallback(async (): Promise<void> => {
    try {
      await invoke('clear_recent_files');
    } catch (err) {
      const errorMessage = err as string;
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const getTemplates = useCallback(async (): Promise<Template[]> => {
    try {
      const result = await invoke<Template[]>('get_templates');
      return result;
    } catch (err) {
      const errorMessage = err as string;
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const exportDiagram = useCallback(async (content: string, format: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await invoke<string>('export_diagram', { content, format });
      return result;
    } catch (err) {
      const errorMessage = err as string;
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    saveFile,
    loadFile,
    validateMermaidSyntax,
    getRecentFiles,
    clearRecentFiles,
    getTemplates,
    exportDiagram,
    isLoading,
    error,
  };
};
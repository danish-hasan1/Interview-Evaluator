'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

interface UploadedFile {
  name: string;
  size: number;
  status: 'parsing' | 'success' | 'error';
  error?: string;
}

async function parseFileViaAPI(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/parse-file', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to parse file');
  }

  return data.text;
}

function mergeTranscripts(texts: string[]): string {
  return texts
    .map((text, index) => `--- TRANSCRIPT ${index + 1} ---\n\n${text.trim()}`)
    .join('\n\n');
}

export function FileUpload() {
  const { transcript, setTranscript, analysisType } = useAppStore();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const isMultiple = analysisType === 'interviewerAudit';

  const processFiles = useCallback(
    async (files: File[]) => {
      const newFiles: UploadedFile[] = files.map((f) => ({
        name: f.name,
        size: f.size,
        status: 'parsing' as const,
      }));
      setUploadedFiles((prev) => [...prev, ...newFiles]);

      const parsedTexts: string[] = [];

      for (const file of files) {
        try {
          const text = await parseFileViaAPI(file);
          parsedTexts.push(text);
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.name === file.name && f.status === 'parsing'
                ? { ...f, status: 'success' }
                : f
            )
          );
        } catch (err) {
          const errorMsg =
            err instanceof Error ? err.message : 'Failed to parse file';
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.name === file.name && f.status === 'parsing'
                ? { ...f, status: 'error', error: errorMsg }
                : f
            )
          );
        }
      }

      if (parsedTexts.length > 0) {
        let newText: string;
        if (isMultiple && parsedTexts.length > 1) {
          newText = mergeTranscripts(parsedTexts);
        } else {
          newText = parsedTexts.join('\n\n');
        }
        setTranscript(transcript ? `${transcript}\n\n${newText}` : newText);
      }
    },
    [transcript, setTranscript, isMultiple]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: processFiles,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        ['.docx'],
    },
    multiple: isMultiple,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
    onDropRejected: () => setIsDragging(false),
  });

  const removeFile = (name: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground flex items-center gap-2">
          <Upload className="w-4 h-4 text-muted-foreground" />
          Upload Transcript{isMultiple ? 's' : ''}
        </span>
        <span className="text-xs text-muted-foreground">
          .txt, .pdf, .docx{isMultiple ? ' · Multiple files' : ''}
        </span>
      </div>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors duration-200',
          'flex flex-col items-center justify-center gap-3 text-center',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-primary/5'
        )}
      >
        <input {...getInputProps()} />
        <motion.div
          animate={{ scale: isDragging ? 1.1 : 1 }}
          className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"
        >
          <Upload className="w-6 h-6 text-primary" />
        </motion.div>
        <div>
          <p className="text-sm font-medium text-foreground">
            {isDragging
              ? 'Drop files here...'
              : 'Drop files or click to browse'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isMultiple
              ? 'Upload multiple transcripts for audit analysis'
              : 'Supports PDF, DOCX, and TXT files'}
          </p>
        </div>
      </div>

      {/* File List */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <div className="flex flex-col gap-2">
            {uploadedFiles.map((file) => (
              <motion.div
                key={`${file.name}-${file.size}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm',
                  file.status === 'success' &&
                    'border-emerald-500/30 bg-emerald-500/5',
                  file.status === 'error' &&
                    'border-destructive/30 bg-destructive/5',
                  file.status === 'parsing' && 'border-border bg-muted/50'
                )}
              >
                <File className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-foreground font-medium">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {file.error || formatSize(file.size)}
                  </p>
                </div>
                {file.status === 'parsing' && (
                  <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
                )}
                {file.status === 'success' && (
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                )}
                {file.status === 'error' && (
                  <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                )}
                <button
                  onClick={() => removeFile(file.name)}
                  className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Clipboard, Trash2, FileDown, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
import { copyToClipboard, exportToPDF, exportToDOCX } from '@/lib/exportUtils';
import { generateHistoryTitle } from '@/lib/historyUtils';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ActionBarProps {
  onAnalyze: () => Promise<void>;
}

export function ActionBar({ onAnalyze }: ActionBarProps) {
  // Individual selectors — only re-renders when these specific values change
  const transcript   = useAppStore((s) => s.transcript);
  const result       = useAppStore((s) => s.result);
  const isLoading    = useAppStore((s) => s.isLoading);
  const isStreaming  = useAppStore((s) => s.isStreaming);
  const analysisType = useAppStore((s) => s.analysisType);
  const clearAll     = useAppStore((s) => s.clearAll);

  const [copying, setCopying]             = useState(false);
  const [exportingPDF, setExportingPDF]   = useState(false);
  const [exportingDOCX, setExportingDOCX] = useState(false);

  const canAnalyze = transcript.trim().length > 0 && !isLoading && !isStreaming;
  const hasResult  = result.trim().length > 0;
  const isActive   = isLoading || isStreaming;

  const handleCopy = async () => {
    if (!result) return;
    setCopying(true);
    await copyToClipboard(result);
    setTimeout(() => setCopying(false), 2000);
  };

  const handleExportPDF = async () => {
    if (!result) return;
    setExportingPDF(true);
    await exportToPDF(result, generateHistoryTitle(analysisType, result));
    setExportingPDF(false);
  };

  const handleExportDOCX = async () => {
    if (!result) return;
    setExportingDOCX(true);
    await exportToDOCX(result, generateHistoryTitle(analysisType, result));
    setExportingDOCX(false);
  };

  return (
    <div className="flex-shrink-0 border-t border-border bg-card/80 backdrop-blur-sm px-6 py-4">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Primary Analyze Button */}
        <motion.div
          whileHover={canAnalyze ? { scale: 1.02 } : {}}
          whileTap={canAnalyze ? { scale: 0.98 } : {}}
        >
          <Button
            onClick={onAnalyze}
            disabled={!canAnalyze}
            variant="gradient"
            size="lg"
            className={cn('relative min-w-[180px] font-semibold', isActive && 'animate-pulse-glow')}
          >
            <AnimatePresence mode="wait">
              {isActive ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Transcript</span>
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>

        {/* Clear Button */}
        <Button onClick={clearAll} variant="outline" size="lg" disabled={isActive} className="gap-2">
          <Trash2 className="w-4 h-4" />
          Clear
        </Button>

        {/* Result actions — only shown when there is a result */}
        <AnimatePresence>
          {hasResult && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-2 ml-auto"
            >
              <Button onClick={handleCopy} variant="outline" size="default" className="gap-2">
                <Clipboard className="w-4 h-4" />
                {copying ? 'Copied!' : 'Copy'}
              </Button>
              <Button onClick={handleExportPDF} variant="outline" size="default" disabled={exportingPDF} className="gap-2">
                {exportingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                PDF
              </Button>
              <Button onClick={handleExportDOCX} variant="outline" size="default" disabled={exportingDOCX} className="gap-2">
                {exportingDOCX ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                DOCX
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Streaming dots indicator */}
        <AnimatePresence>
          {isStreaming && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <div className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 bg-primary rounded-full"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
              <span>Generating analysis...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

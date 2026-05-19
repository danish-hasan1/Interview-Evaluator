'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ActionBar } from '@/components/layout/ActionBar';
import { AnalysisTypeCard } from '@/components/analysis/AnalysisTypeCard';
import { TranscriptInput } from '@/components/analysis/TranscriptInput';
import { FileUpload } from '@/components/analysis/FileUpload';
import { AnalysisResult } from '@/components/analysis/AnalysisResult';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { HistoryPanel } from '@/components/history/HistoryPanel';
import { useAppStore } from '@/store/useAppStore';
import { generateHistoryTitle } from '@/lib/historyUtils';
import { Separator } from '@/components/ui/separator';

function AnalysisView() {
  const {
    transcript,
    analysisType,
    result,
    settings,
    isStreaming,
    setResult,
    appendToResult,
    setLoading,
    setStreaming,
    setError,
    addToHistory,
  } = useAppStore();

  const handleAnalyze = async () => {
    if (!transcript.trim()) return;

    setResult('');
    setError(null);
    setLoading(true);
    setStreaming(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          analysisType,
          settings: {
            groqApiKey: settings.groqApiKey,
            model: settings.model,
            temperature: settings.temperature,
            maxTokens: settings.maxTokens,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Analysis failed',
        }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Failed to read response stream');

      const decoder = new TextDecoder();
      let fullResult = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullResult += chunk;
        appendToResult(chunk);
      }

      // Save to history
      if (fullResult.trim()) {
        const historyEntry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          title: generateHistoryTitle(analysisType, transcript),
          timestamp: Date.now(),
          analysisType,
          transcript,
          result: fullResult,
        };
        addToHistory(historyEntry);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Analysis Type Selection */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Analysis Type
            </h3>
            <AnalysisTypeCard />
          </section>

          <Separator />

          {/* File Upload */}
          <section>
            <FileUpload />
          </section>

          <Separator />

          {/* Transcript Input */}
          <section>
            <TranscriptInput />
          </section>

          {/* Result */}
          <AnimatePresence>
            {(result || useAppStore.getState().isLoading) && (
              <motion.section
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Separator className="mb-6" />
                <AnalysisResult />
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Action Bar - sticky at bottom */}
      <ActionBar onAnalyze={handleAnalyze} />
    </div>
  );
}

export default function Home() {
  const { activeView } = useAppStore();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeView === 'analysis' && (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <AnalysisView />
              </motion.div>
            )}

            {activeView === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-y-auto"
              >
                <div className="max-w-4xl mx-auto p-6">
                  <HistoryPanel />
                </div>
              </motion.div>
            )}

            {activeView === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-y-auto"
              >
                <div className="max-w-4xl mx-auto p-6">
                  <SettingsPanel />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

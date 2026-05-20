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
  // Individual selectors — this component only re-renders when one of these changes
  const transcript   = useAppStore((s) => s.transcript);
  const analysisType = useAppStore((s) => s.analysisType);
  const result       = useAppStore((s) => s.result);
  const isLoading    = useAppStore((s) => s.isLoading);
  const settings     = useAppStore((s) => s.settings);
  const setResult     = useAppStore((s) => s.setResult);
  const appendToResult = useAppStore((s) => s.appendToResult);
  const setLoading    = useAppStore((s) => s.setLoading);
  const setStreaming   = useAppStore((s) => s.setStreaming);
  const error         = useAppStore((s) => s.error);
  const setError      = useAppStore((s) => s.setError);
  const addToHistory  = useAppStore((s) => s.addToHistory);

  const showResult = result.length > 0 || isLoading || !!error;

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
            groqApiKey:   settings.groqApiKey,
            geminiApiKey: settings.geminiApiKey,
            model:        settings.model,
            temperature:  settings.temperature,
            maxTokens:    settings.maxTokens,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Analysis failed' }));
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

      if (fullResult.trim()) {
        addToHistory({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          title: generateHistoryTitle(analysisType, transcript),
          timestamp: Date.now(),
          analysisType,
          transcript,
          result: fullResult,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Analysis Type
            </h3>
            <AnalysisTypeCard />
          </section>

          <Separator />

          <section>
            <FileUpload />
          </section>

          <Separator />

          <section>
            <TranscriptInput />
          </section>

          {/* Result — rendered conditionally without AnimatePresence to avoid remount blink */}
          {showResult && (
            <section>
              <Separator className="mb-6" />
              <AnalysisResult />
            </section>
          )}
        </div>
      </div>

      <ActionBar onAnalyze={handleAnalyze} />
    </div>
  );
}

export default function Home() {
  // Only subscribes to activeView — won't re-render on transcript/result changes
  const activeView = useAppStore((s) => s.activeView);

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

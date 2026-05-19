'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trash2, RotateCcw, User, Users, FileText, BarChart2, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AnalysisHistory, AnalysisType } from '@/types';

const typeConfig: Record<AnalysisType, { icon: React.ElementType; label: string; color: 'info' | 'success' | 'warning' | 'purple' }> = {
  candidate: { icon: User, label: 'Candidate', color: 'info' },
  interviewer: { icon: Users, label: 'Interviewer', color: 'success' },
  taSummary: { icon: FileText, label: 'TA Summary', color: 'warning' },
  interviewerAudit: { icon: BarChart2, label: 'Audit', color: 'purple' },
};

function HistoryCard({
  entry,
  onRestore,
  onDelete,
}: {
  entry: AnalysisHistory;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const config = typeConfig[entry.analysisType];
  const Icon = config.icon;

  const date = new Date(entry.timestamp);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const wordCount = entry.result.trim().split(/\s+/).length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="group flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:border-border/80 hover:bg-accent/20 transition-all duration-200"
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant={config.color} className="text-xs">
            {config.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formattedDate} · {formattedTime}
          </span>
        </div>
        <p className="text-sm font-medium text-foreground truncate">
          {entry.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {wordCount.toLocaleString()} words in result
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <Button
          onClick={onRestore}
          variant="ghost"
          size="icon"
          className="w-8 h-8 hover:bg-primary/10 hover:text-primary"
          title="Restore this analysis"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
        <Button
          onClick={onDelete}
          variant="ghost"
          size="icon"
          className="w-8 h-8 hover:bg-destructive/10 hover:text-destructive"
          title="Delete this entry"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

export function HistoryPanel() {
  const { history, deleteHistoryEntry, clearHistory, restoreFromHistory } =
    useAppStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{history.length} saved analyses</span>
        </div>
        {history.length > 0 && (
          <Button
            onClick={clearHistory}
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All
          </Button>
        )}
      </div>

      {/* History List */}
      <AnimatePresence mode="popLayout">
        {history.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">
              No analyses yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your completed analyses will appear here. Start by analyzing an
              interview transcript.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {history.map((entry) => (
              <HistoryCard
                key={entry.id}
                entry={entry}
                onRestore={() => restoreFromHistory(entry)}
                onDelete={() => deleteHistoryEntry(entry.id)}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

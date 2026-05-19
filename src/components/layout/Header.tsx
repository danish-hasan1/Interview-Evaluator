'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Badge } from '@/components/ui/badge';
import type { ActiveView, AnalysisType } from '@/types';

const viewConfig: Record<ActiveView, { title: string; description: string }> = {
  analysis: {
    title: 'Analysis Studio',
    description: 'Paste or upload an interview transcript to begin AI-powered evaluation',
  },
  history: {
    title: 'Analysis History',
    description: 'Browse and restore your past interview analyses',
  },
  settings: {
    title: 'Settings',
    description: 'Configure your API key, model parameters, and preferences',
  },
};

const analysisTypeConfig: Record<AnalysisType, { title: string; description: string; color: string }> = {
  candidate: {
    title: 'Candidate Analysis',
    description: 'Deep evaluation of candidate performance across technical, communication, and cultural dimensions',
    color: 'info',
  },
  interviewer: {
    title: 'Interviewer Analysis',
    description: 'Assess the quality and effectiveness of the interviewer\'s technique and approach',
    color: 'success',
  },
  taSummary: {
    title: 'TA Summary',
    description: 'Generate a concise, recruiter-friendly summary for hiring managers',
    color: 'warning',
  },
  interviewerAudit: {
    title: 'Interviewer Audit',
    description: 'Comprehensive multi-transcript audit of an interviewer\'s patterns and consistency',
    color: 'teal',
  },
};

export function Header() {
  const activeView = useAppStore((s) => s.activeView);
  const analysisType = useAppStore((s) => s.analysisType);

  const config =
    activeView === 'analysis'
      ? analysisTypeConfig[analysisType]
      : viewConfig[activeView];

  const title =
    activeView === 'analysis'
      ? analysisTypeConfig[analysisType].title
      : viewConfig[activeView].title;

  const description =
    activeView === 'analysis'
      ? analysisTypeConfig[analysisType].description
      : viewConfig[activeView].description;

  return (
    <motion.header
      key={`${activeView}-${analysisType}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0"
    >
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          {activeView === 'analysis' && (
            <Badge
              variant={
                (analysisTypeConfig[analysisType].color as 'info' | 'success' | 'warning' | 'teal') ||
                'default'
              }
              className="text-xs"
            >
              {analysisType === 'taSummary'
                ? 'TA'
                : analysisType === 'interviewerAudit'
                ? 'Audit'
                : analysisType.charAt(0).toUpperCase() + analysisType.slice(1)}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">{description}</p>
      </div>
    </motion.header>
  );
}

'use client';

import { motion } from 'framer-motion';
import { User, Users, FileText, BarChart2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import type { AnalysisType } from '@/types';

interface AnalysisTypeConfig {
  type: AnalysisType;
  icon: React.ElementType;
  label: string;
  description: string;
  gradient: string;
  iconBg: string;
  iconColor: string;
  border: string;
}

const analysisTypes: AnalysisTypeConfig[] = [
  {
    type: 'candidate',
    icon: User,
    label: 'Candidate Analysis',
    description: 'Deep evaluation of technical skills, communication, and cultural fit with hiring recommendation',
    gradient: 'from-blue-600/10 to-cyan-600/10',
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
    border: 'border-blue-500/40',
  },
  {
    type: 'interviewer',
    icon: Users,
    label: 'Interviewer Analysis',
    description: 'Assess question quality, probing effectiveness, and interviewer technique',
    gradient: 'from-emerald-600/10 to-teal-600/10',
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
    border: 'border-emerald-500/40',
  },
  {
    type: 'taSummary',
    icon: FileText,
    label: 'TA Summary',
    description: 'Concise, recruiter-friendly summary with risk assessment and next steps',
    gradient: 'from-amber-600/10 to-orange-600/10',
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
    border: 'border-amber-500/40',
  },
  {
    type: 'interviewerAudit',
    icon: BarChart2,
    label: 'Interviewer Audit',
    description: 'Multi-transcript audit for bias detection, consistency, and panel readiness',
    gradient: 'from-rose-600/10 to-pink-600/10',
    iconBg: 'bg-rose-500/15',
    iconColor: 'text-rose-400',
    border: 'border-rose-500/40',
  },
];

export function AnalysisTypeCard() {
  const { analysisType, setAnalysisType } = useAppStore();

  return (
    <div className="grid grid-cols-2 gap-3">
      {analysisTypes.map((config, index) => {
        const Icon = config.icon;
        const isSelected = analysisType === config.type;

        return (
          <motion.button
            key={config.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setAnalysisType(config.type)}
            className={cn(
              'relative flex flex-col gap-3 p-4 rounded-xl border text-left transition-all duration-200',
              isSelected
                ? cn('border-2', config.border, `bg-gradient-to-br`, config.gradient)
                : 'border-border bg-card hover:border-border/80 hover:bg-accent/30'
            )}
          >
            {isSelected && (
              <motion.div
                layoutId="selectedCard"
                className={cn(
                  'absolute inset-0 rounded-xl bg-gradient-to-br opacity-50',
                  config.gradient
                )}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              />
            )}

            <div className="relative flex items-start gap-3">
              <div
                className={cn(
                  'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
                  config.iconBg
                )}
              >
                <Icon className={cn('w-4 h-4', config.iconColor)} />
              </div>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center"
                >
                  <div className="w-2 h-2 bg-white rounded-full" />
                </motion.div>
              )}
            </div>

            <div className="relative">
              <h3
                className={cn(
                  'text-sm font-semibold mb-1',
                  isSelected ? 'text-foreground' : 'text-foreground'
                )}
              >
                {config.label}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {config.description}
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

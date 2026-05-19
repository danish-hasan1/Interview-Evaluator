'use client';

import { motion } from 'framer-motion';
import { X, AlignLeft } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

export function TranscriptInput() {
  const transcript = useAppStore((s) => s.transcript);
  const setTranscript = useAppStore((s) => s.setTranscript);
  const analysisType = useAppStore((s) => s.analysisType);

  const wordCount = transcript.trim()
    ? transcript.trim().split(/\s+/).length
    : 0;
  const charCount = transcript.length;

  const placeholders: Record<string, string> = {
    candidate: `Paste the interview transcript here...

Example format:
Interviewer: Can you tell me about your experience with React?
Candidate: Sure, I've been working with React for about 3 years...

Interviewer: How do you handle state management in large applications?
Candidate: I typically use a combination of...`,
    interviewer: `Paste the interview transcript here to analyze the INTERVIEWER's performance...

The AI will evaluate question quality, probing effectiveness, bias indicators, and provide specific training recommendations.`,
    taSummary: `Paste the interview transcript here to generate a TA/Recruiter summary...

The AI will produce an executive summary, candidate snapshot, hiring recommendation, and risk assessment ready to share with hiring managers.`,
    interviewerAudit: `Paste MULTIPLE interview transcripts here (separated by --- TRANSCRIPT N ---) to audit interviewer consistency...

The AI will analyze patterns, consistency, bias, and provide a comprehensive capability assessment across all interviews.`,
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <AlignLeft className="w-4 h-4 text-muted-foreground" />
          Interview Transcript
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {wordCount.toLocaleString()} words · {charCount.toLocaleString()} chars
          </span>
          {transcript && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setTranscript('')}
              className="w-6 h-6 rounded-md bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center transition-colors"
            >
              <X className="w-3 h-3 text-destructive" />
            </motion.button>
          )}
        </div>
      </div>

      <div className="relative">
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={placeholders[analysisType] || placeholders.candidate}
          className={cn(
            'w-full min-h-[320px] rounded-xl border border-input bg-background px-4 py-3 text-sm',
            'placeholder:text-muted-foreground/60 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
            'transition-all duration-200 font-mono leading-relaxed',
            'scrollbar-thin'
          )}
          spellCheck={false}
        />
        {transcript.length === 0 && (
          <div className="absolute bottom-4 right-4 text-xs text-muted-foreground/40 pointer-events-none">
            Min. 100 characters recommended
          </div>
        )}
      </div>
    </div>
  );
}

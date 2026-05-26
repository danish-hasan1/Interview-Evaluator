'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

export function JobDescriptionInput() {
  const jobDescription    = useAppStore((s) => s.jobDescription);
  const setJobDescription = useAppStore((s) => s.setJobDescription);
  const [open, setOpen]   = useState(!!jobDescription);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full group"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Briefcase className="w-4 h-4 text-muted-foreground" />
          Job Description
          <span className="text-xs font-normal text-muted-foreground">(optional — improves role-fit analysis)</span>
        </div>
        <div className="flex items-center gap-2">
          {jobDescription && !open && (
            <span className="text-xs text-primary font-medium">JD added</span>
          )}
          {open
            ? <ChevronUp  className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          }
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="jd-input"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="relative">
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder={`Paste the job description here...

Example:
Role: Senior Backend Engineer
Requirements:
- 5+ years of Node.js / Python experience
- Strong experience with distributed systems
- Familiarity with AWS, Docker, Kubernetes
- Experience leading technical teams`}
                className={cn(
                  'w-full min-h-[180px] rounded-xl border border-input bg-background px-4 py-3 text-sm',
                  'placeholder:text-muted-foreground/60 resize-none',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
                  'transition-all duration-200 font-mono leading-relaxed',
                  'scrollbar-thin'
                )}
                spellCheck={false}
              />
              {jobDescription && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  type="button"
                  onClick={() => setJobDescription('')}
                  className="absolute top-3 right-3 w-6 h-6 rounded-md bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3 text-destructive" />
                </motion.button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              When provided, the AI evaluates the candidate specifically against these requirements and flags alignment gaps.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

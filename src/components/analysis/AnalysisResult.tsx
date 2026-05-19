'use client';

import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

function SkeletonLoader() {
  return (
    <div className="space-y-4 p-6">
      <div className="space-y-2">
        <div className="shimmer h-6 w-48 rounded-lg" />
        <div className="shimmer h-4 w-full rounded" />
        <div className="shimmer h-4 w-5/6 rounded" />
        <div className="shimmer h-4 w-4/6 rounded" />
      </div>
      <div className="space-y-2">
        <div className="shimmer h-5 w-40 rounded-lg" />
        <div className="shimmer h-4 w-full rounded" />
        <div className="shimmer h-4 w-3/4 rounded" />
      </div>
      <div className="space-y-2">
        <div className="shimmer h-5 w-44 rounded-lg" />
        <div className="shimmer h-4 w-full rounded" />
        <div className="shimmer h-4 w-5/6 rounded" />
        <div className="shimmer h-4 w-2/3 rounded" />
      </div>
      <div className="space-y-2">
        <div className="shimmer h-5 w-36 rounded-lg" />
        <div className="shimmer h-4 w-full rounded" />
        <div className="shimmer h-4 w-4/5 rounded" />
      </div>
    </div>
  );
}

export function AnalysisResult() {
  const result = useAppStore((s) => s.result);
  const isLoading = useAppStore((s) => s.isLoading);
  const isStreaming = useAppStore((s) => s.isStreaming);
  const error = useAppStore((s) => s.error);
  const hasContent = result.trim().length > 0;

  if (!hasContent && !isLoading && !isStreaming && !error) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden"
    >
      {/* Result Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            AI Analysis
          </span>
          {isStreaming && (
            <span className="text-xs text-muted-foreground streaming-cursor" />
          )}
        </div>
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5 text-xs text-primary"
          >
            <motion.div
              className="w-1.5 h-1.5 bg-primary rounded-full"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            Streaming
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {isLoading && !hasContent ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SkeletonLoader />
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6"
            >
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm font-semibold text-destructive mb-1">
                  Analysis Error
                </p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 overflow-y-auto max-h-[600px]"
            >
              <div className="prose-interview">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-2xl font-bold text-foreground mt-6 mb-3 pb-2 border-b border-border first:mt-0">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xl font-semibold text-foreground mt-5 mb-2 flex items-center gap-2">
                        <span className="w-1 h-5 bg-primary rounded-full inline-block flex-shrink-0" />
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-base font-semibold text-foreground mt-4 mb-1.5">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-3 text-sm leading-7 text-foreground/90">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-3 space-y-1 pl-1">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-3 space-y-1 pl-5 list-decimal">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-sm leading-6 text-foreground/90 flex items-start gap-2">
                        <span className="mt-2 w-1.5 h-1.5 bg-primary/60 rounded-full flex-shrink-0" />
                        <span>{children}</span>
                      </li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-foreground">
                        {children}
                      </strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-muted-foreground">{children}</em>
                    ),
                    code: ({ children, className }) => {
                      const isBlock = className?.includes('language-');
                      if (isBlock) {
                        return (
                          <code className="block bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto mb-3">
                            {children}
                          </code>
                        );
                      }
                      return (
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary">
                          {children}
                        </code>
                      );
                    },
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-3 rounded-r-lg bg-primary/5 py-2">
                        {children}
                      </blockquote>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto mb-3">
                        <table className="w-full border-collapse text-sm">
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border border-border px-3 py-2 bg-muted font-semibold text-left">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-border px-3 py-2">
                        {children}
                      </td>
                    ),
                    hr: () => <hr className="border-border my-4" />,
                  }}
                >
                  {result}
                </ReactMarkdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

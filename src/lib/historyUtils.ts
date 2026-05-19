import type { AnalysisHistory } from '@/types';

const STORAGE_KEY = 'interview-evaluator-history';

export function loadHistory(): AnalysisHistory[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistory(history: AnalysisHistory[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Silently fail if storage is full
  }
}

export function generateHistoryTitle(analysisType: string, transcript: string): string {
  const typeLabels: Record<string, string> = {
    candidate: 'Candidate Analysis',
    interviewer: 'Interviewer Analysis',
    taSummary: 'TA Summary',
    interviewerAudit: 'Interviewer Audit',
  };

  const label = typeLabels[analysisType] || 'Analysis';
  // Extract first meaningful line from transcript as subtitle
  const firstLine = transcript.split('\n').find((line) => line.trim().length > 10)?.trim() || '';
  const subtitle = firstLine.length > 40 ? firstLine.substring(0, 40) + '...' : firstLine;

  return subtitle ? `${label}: ${subtitle}` : label;
}

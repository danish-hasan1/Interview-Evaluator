export type AnalysisType = 'candidate' | 'interviewer' | 'taSummary' | 'interviewerAudit';

export interface AnalysisHistory {
  id: string;
  title: string;
  timestamp: number;
  analysisType: AnalysisType;
  transcript: string;
  result: string;
}

export interface AppSettings {
  groqApiKey: string;
  geminiApiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  theme: 'dark' | 'light' | 'system';
}

export type ActiveView = 'analysis' | 'history' | 'settings';

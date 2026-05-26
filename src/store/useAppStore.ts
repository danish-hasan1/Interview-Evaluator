'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AnalysisType, AnalysisHistory, AppSettings, ActiveView } from '@/types';

interface AppState {
  // Core analysis state
  transcript: string;
  jobDescription: string;
  analysisType: AnalysisType;
  result: string;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  uploadedFiles: File[];
  activeView: ActiveView;

  // Persisted state
  history: AnalysisHistory[];
  settings: AppSettings;

  // Actions
  setTranscript: (transcript: string) => void;
  setJobDescription: (jd: string) => void;
  setAnalysisType: (type: AnalysisType) => void;
  setResult: (result: string) => void;
  appendToResult: (chunk: string) => void;
  setLoading: (loading: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  setError: (error: string | null) => void;
  setUploadedFiles: (files: File[]) => void;
  setActiveView: (view: ActiveView) => void;
  addToHistory: (entry: AnalysisHistory) => void;
  clearHistory: () => void;
  deleteHistoryEntry: (id: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  clearAll: () => void;
  restoreFromHistory: (entry: AnalysisHistory) => void;
}

const defaultSettings: AppSettings = {
  groqApiKey: '',
  geminiApiKey: '',
  openrouterApiKey: '',
  mistralApiKey: '',
  model: 'gemini-1.5-flash',
  temperature: 0.3,
  maxTokens: 32768,
  theme: 'dark',
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      transcript: '',
      jobDescription: '',
      analysisType: 'candidate',
      result: '',
      isLoading: false,
      isStreaming: false,
      error: null,
      uploadedFiles: [],
      activeView: 'analysis',
      history: [],
      settings: defaultSettings,

      setTranscript: (transcript) => set({ transcript }),
      setJobDescription: (jobDescription) => set({ jobDescription }),
      setAnalysisType: (analysisType) => set({ analysisType }),
      setResult: (result) => set({ result }),
      appendToResult: (chunk) =>
        set((state) => ({ result: state.result + chunk })),
      setLoading: (isLoading) => set({ isLoading }),
      setStreaming: (isStreaming) => set({ isStreaming }),
      setError: (error) => set({ error }),
      setUploadedFiles: (uploadedFiles) => set({ uploadedFiles }),
      setActiveView: (activeView) => set({ activeView }),

      addToHistory: (entry) =>
        set((state) => ({
          history: [entry, ...state.history].slice(0, 50),
        })),

      clearHistory: () => set({ history: [] }),

      deleteHistoryEntry: (id) =>
        set((state) => ({
          history: state.history.filter((h) => h.id !== id),
        })),

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      clearAll: () =>
        set({
          transcript: '',
          jobDescription: '',
          result: '',
          error: null,
          uploadedFiles: [],
        }),

      restoreFromHistory: (entry) =>
        set({
          transcript: entry.transcript,
          analysisType: entry.analysisType,
          result: entry.result,
          activeView: 'analysis',
        }),
    }),
    {
      name: 'interview-evaluator-storage',
      partialize: (state) => ({
        history: state.history,
        settings: state.settings,
      }),
      // Merge defaults so new fields (e.g. geminiApiKey) appear for
      // existing users whose localStorage predates the field.
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as object),
        settings: {
          ...current.settings,
          ...((persisted as { settings?: object }).settings ?? {}),
        },
      }),
    }
  )
);

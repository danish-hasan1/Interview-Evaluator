import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildPrompt as buildCandidatePrompt } from '@/prompts/candidate';
import { buildPrompt as buildInterviewerPrompt } from '@/prompts/interviewer';
import { buildPrompt as buildTaSummaryPrompt } from '@/prompts/taSummary';
import { buildPrompt as buildInterviewerAuditPrompt } from '@/prompts/interviewerAudit';
import type { AnalysisType, AppSettings } from '@/types';

export const maxDuration = 60;

// Groq free tier: ~12 000 TPM — truncate transcripts that would exceed it.
// Gemini free tier: 1 000 000 TPM — no practical limit, skip truncation.
const GROQ_MAX_TRANSCRIPT_CHARS = 40_000;

function isGeminiModel(model: string) {
  return model.startsWith('gemini');
}

function truncateForGroq(text: string): { text: string; truncated: boolean } {
  if (text.length <= GROQ_MAX_TRANSCRIPT_CHARS) return { text, truncated: false };
  const cutoff = text.lastIndexOf('\n', GROQ_MAX_TRANSCRIPT_CHARS);
  const safeIndex = cutoff > GROQ_MAX_TRANSCRIPT_CHARS * 0.8 ? cutoff : GROQ_MAX_TRANSCRIPT_CHARS;
  return { text: text.slice(0, safeIndex), truncated: true };
}

function buildAnalysisPrompt(analysisType: AnalysisType, transcript: string): string {
  switch (analysisType) {
    case 'candidate':        return buildCandidatePrompt(transcript);
    case 'interviewer':      return buildInterviewerPrompt(transcript);
    case 'taSummary':        return buildTaSummaryPrompt(transcript);
    case 'interviewerAudit': return buildInterviewerAuditPrompt(transcript);
    default:                 return buildCandidatePrompt(transcript);
  }
}

function friendlyError(error: unknown): string {
  if (!(error instanceof Error)) return 'An unexpected error occurred. Please try again.';
  const msg = error.message;
  if (msg.includes('rate_limit_exceeded') || msg.includes('Request too large') || msg.includes('tokens per minute')) {
    return 'Transcript is too long for your current plan\'s token limit. Switch to a Gemini model in Settings (it has a 1M token free tier), or split the transcript into smaller parts.';
  }
  if (msg.includes('401') || msg.includes('invalid_api_key') || msg.includes('API_KEY_INVALID') || msg.includes('Authentication')) {
    return 'Invalid API key. Please check your key in Settings.';
  }
  if (msg.includes('429')) {
    return 'Rate limit reached. Please wait a moment and try again.';
  }
  try { return JSON.parse(msg)?.error?.message ?? msg; } catch { return msg; }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, analysisType, settings }: {
      transcript: string;
      analysisType: AnalysisType;
      settings?: Partial<AppSettings>;
    } = body;

    if (!transcript?.trim()) {
      return new Response(JSON.stringify({ error: 'Transcript is required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const model       = settings?.model || 'gemini-1.5-flash';
    const temperature = settings?.temperature ?? 0.3;
    const useGemini   = isGeminiModel(model);

    // Resolve API key — check settings first, then env vars
    const apiKey = useGemini
      ? (settings?.geminiApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '')
      : (settings?.groqApiKey   || process.env.GROQ_API_KEY || '');

    if (!apiKey) {
      const provider = useGemini ? 'Gemini' : 'Groq';
      const envVar   = useGemini ? 'GEMINI_API_KEY' : 'GROQ_API_KEY';
      return new Response(
        JSON.stringify({ error: `${provider} API key not configured. Add it in Settings or set ${envVar} in your environment.` }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Groq: truncate long transcripts to stay within TPM limits
    let safeTranscript = transcript;
    let truncated = false;
    if (!useGemini) {
      const result = truncateForGroq(transcript);
      safeTranscript = result.text;
      truncated = result.truncated;
    }

    const prompt = buildAnalysisPrompt(analysisType, safeTranscript);
    const truncationNotice = truncated
      ? `> ⚠️ **Note:** Transcript was trimmed to ~40 000 characters to fit Groq's free tier token limit. Switch to a Gemini model in Settings for unlimited transcript length.\n\n`
      : '';

    const encoder = new TextEncoder();

    // ── Gemini streaming ──────────────────────────────────────────────
    if (useGemini) {
      const genAI     = new GoogleGenerativeAI(apiKey);
      const gemini    = genAI.getGenerativeModel({
        model,
        generationConfig: { temperature, maxOutputTokens: 8192 },
      });

      const readable = new ReadableStream({
        async start(controller) {
          try {
            const result = await gemini.generateContentStream(prompt);
            for await (const chunk of result.stream) {
              const text = chunk.text();
              if (text) controller.enqueue(encoder.encode(text));
            }
            controller.close();
          } catch (err) {
            controller.enqueue(encoder.encode(`\n\n> **Error:** ${friendlyError(err)}`));
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' },
      });
    }

    // ── Groq streaming ────────────────────────────────────────────────
    const groq   = new Groq({ apiKey });
    const stream = await groq.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      temperature,
    });

    const readable = new ReadableStream({
      async start(controller) {
        if (truncationNotice) controller.enqueue(encoder.encode(truncationNotice));
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (err) {
          controller.enqueue(encoder.encode(`\n\n> **Error:** ${friendlyError(err)}`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: friendlyError(error) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}

import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import { buildPrompt as buildCandidatePrompt } from '@/prompts/candidate';
import { buildPrompt as buildInterviewerPrompt } from '@/prompts/interviewer';
import { buildPrompt as buildTaSummaryPrompt } from '@/prompts/taSummary';
import { buildPrompt as buildInterviewerAuditPrompt } from '@/prompts/interviewerAudit';
import type { AnalysisType, AppSettings } from '@/types';

export const maxDuration = 60;

// Conservative safe limit: 11 000 tokens of input (chars / 4 ≈ tokens).
// Free Groq tier allows 12 000 TPM; our largest prompt template uses ~650
// tokens, leaving ~11 350 for transcript. We truncate at 44 000 chars
// (~11 000 tokens) so there is always headroom for the prompt wrapper.
const MAX_TRANSCRIPT_CHARS = 44_000;

function truncateTranscript(text: string): { text: string; truncated: boolean } {
  if (text.length <= MAX_TRANSCRIPT_CHARS) return { text, truncated: false };
  // Truncate at the last newline before the limit so we don't cut mid-sentence
  const cutoff = text.lastIndexOf('\n', MAX_TRANSCRIPT_CHARS);
  const safeIndex = cutoff > MAX_TRANSCRIPT_CHARS * 0.8 ? cutoff : MAX_TRANSCRIPT_CHARS;
  return {
    text: text.slice(0, safeIndex),
    truncated: true,
  };
}

function friendlyGroqError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    // Groq rate limit / too large
    if (msg.includes('rate_limit_exceeded') || msg.includes('Request too large') || msg.includes('tokens per minute')) {
      return 'Transcript is too long for your Groq plan\'s token limit. Try splitting the transcript into smaller sections, or upgrade to a paid Groq tier at console.groq.com/settings/billing';
    }
    if (msg.includes('401') || msg.includes('invalid_api_key') || msg.includes('Authentication')) {
      return 'Invalid Groq API key. Please check your key in Settings.';
    }
    if (msg.includes('429')) {
      return 'Groq rate limit reached. Please wait a moment and try again.';
    }
    // Strip raw JSON from error messages
    try {
      const parsed = JSON.parse(msg);
      return parsed?.error?.message ?? msg;
    } catch {
      return msg;
    }
  }
  return 'An unexpected error occurred. Please try again.';
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
      return new Response(
        JSON.stringify({ error: 'Transcript is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = settings?.groqApiKey || process.env.GROQ_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Groq API key not configured. Please add your API key in Settings.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Truncate if transcript exceeds safe token limit
    const { text: safeTranscript, truncated } = truncateTranscript(transcript);
    const truncationNotice = truncated
      ? `> ⚠️ **Note:** This transcript exceeded the token limit and was trimmed to the first ~44 000 characters for analysis. For full coverage, split the transcript into parts and run separate analyses.\n\n`
      : '';

    let prompt: string;
    switch (analysisType) {
      case 'candidate':        prompt = buildCandidatePrompt(safeTranscript);        break;
      case 'interviewer':      prompt = buildInterviewerPrompt(safeTranscript);      break;
      case 'taSummary':        prompt = buildTaSummaryPrompt(safeTranscript);        break;
      case 'interviewerAudit': prompt = buildInterviewerAuditPrompt(safeTranscript); break;
      default:                 prompt = buildCandidatePrompt(safeTranscript);
    }

    const temperature = settings?.temperature ?? 0.3;
    const model       = settings?.model || 'llama-3.3-70b-versatile';

    const groq = new Groq({ apiKey });
    const stream = await groq.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      temperature,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        // If we truncated, prepend a visible warning in the streamed output
        if (truncationNotice) {
          controller.enqueue(encoder.encode(truncationNotice));
        }
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (err) {
          const msg = friendlyGroqError(err);
          controller.enqueue(encoder.encode(`\n\n> **Error:** ${msg}`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    const message = friendlyGroqError(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

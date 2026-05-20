import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildPrompt as buildCandidatePrompt } from '@/prompts/candidate';
import { buildPrompt as buildInterviewerPrompt } from '@/prompts/interviewer';
import { buildPrompt as buildTaSummaryPrompt } from '@/prompts/taSummary';
import { buildPrompt as buildInterviewerAuditPrompt } from '@/prompts/interviewerAudit';
import type { AnalysisType, AppSettings } from '@/types';

export const maxDuration = 60;

// ── Transcript compression ────────────────────────────────────────────────────
// Interview transcripts from Zoom/Teams/Otter contain 25–40% noise:
// timestamps, filler words, and short interjections. Stripping them
// reduces token count significantly without losing any substance.
function compressTranscript(text: string): string {
  return text
    // Timestamps: "40:03", "1:23:45", "[00:23:45]"
    .replace(/\[?\b\d{1,2}:\d{2}(:\d{2})?\b\]?/g, '')
    // Filler sounds
    .replace(/\b(uh+|um+|uhm+|hmm+|hm+|mhm+|mm-?hmm?)\b[,\s]*/gi, ' ')
    // One-word interjections on their own line
    .replace(
      /^(yeah|yep|yup|nope|right|okay|ok|sure|great|alright|absolutely|definitely|exactly|correct|indeed|certainly|of course|i see|got it|understood|fair enough|makes sense|totally|true|agreed)\s*[.,!?]*\s*$/gim,
      ''
    )
    // Collapse whitespace
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const GROQ_MAX_CHARS = 38_000; // ~9 500 tokens — safely under 12 000 TPM with prompt overhead

function isGeminiModel(m: string) { return m.startsWith('gemini'); }

function isRateLimitError(err: unknown) {
  if (!(err instanceof Error)) return false;
  const m = err.message;
  return m.includes('429') || m.includes('RESOURCE_EXHAUSTED') || m.includes('Too Many Requests') || m.includes('rate_limit_exceeded');
}

function isTokenLimitError(err: unknown) {
  if (!(err instanceof Error)) return false;
  const m = err.message;
  return m.includes('Request too large') || m.includes('tokens per minute') || m.includes('context_length_exceeded');
}

function truncateToGroqLimit(text: string): { text: string; truncated: boolean } {
  if (text.length <= GROQ_MAX_CHARS) return { text, truncated: false };
  const cut = text.lastIndexOf('\n', GROQ_MAX_CHARS);
  return { text: text.slice(0, cut > GROQ_MAX_CHARS * 0.8 ? cut : GROQ_MAX_CHARS), truncated: true };
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function buildPrompt(type: AnalysisType, transcript: string): string {
  switch (type) {
    case 'candidate':        return buildCandidatePrompt(transcript);
    case 'interviewer':      return buildInterviewerPrompt(transcript);
    case 'taSummary':        return buildTaSummaryPrompt(transcript);
    case 'interviewerAudit': return buildInterviewerAuditPrompt(transcript);
    default:                 return buildCandidatePrompt(transcript);
  }
}

function friendlyError(err: unknown): string {
  if (!(err instanceof Error)) return 'An unexpected error occurred.';
  const m = err.message;
  if (isRateLimitError(err))  return 'Both Gemini and Groq rate limits were hit. Please wait 60 seconds and try again.';
  if (isTokenLimitError(err)) return 'Transcript is still too long after compression. Please split it into two parts and run separate analyses.';
  if (m.includes('401') || m.includes('API_KEY_INVALID') || m.includes('invalid_api_key'))
    return 'Invalid API key. Please check your key in Settings.';
  if (m.includes('404') || m.includes('not found'))
    return `Model not found. Please select a different model in Settings.`;
  try { return JSON.parse(m)?.error?.message ?? m; } catch { return m; }
}

// ── Gemini streaming ──────────────────────────────────────────────────────────
async function streamGemini(
  apiKey: string, model: string, prompt: string, temperature: number,
  encoder: TextEncoder, controller: ReadableStreamDefaultController
) {
  const genAI  = new GoogleGenerativeAI(apiKey);
  const gemini = genAI.getGenerativeModel({ model, generationConfig: { temperature, maxOutputTokens: 8192 } });

  // One retry with 4s wait before giving up and falling through to Groq
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await gemini.generateContentStream(prompt);
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) controller.enqueue(encoder.encode(text));
      }
      return true; // success
    } catch (err) {
      if (isRateLimitError(err) && attempt === 0) {
        await sleep(4000);
        continue;
      }
      if (isRateLimitError(err)) return false; // signal fallback to Groq
      throw err; // non-rate-limit error — bubble up
    }
  }
  return false;
}

// ── Groq streaming ────────────────────────────────────────────────────────────
async function streamGroq(
  apiKey: string, model: string, prompt: string, temperature: number,
  encoder: TextEncoder, controller: ReadableStreamDefaultController,
  prefixNote = ''
) {
  if (prefixNote) controller.enqueue(encoder.encode(prefixNote));
  const groq = new Groq({ apiKey });

  // One retry with 4s wait for rate limits
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const stream = await groq.chat.completions.create({
        model, messages: [{ role: 'user', content: prompt }], stream: true, temperature,
      });
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) controller.enqueue(encoder.encode(text));
      }
      return;
    } catch (err) {
      if (isRateLimitError(err) && attempt === 0) { await sleep(4000); continue; }
      throw err;
    }
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, analysisType, settings }: {
      transcript: string; analysisType: AnalysisType; settings?: Partial<AppSettings>;
    } = body;

    if (!transcript?.trim()) {
      return new Response(JSON.stringify({ error: 'Transcript is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const selectedModel = settings?.model || 'gemini-1.5-flash';
    const temperature   = settings?.temperature ?? 0.3;
    const geminiKey     = settings?.geminiApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    const groqKey       = settings?.groqApiKey   || process.env.GROQ_API_KEY   || '';

    // Compress transcript (removes timestamps, filler words, short interjections)
    const compressed = compressTranscript(transcript);
    const savedChars = transcript.length - compressed.length;
    const compressionNote = savedChars > 500
      ? `> ℹ️ Transcript compressed: removed ${savedChars.toLocaleString()} chars of timestamps & filler words.\n\n`
      : '';

    const encoder = new TextEncoder();
    const useGemini = isGeminiModel(selectedModel);

    // Validate at least one key is available
    if (useGemini && !geminiKey && !groqKey) {
      return new Response(JSON.stringify({ error: 'No API key configured. Add a Gemini or Groq key in Settings.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    if (!useGemini && !groqKey) {
      return new Response(JSON.stringify({ error: 'Groq API key not configured. Add it in Settings or set GROQ_API_KEY in your environment.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    // Build Groq-safe prompt (compressed + truncated if needed)
    const { text: groqTranscript, truncated } = truncateToGroqLimit(compressed);
    const groqPrompt   = buildPrompt(analysisType, groqTranscript);
    const geminiPrompt = buildPrompt(analysisType, compressed); // full compressed

    const groqNote = [
      compressionNote,
      truncated ? `> ⚠️ Transcript trimmed to ~38 000 chars to fit Groq's token limit.\n\n` : '',
    ].join('');

    const readable = new ReadableStream({
      async start(controller) {
        const enc = (text: string) => controller.enqueue(encoder.encode(text));
        try {
          if (useGemini && geminiKey) {
            if (compressionNote) enc(compressionNote);
            const ok = await streamGemini(geminiKey, selectedModel, geminiPrompt, temperature, encoder, controller);
            if (ok) { controller.close(); return; }

            // Gemini rate-limited even after retry → fall back to Groq silently
            if (!groqKey) {
              enc(`\n\n> **Error:** Gemini rate limit reached and no Groq key is configured as fallback. Wait 60 seconds and try again, or add a Groq API key in Settings.`);
              controller.close();
              return;
            }

            // Clear any partial output and restart with Groq
            enc(`\n\n> ⚡ Gemini rate limit hit — automatically switched to Groq.\n\n`);
            if (truncated) enc(`> ⚠️ Transcript trimmed to ~38 000 chars for Groq's token limit.\n\n`);
            await streamGroq(groqKey, 'llama-3.1-8b-instant', groqPrompt, temperature, encoder, controller);
          } else {
            // Groq primary
            await streamGroq(groqKey, selectedModel, groqPrompt, temperature, encoder, controller, groqNote);
          }
          controller.close();
        } catch (err) {
          enc(`\n\n> **Error:** ${friendlyError(err)}`);
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: friendlyError(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

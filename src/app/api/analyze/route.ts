import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { buildPrompt as buildCandidatePrompt } from '@/prompts/candidate';
import { buildPrompt as buildInterviewerPrompt } from '@/prompts/interviewer';
import { buildPrompt as buildTaSummaryPrompt } from '@/prompts/taSummary';
import { buildPrompt as buildInterviewerAuditPrompt } from '@/prompts/interviewerAudit';
import type { AnalysisType, AppSettings } from '@/types';

export const maxDuration = 60;

// ── Transcript compression ────────────────────────────────────────────────────
function compressTranscript(text: string): string {
  return text
    .replace(/\[?\b\d{1,2}:\d{2}(:\d{2})?\b\]?/g, '')
    .replace(/\b(uh+|um+|uhm+|hmm+|hm+|mhm+|mm-?hmm?)\b[,\s]*/gi, ' ')
    .replace(
      /^(yeah|yep|yup|nope|right|okay|ok|sure|great|alright|absolutely|definitely|exactly|correct|indeed|certainly|of course|i see|got it|understood|fair enough|makes sense|totally|true|agreed)\s*[.,!?]*\s*$/gim,
      ''
    )
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const GROQ_MAX_CHARS       = 38_000;
const OPENROUTER_MAX_CHARS = 60_000;
const MISTRAL_MAX_CHARS    = 60_000;

function isGeminiModel(m: string)      { return m.startsWith('gemini'); }
function isGroqModel(m: string)        { return !m.startsWith('gemini') && !m.startsWith('mistral') && !m.startsWith('open-mistral') && !m.includes('/'); }
function isMistralModel(m: string)     { return m.startsWith('mistral') || m.startsWith('open-mistral') || m.startsWith('codestral'); }
function isOpenRouterModel(m: string)  { return m.includes('/'); }

function isRateLimitError(err: unknown) {
  if (!(err instanceof Error)) return false;
  const m = err.message;
  return m.includes('429') || m.includes('RESOURCE_EXHAUSTED') || m.includes('Too Many Requests') || m.includes('rate_limit_exceeded') || m.includes('rate-limit');
}

function isTokenLimitError(err: unknown) {
  if (!(err instanceof Error)) return false;
  const m = err.message;
  return m.includes('Request too large') || m.includes('tokens per minute') || m.includes('context_length_exceeded') || m.includes('string_above_max_length');
}

function truncateTo(text: string, maxChars: number): { text: string; truncated: boolean } {
  if (text.length <= maxChars) return { text, truncated: false };
  const cut = text.lastIndexOf('\n', maxChars);
  return { text: text.slice(0, cut > maxChars * 0.8 ? cut : maxChars), truncated: true };
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
  if (isRateLimitError(err))  return 'All providers hit their rate limits. Please wait 60 seconds and try again.';
  if (isTokenLimitError(err)) return 'Transcript is still too long after compression. Please split it into two parts and run separate analyses.';
  if (m.includes('401') || m.includes('API_KEY_INVALID') || m.includes('invalid_api_key') || m.includes('No auth'))
    return 'Invalid API key. Please check your key in Settings.';
  if (m.includes('404') || m.includes('not found'))
    return 'Model not found. Please select a different model in Settings.';
  try { return JSON.parse(m)?.error?.message ?? m; } catch { return m; }
}

// ── Gemini streaming ──────────────────────────────────────────────────────────
async function streamGemini(
  apiKey: string, model: string, prompt: string, temperature: number,
  encoder: TextEncoder, controller: ReadableStreamDefaultController
): Promise<boolean> {
  const genAI  = new GoogleGenerativeAI(apiKey);
  const gemini = genAI.getGenerativeModel({ model, generationConfig: { temperature, maxOutputTokens: 8192 } });

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await gemini.generateContentStream(prompt);
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) controller.enqueue(encoder.encode(text));
      }
      return true;
    } catch (err) {
      if ((isRateLimitError(err) || isTokenLimitError(err)) && attempt === 0) { await sleep(5000); continue; }
      if (isRateLimitError(err) || isTokenLimitError(err)) return false;
      throw err;
    }
  }
  return false;
}

// ── Groq streaming ────────────────────────────────────────────────────────────
async function streamGroq(
  apiKey: string, model: string, prompt: string, temperature: number,
  encoder: TextEncoder, controller: ReadableStreamDefaultController,
  prefixNote = ''
): Promise<boolean> {
  if (prefixNote) controller.enqueue(encoder.encode(prefixNote));
  const groq = new Groq({ apiKey });

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const stream = await groq.chat.completions.create({
        model, messages: [{ role: 'user', content: prompt }], stream: true, temperature,
      });
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) controller.enqueue(encoder.encode(text));
      }
      return true;
    } catch (err) {
      if ((isRateLimitError(err) || isTokenLimitError(err)) && attempt === 0) { await sleep(5000); continue; }
      if (isRateLimitError(err) || isTokenLimitError(err)) return false;
      throw err;
    }
  }
  return false;
}

// ── OpenRouter streaming (OpenAI-compatible) ──────────────────────────────────
async function streamOpenRouter(
  apiKey: string, model: string, prompt: string, temperature: number,
  encoder: TextEncoder, controller: ReadableStreamDefaultController,
  prefixNote = ''
): Promise<boolean> {
  if (prefixNote) controller.enqueue(encoder.encode(prefixNote));
  const client = new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://interview-evaluator.vercel.app',
      'X-Title': 'Interview Intelligence',
    },
  });

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const stream = await client.chat.completions.create({
        model, messages: [{ role: 'user', content: prompt }], stream: true, temperature, max_tokens: 4096,
      });
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) controller.enqueue(encoder.encode(text));
      }
      return true;
    } catch (err) {
      if ((isRateLimitError(err) || isTokenLimitError(err)) && attempt === 0) { await sleep(5000); continue; }
      if (isRateLimitError(err) || isTokenLimitError(err)) return false;
      throw err;
    }
  }
  return false;
}

// ── Mistral streaming (OpenAI-compatible) ─────────────────────────────────────
async function streamMistral(
  apiKey: string, model: string, prompt: string, temperature: number,
  encoder: TextEncoder, controller: ReadableStreamDefaultController,
  prefixNote = ''
): Promise<boolean> {
  if (prefixNote) controller.enqueue(encoder.encode(prefixNote));
  const client = new OpenAI({ apiKey, baseURL: 'https://api.mistral.ai/v1' });

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const stream = await client.chat.completions.create({
        model, messages: [{ role: 'user', content: prompt }], stream: true, temperature, max_tokens: 4096,
      });
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) controller.enqueue(encoder.encode(text));
      }
      return true;
    } catch (err) {
      if ((isRateLimitError(err) || isTokenLimitError(err)) && attempt === 0) { await sleep(5000); continue; }
      if (isRateLimitError(err) || isTokenLimitError(err)) return false;
      throw err;
    }
  }
  return false;
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

    const selectedModel  = settings?.model || 'gemini-1.5-flash';
    const temperature    = settings?.temperature ?? 0.3;
    const geminiKey      = settings?.geminiApiKey     || process.env.GEMINI_API_KEY     || process.env.GOOGLE_API_KEY || '';
    const groqKey        = settings?.groqApiKey       || process.env.GROQ_API_KEY       || '';
    const openrouterKey  = settings?.openrouterApiKey || process.env.OPENROUTER_API_KEY || '';
    const mistralKey     = settings?.mistralApiKey    || process.env.MISTRAL_API_KEY    || '';

    const primaryIsGemini     = isGeminiModel(selectedModel);
    const primaryIsGroq       = isGroqModel(selectedModel);
    const primaryIsMistral    = isMistralModel(selectedModel);
    const primaryIsOpenRouter = isOpenRouterModel(selectedModel);

    const anyKey = geminiKey || groqKey || openrouterKey || mistralKey;
    if (!anyKey) {
      return new Response(JSON.stringify({ error: 'No API key configured. Add at least one key in Settings.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    // Compress + per-provider truncation
    const compressed  = compressTranscript(transcript);
    const savedChars  = transcript.length - compressed.length;
    const compressionNote = savedChars > 500
      ? `> ℹ️ Transcript compressed: removed ${savedChars.toLocaleString()} chars of timestamps & filler words.\n\n`
      : '';

    const { text: groqText,    truncated: groqTruncated }    = truncateTo(compressed, GROQ_MAX_CHARS);
    const { text: orText,      truncated: orTruncated }      = truncateTo(compressed, OPENROUTER_MAX_CHARS);
    const { text: mistralText, truncated: mistralTruncated } = truncateTo(compressed, MISTRAL_MAX_CHARS);

    const groqPrompt    = buildPrompt(analysisType, groqText);
    const orPrompt      = buildPrompt(analysisType, orText);
    const mistralPrompt = buildPrompt(analysisType, mistralText);
    const geminiPrompt  = buildPrompt(analysisType, compressed);

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        const enc = (text: string) => controller.enqueue(encoder.encode(text));
        try {
          if (compressionNote) enc(compressionNote);

          // ── Primary provider ────────────────────────────────────────────
          let ok = false;

          if (primaryIsGemini && geminiKey) {
            ok = await streamGemini(geminiKey, selectedModel, geminiPrompt, temperature, encoder, controller);
          } else if (primaryIsGroq && groqKey) {
            if (groqTruncated) enc(`> ⚠️ Transcript trimmed to ~38 000 chars for Groq.\n\n`);
            ok = await streamGroq(groqKey, selectedModel, groqPrompt, temperature, encoder, controller);
          } else if (primaryIsOpenRouter && openrouterKey) {
            if (orTruncated) enc(`> ⚠️ Transcript trimmed to ~60 000 chars for OpenRouter.\n\n`);
            ok = await streamOpenRouter(openrouterKey, selectedModel, orPrompt, temperature, encoder, controller);
          } else if (primaryIsMistral && mistralKey) {
            if (mistralTruncated) enc(`> ⚠️ Transcript trimmed to ~60 000 chars for Mistral.\n\n`);
            ok = await streamMistral(mistralKey, selectedModel, mistralPrompt, temperature, encoder, controller);
          }

          if (ok) { controller.close(); return; }

          // ── Waterfall fallbacks ─────────────────────────────────────────
          type Fallback = { name: string; fn: () => Promise<boolean> };
          const fallbacks: Fallback[] = [];

          if (!primaryIsGroq && groqKey)
            fallbacks.push({ name: 'Groq (llama-3.1-8b-instant)',
              fn: () => streamGroq(groqKey, 'llama-3.1-8b-instant', groqPrompt, temperature, encoder, controller,
                groqTruncated ? `> ⚠️ Transcript trimmed to ~38 000 chars for Groq.\n\n` : '') });

          if (!primaryIsOpenRouter && openrouterKey)
            fallbacks.push({ name: 'OpenRouter (llama-3.1-8b free)',
              fn: () => streamOpenRouter(openrouterKey, 'meta-llama/llama-3.1-8b-instruct:free', orPrompt, temperature, encoder, controller,
                orTruncated ? `> ⚠️ Transcript trimmed to ~60 000 chars for OpenRouter.\n\n` : '') });

          if (!primaryIsMistral && mistralKey)
            fallbacks.push({ name: 'Mistral (open-mistral-nemo)',
              fn: () => streamMistral(mistralKey, 'open-mistral-nemo', mistralPrompt, temperature, encoder, controller,
                mistralTruncated ? `> ⚠️ Transcript trimmed to ~60 000 chars for Mistral.\n\n` : '') });

          if (!primaryIsGemini && geminiKey)
            fallbacks.push({ name: 'Gemini (gemini-1.5-flash)',
              fn: () => streamGemini(geminiKey, 'gemini-1.5-flash', geminiPrompt, temperature, encoder, controller) });

          for (const { name, fn } of fallbacks) {
            enc(`\n\n> ⚡ Switched to ${name} (previous provider rate-limited).\n\n`);
            ok = await fn();
            if (ok) { controller.close(); return; }
          }

          enc(`\n\n> **Error:** All configured providers hit their rate limits. Please wait 60 seconds and try again, or add more API keys in Settings.`);
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

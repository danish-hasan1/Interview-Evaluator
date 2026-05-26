import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildExtractionPrompt } from '@/prompts/extract';
import { buildEvaluationPrompt } from '@/prompts/evaluate';
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
// Groq free tier: 6K–30K TPM depending on model. Extraction prompt ~150 tokens.
// Keep transcript under 18K chars (~4.5K tokens) so a single call stays well
// under even the tightest 6K TPM limit and leaves headroom for extraction output.
const GROQ_EXTRACT_MAX_CHARS = 18_000;

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

function truncate(text: string, maxChars: number): { text: string; truncated: boolean } {
  if (text.length <= maxChars) return { text, truncated: false };
  const cut = text.lastIndexOf('\n', maxChars);
  return { text: text.slice(0, cut > maxChars * 0.8 ? cut : maxChars), truncated: true };
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function friendlyError(err: unknown): string {
  if (!(err instanceof Error)) return 'An unexpected error occurred.';
  const m = err.message;
  if (isRateLimitError(err))  return 'Rate limit hit on all providers. Please wait 60 seconds and try again.';
  if (isTokenLimitError(err)) return 'Transcript is still too long after compression. Please split it into two parts.';
  if (m.includes('401') || m.includes('API_KEY_INVALID') || m.includes('invalid_api_key'))
    return 'Invalid API key. Please check your key in Settings.';
  if (m.includes('404') || m.includes('not found'))
    return 'Model not found. Please select a different model in Settings.';
  try { return JSON.parse(m)?.error?.message ?? m; } catch { return m; }
}

// ── Phase 1: Extract facts (non-streaming, Groq) ──────────────────────────────
async function extractWithGroq(
  apiKey: string, transcript: string, type: AnalysisType, temperature: number, jd?: string
): Promise<string> {
  const groq   = new Groq({ apiKey });
  const prompt = buildExtractionPrompt(type, transcript, jd);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        temperature,
        max_tokens: 800,
      });
      return res.choices[0]?.message?.content ?? '';
    } catch (err) {
      if (isRateLimitError(err) && attempt === 0) { await sleep(5000); continue; }
      throw err;
    }
  }
  return '';
}

// ── Phase 1: Extract facts (non-streaming, Gemini fallback) ──────────────────
async function extractWithGemini(
  apiKey: string, model: string, transcript: string, type: AnalysisType, temperature: number, jd?: string
): Promise<string> {
  const genAI  = new GoogleGenerativeAI(apiKey);
  const gemini = genAI.getGenerativeModel({ model, generationConfig: { temperature, maxOutputTokens: 1200 } });
  const prompt = buildExtractionPrompt(type, transcript, jd);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await gemini.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      if (isRateLimitError(err) && attempt === 0) { await sleep(5000); continue; }
      throw err;
    }
  }
  return '';
}

// Wrapper that tries Groq first, then Gemini, for Phase 1 extraction
async function extractFacts(
  groqKey: string, geminiKey: string, geminiModel: string,
  transcript: string, type: AnalysisType, temperature: number,
  enc: (s: string) => void, jd?: string
): Promise<string> {
  if (groqKey) {
    try {
      return await extractWithGroq(groqKey, transcript, type, temperature, jd);
    } catch (err) {
      if (isRateLimitError(err) && geminiKey) {
        enc(`> ⚡ Groq rate limited on extraction — switching to Gemini.\n\n`);
        // Fall through to Gemini below
      } else {
        throw err;
      }
    }
  }
  if (geminiKey) {
    return await extractWithGemini(geminiKey, geminiModel, transcript, type, temperature, jd);
  }
  throw new Error('No API key available for extraction phase.');
}

// ── Phase 2: Evaluate from facts (streaming, Gemini) ─────────────────────────
async function streamEvalGemini(
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
      if (isRateLimitError(err) && attempt === 0) { await sleep(5000); continue; }
      if (isRateLimitError(err)) return false;
      throw err;
    }
  }
  return false;
}

// ── Phase 2: Evaluate from facts (streaming, Groq) ───────────────────────────
async function streamEvalGroq(
  apiKey: string, model: string, prompt: string, temperature: number,
  encoder: TextEncoder, controller: ReadableStreamDefaultController
): Promise<void> {
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
      return;
    } catch (err) {
      if (isRateLimitError(err) && attempt === 0) { await sleep(5000); continue; }
      throw err;
    }
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, jobDescription, analysisType, settings }: {
      transcript: string; jobDescription?: string; analysisType: AnalysisType; settings?: Partial<AppSettings>;
    } = body;

    if (!transcript?.trim()) {
      return new Response(JSON.stringify({ error: 'Transcript is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const selectedModel = settings?.model || 'gemini-1.5-flash';
    const temperature   = settings?.temperature ?? 0.3;
    const geminiKey     = settings?.geminiApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    const groqKey       = settings?.groqApiKey   || process.env.GROQ_API_KEY   || '';

    if (!geminiKey && !groqKey) {
      return new Response(JSON.stringify({ error: 'No API key configured. Add a Gemini or Groq key in Settings.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    // Compress + truncate for Phase 1 (Groq extraction)
    const compressed = compressTranscript(transcript);
    const savedChars = transcript.length - compressed.length;
    const { text: extractTranscript, truncated } = truncate(compressed, GROQ_EXTRACT_MAX_CHARS);

    const encoder  = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const enc = (text: string) => controller.enqueue(encoder.encode(text));

        try {
          // ── Header notes ──────────────────────────────────────────────────
          if (savedChars > 500) {
            enc(`> ℹ️ Transcript compressed — removed ${savedChars.toLocaleString()} chars of timestamps & filler words.\n\n`);
          }
          if (truncated) {
            enc(`> ⚠️ Transcript trimmed to 18 000 chars for extraction (fits within Groq free-tier token limit).\n\n`);
          }

          // ── Phase 1: Extract structured facts from transcript ─────────────
          // Groq reads the heavy transcript; Phase 2 only sees the tiny output.
          // Falls back to Gemini automatically if Groq is rate-limited.
          enc(`> 🔍 **Phase 1 of 2** — Reading transcript & extracting key data...\n\n`);

          const jd = jobDescription?.trim() || undefined;
          if (jd) enc(`> 📋 Job description provided — analysis will be evaluated against role requirements.\n\n`);

          const extractModel    = isGeminiModel(selectedModel) ? selectedModel : 'gemini-1.5-flash';
          const extractedFacts  = await extractFacts(
            groqKey, geminiKey, extractModel,
            extractTranscript, analysisType, temperature, enc, jd
          );

          if (!extractedFacts.trim()) {
            enc(`\n\n> **Error:** Extraction phase returned empty output. Please try again.`);
            controller.close();
            return;
          }

          // ── Phase 2: Evaluate from extracted facts ────────────────────────
          // Extracted facts are ~500-800 tokens — fraction of the original transcript.
          // Use the user's selected (higher-quality) model for the evaluation pass.
          enc(`\n\n> 📊 **Phase 2 of 2** — Generating evaluation from extracted data...\n\n---\n\n`);

          const evalPrompt       = buildEvaluationPrompt(analysisType, extractedFacts, jd);
          const useGeminiForEval = isGeminiModel(selectedModel) && !!geminiKey;

          if (useGeminiForEval) {
            const ok = await streamEvalGemini(geminiKey, selectedModel, evalPrompt, temperature, encoder, controller);
            if (!ok) {
              if (!groqKey) {
                enc(`\n\n> **Error:** Gemini rate limited and no Groq key is configured as fallback. Wait 60 seconds or add a Groq key in Settings.`);
                controller.close();
                return;
              }
              // Gemini rate-limited → Groq handles eval easily (only ~1K tokens)
              enc(`\n\n> ⚡ Gemini rate limited — switching to Groq for evaluation.\n\n`);
              await streamEvalGroq(groqKey, 'llama-3.3-70b-versatile', evalPrompt, temperature, encoder, controller);
            }
          } else {
            // Groq-only path: instant model extracted, versatile model evaluates
            const evalModel = selectedModel.startsWith('gemini') ? 'llama-3.3-70b-versatile' : selectedModel;
            await streamEvalGroq(groqKey, evalModel, evalPrompt, temperature, encoder, controller);
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

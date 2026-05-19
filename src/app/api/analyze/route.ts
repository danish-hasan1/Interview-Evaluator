import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import { buildPrompt as buildCandidatePrompt } from '@/prompts/candidate';
import { buildPrompt as buildInterviewerPrompt } from '@/prompts/interviewer';
import { buildPrompt as buildTaSummaryPrompt } from '@/prompts/taSummary';
import { buildPrompt as buildInterviewerAuditPrompt } from '@/prompts/interviewerAudit';
import type { AnalysisType, AppSettings } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      transcript,
      analysisType,
      settings,
    }: {
      transcript: string;
      analysisType: AnalysisType;
      settings?: Partial<AppSettings>;
    } = body;

    if (!transcript || transcript.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Transcript is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = settings?.groqApiKey || process.env.GROQ_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            'Groq API key not configured. Please add your API key in Settings.',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const groq = new Groq({ apiKey });

    let prompt: string;
    switch (analysisType) {
      case 'candidate':
        prompt = buildCandidatePrompt(transcript);
        break;
      case 'interviewer':
        prompt = buildInterviewerPrompt(transcript);
        break;
      case 'taSummary':
        prompt = buildTaSummaryPrompt(transcript);
        break;
      case 'interviewerAudit':
        prompt = buildInterviewerAuditPrompt(transcript);
        break;
      default:
        prompt = buildCandidatePrompt(transcript);
    }

    const temperature = settings?.temperature ?? 0.3;
    const maxTokens = settings?.maxTokens ?? 4096;
    const model = settings?.model || 'llama-3.3-70b-versatile';

    const stream = await groq.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      temperature,
      max_tokens: maxTokens,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Analysis API error:', error);
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

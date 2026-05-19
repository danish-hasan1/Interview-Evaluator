import Groq from 'groq-sdk';

export function createGroqClient(apiKey?: string): Groq {
  const key = apiKey || process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error('GROQ_API_KEY is not configured. Please add your API key in Settings.');
  }
  return new Groq({ apiKey: key });
}

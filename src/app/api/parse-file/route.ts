import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    let text = '';

    if (extension === 'txt') {
      text = await file.text();
    } else if (extension === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParse = (await import('pdf-parse' as any)).default as (buffer: Buffer) => Promise<{ text: string }>;
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (extension === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ arrayBuffer });
      text = result.value;
    } else {
      return new Response(
        JSON.stringify({
          error: `Unsupported file type: .${extension}. Please use .txt, .pdf, or .docx files.`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ text }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('File parse error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to parse file';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

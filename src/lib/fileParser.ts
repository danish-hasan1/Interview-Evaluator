export async function parseFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'txt') {
    return await file.text();
  }

  if (extension === 'pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Dynamically import pdf-parse to avoid build issues
    const pdfParse = await import('pdf-parse').then((m) => m.default || m);
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (extension === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  throw new Error(`Unsupported file type: .${extension}. Please use .txt, .pdf, or .docx files.`);
}

export function mergeTranscripts(texts: string[]): string {
  return texts
    .map((text, index) => `--- TRANSCRIPT ${index + 1} ---\n\n${text.trim()}`)
    .join('\n\n');
}

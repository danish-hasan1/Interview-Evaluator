export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export async function exportToPDF(content: string, title: string): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, margin + 10);

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), margin, margin + 18);

  doc.setTextColor(0, 0, 0);

  let yPosition = margin + 30;

  // Process markdown content
  const lines = content.split('\n');

  for (const line of lines) {
    if (yPosition > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }

    if (line.startsWith('## ')) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const text = line.replace('## ', '');
      doc.text(text, margin, yPosition);
      yPosition += 8;
    } else if (line.startsWith('### ')) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const text = line.replace('### ', '');
      doc.text(text, margin, yPosition);
      yPosition += 7;
    } else if (line.startsWith('# ')) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      const text = line.replace('# ', '');
      doc.text(text, margin, yPosition);
      yPosition += 10;
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const text = line.replace(/^[-*] /, '• ').replace(/\*\*(.*?)\*\*/g, '$1');
      const splitText = doc.splitTextToSize(text, maxWidth - 5);
      doc.text(splitText, margin + 5, yPosition);
      yPosition += splitText.length * 5 + 1;
    } else if (line.trim() === '') {
      yPosition += 3;
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const cleanText = line.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
      const splitText = doc.splitTextToSize(cleanText, maxWidth);
      doc.text(splitText, margin, yPosition);
      yPosition += splitText.length * 5 + 1;
    }
  }

  doc.save(`${title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`);
}

export async function exportToDOCX(content: string, title: string): Promise<void> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');

  const paragraphs: Paragraph[] = [];

  // Title
  paragraphs.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
    })
  );

  // Date
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          color: '666666',
        }),
      ],
    })
  );

  paragraphs.push(new Paragraph({ text: '' }));

  const lines = content.split('\n');

  for (const line of lines) {
    if (line.startsWith('## ')) {
      paragraphs.push(
        new Paragraph({
          text: line.replace('## ', ''),
          heading: HeadingLevel.HEADING_2,
        })
      );
    } else if (line.startsWith('### ')) {
      paragraphs.push(
        new Paragraph({
          text: line.replace('### ', ''),
          heading: HeadingLevel.HEADING_3,
        })
      );
    } else if (line.startsWith('# ')) {
      paragraphs.push(
        new Paragraph({
          text: line.replace('# ', ''),
          heading: HeadingLevel.HEADING_1,
        })
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const text = line.replace(/^[-*] /, '');
      const runs: TextRun[] = [];
      const parts = text.split(/\*\*(.*?)\*\*/g);
      parts.forEach((part, i) => {
        runs.push(new TextRun({ text: part, bold: i % 2 === 1 }));
      });
      paragraphs.push(new Paragraph({ children: runs, bullet: { level: 0 } }));
    } else if (line.trim() === '') {
      paragraphs.push(new Paragraph({ text: '' }));
    } else {
      const runs: TextRun[] = [];
      const parts = line.split(/\*\*(.*?)\*\*/g);
      parts.forEach((part, i) => {
        runs.push(new TextRun({ text: part, bold: i % 2 === 1 }));
      });
      paragraphs.push(new Paragraph({ children: runs }));
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  const url = URL.createObjectURL(buffer);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.docx`;
  link.click();
  URL.revokeObjectURL(url);
}

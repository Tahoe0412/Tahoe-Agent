/**
 * Client-side file download utilities for article export.
 * Supports TXT, PDF (.pdf), and Word (.docx) formats.
 */

/** Download a text string as a .txt file. */
export function downloadAsTxt(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  triggerDownload(blob, filename.endsWith(".txt") ? filename : `${filename}.txt`);
}

/** Download article content as a PDF file with CJK support. */
export async function downloadAsPdf(params: {
  title: string;
  content: string;
  summary?: string;
  filename: string;
}) {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // jsPDF does not natively support CJK — use built-in 16-point font fallback
  // For true CJK rendering we embed a font via addFont, but to keep bundle
  // size reasonable we use a simpler approach: generate via HTML rendering.
  // Instead, we'll create a printable HTML page and trigger print-to-PDF.
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    // Fallback: basic ASCII-only PDF
    doc.setFontSize(18);
    doc.text(params.title, 20, 25);
    doc.setFontSize(10);
    if (params.summary) {
      const summaryLines = doc.splitTextToSize(params.summary, 170);
      doc.text(summaryLines, 20, 40);
    }
    doc.setFontSize(12);
    const contentLines = doc.splitTextToSize(params.content, 170);
    doc.text(contentLines, 20, params.summary ? 60 : 40);
    doc.save(params.filename.endsWith(".pdf") ? params.filename : `${params.filename}.pdf`);
    return;
  }

  const html = buildPrintableHtml(params.title, params.content, params.summary);
  printWindow.document.write(html);
  printWindow.document.close();
  // Wait for styles to load, then trigger print dialog (user can choose "Save as PDF")
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };
}

/** Download article content as a Word (.docx) file. */
export async function downloadAsDocx(params: {
  title: string;
  content: string;
  summary?: string;
  tags?: string[];
  filename: string;
}) {
  const { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType, BorderStyle } = await import("docx");

  const children: InstanceType<typeof Paragraph>[] = [];

  // Title
  children.push(
    new Paragraph({
      text: params.title,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    }),
  );

  // Summary
  if (params.summary) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: params.summary,
            italics: true,
            color: "666666",
            size: 20,
          }),
        ],
        spacing: { after: 200 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
        },
      }),
    );
  }

  // Content paragraphs
  const paragraphs = params.content.split(/\n\s*\n/);
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: trimmed,
            size: 24,
          }),
        ],
        spacing: { after: 120, line: 360 },
      }),
    );
  }

  // Tags
  if (params.tags && params.tags.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `标签: ${params.tags.map((t) => `#${t}`).join(" ")}`,
            color: "999999",
            size: 18,
          }),
        ],
        spacing: { before: 300 },
        alignment: AlignmentType.LEFT,
      }),
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  triggerDownload(buffer, params.filename.endsWith(".docx") ? params.filename : `${params.filename}.docx`);
}

// ── Helpers ──

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

function buildPrintableHtml(title: string, content: string, summary?: string) {
  const paragraphs = content
    .split(/\n\s*\n/)
    .filter((p) => p.trim())
    .map((p) => `<p>${escapeHtml(p.trim())}</p>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20mm; }
    }
    body {
      font-family: "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif;
      max-width: 700px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.8;
      color: #333;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 16px;
      line-height: 1.4;
    }
    .summary {
      font-style: italic;
      color: #666;
      border-bottom: 1px solid #eee;
      padding-bottom: 12px;
      margin-bottom: 20px;
      font-size: 14px;
    }
    p {
      font-size: 15px;
      margin-bottom: 12px;
      text-indent: 2em;
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${summary ? `<div class="summary">${escapeHtml(summary)}</div>` : ""}
  ${paragraphs}
</body>
</html>`;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib";
export function parsePages(text, count) {
  if (!text.trim()) return Array.from({ length: count }, (_, i) => i);
  const result = [];
  for (const part of text.split(",")) {
    const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw Error("Use pages like 1,3,5-8");
    const start = +match[1],
      end = +(match[2] || match[1]);
    if (start < 1 || end > count || end < start)
      throw Error(`Page range must be between 1 and ${count}`);
    for (let n = start; n <= end; n++) result.push(n - 1);
  }
  return result;
}
export async function processPDF(tool, files, options = {}) {
  if (!files.length) throw Error("Choose at least one file");
  const out = await PDFDocument.create();
  if (tool === "images") {
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const img =
        file.type === "image/png"
          ? await out.embedPng(bytes)
          : await out.embedJpg(bytes);
      const page = out.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    }
  } else if (tool === "merge") {
    if (files.length < 2) throw Error("Choose at least two PDF files");
    for (const file of files) {
      const doc = await PDFDocument.load(await file.arrayBuffer());
      for (const page of await out.copyPages(doc, doc.getPageIndices()))
        out.addPage(page);
    }
  } else {
    const doc = await PDFDocument.load(await files[0].arrayBuffer());
    const selected = parsePages(options.pages || "", doc.getPageCount());
    const indices =
      tool === "delete"
        ? doc.getPageIndices().filter((i) => !selected.includes(i))
        : tool === "extract"
          ? selected
          : tool === "reverse"
            ? doc.getPageIndices().reverse()
            : doc.getPageIndices();
    if (!indices.length) throw Error("Keep at least one page");
    for (const page of await out.copyPages(doc, indices)) out.addPage(page);
    if (tool === "metadata") {
      out.setTitle(options.title || "");
      out.setAuthor(options.author || "");
      out.setCreator("SuitePDF");
    }
    if (tool === "rotate")
      out.getPages().forEach((p, i) => {
        if (selected.includes(i))
          p.setRotation(degrees((p.getRotation().angle + 90) % 360));
      });
    if (tool === "watermark" || tool === "numbers") {
      const font = await out.embedFont(StandardFonts.Helvetica);
      out.getPages().forEach((p, i) => {
        const { width, height } = p.getSize();
        if (tool === "numbers")
          p.drawText(`${i + 1} / ${out.getPageCount()}`, {
            x: width / 2 - 15,
            y: 20,
            size: 10,
            font,
            color: rgb(0.4, 0.4, 0.4),
          });
        else {
          const text = options.text?.trim() || "CONFIDENTIAL";
          if (!/^[\x20-\x7e]+$/.test(text))
            throw Error("Watermark currently supports Latin characters");
          const size = Math.min(48, width / Math.max(text.length * 0.55, 1));
          p.drawText(text, {
            x: width * 0.12,
            y: height * 0.45,
            size,
            font,
            rotate: degrees(30),
            opacity: 0.2,
            color: rgb(0.4, 0.3, 0.7),
          });
        }
      });
    }
  }
  return out.save();
}

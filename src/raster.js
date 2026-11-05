import worker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { PDFDocument } from "pdf-lib";
export async function rasterizePDF(file, mode, progress = () => {}) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = worker;
  const doc = await pdfjs.getDocument({
    data: await file.arrayBuffer(),
    isEvalSupported: false,
  }).promise;
  const output =
    mode === "compress"
      ? await PDFDocument.create()
      : new (await import("jszip")).default();
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      progress(i, doc.numPages);
      const page = await doc.getPage(i),
        base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({
        scale: Math.min(
          mode === "compress" ? 1.2 : 2,
          2000 / Math.max(base.width, base.height),
        ),
      });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({
        canvasContext: canvas.getContext("2d"),
        viewport,
        background: "rgb(255,255,255)",
      }).promise;
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", mode === "compress" ? 0.65 : 0.92),
      );
      if (!blob) throw Error("Image export failed");
      const bytes = await blob.arrayBuffer();
      if (mode === "compress") {
        const img = await output.embedJpg(bytes);
        const p = output.addPage([base.width, base.height]);
        p.drawImage(img, {
          x: 0,
          y: 0,
          width: base.width,
          height: base.height,
        });
      } else output.file(`page-${String(i).padStart(4, "0")}.jpg`, bytes);
      canvas.width = canvas.height = 1;
      page.cleanup();
    }
    return mode === "compress"
      ? await output.save()
      : await output.generateAsync({ type: "uint8array" });
  } finally {
    await doc.destroy();
  }
}

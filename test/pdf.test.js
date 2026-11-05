import { test } from "node:test";
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { parsePages, processPDF } from "../src/pdf.js";
async function fixture(count) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < count; i++) doc.addPage([300 + i, 400]);
  const bytes = await doc.save();
  return { arrayBuffer: async () => bytes, type: "application/pdf" };
}
test("page selections preserve order and reject invalid ranges", () => {
  assert.deepEqual(parsePages("3,1-2", 3), [2, 0, 1]);
  assert.throws(() => parsePages("0", 3));
  assert.throws(() => parsePages("1-9", 3));
  assert.throws(() => parsePages("abc", 3));
});
test("merges all pages from multiple PDFs", async () => {
  const bytes = await processPDF("merge", [await fixture(2), await fixture(3)]);
  assert.equal((await PDFDocument.load(bytes)).getPageCount(), 5);
});
test("extracts pages in requested order", async () => {
  const doc = await PDFDocument.load(
    await processPDF("extract", [await fixture(3)], { pages: "3,1" }),
  );
  assert.equal(doc.getPageCount(), 2);
  assert.equal(doc.getPage(0).getWidth(), 302);
});
test("deletes selected pages and prevents empty output", async () => {
  const f = await fixture(3);
  const doc = await PDFDocument.load(
    await processPDF("delete", [f], { pages: "2" }),
  );
  assert.equal(doc.getPageCount(), 2);
  assert.equal(doc.getPage(1).getWidth(), 302);
  await assert.rejects(() => processPDF("delete", [f], { pages: "1-3" }));
});
test("rotates selected pages only", async () => {
  const doc = await PDFDocument.load(
    await processPDF("rotate", [await fixture(2)], { pages: "2" }),
  );
  assert.equal(doc.getPage(0).getRotation().angle, 0);
  assert.equal(doc.getPage(1).getRotation().angle, 90);
});
test("watermark and numbering produce readable documents", async () => {
  for (const tool of ["watermark", "numbers"]) {
    const doc = await PDFDocument.load(
      await processPDF(tool, [await fixture(2)], { text: "DRAFT" }),
    );
    assert.equal(doc.getPageCount(), 2);
    assert.ok(doc.getPage(0).node.Contents());
  }
});
test("converts PNG to a PDF page", async () => {
  const bytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==",
    "base64",
  );
  const doc = await PDFDocument.load(
    await processPDF("images", [
      { type: "image/png", arrayBuffer: async () => bytes },
    ]),
  );
  assert.equal(doc.getPageCount(), 1);
});
test("reverses page order without losing pages", async () => {
  const doc = await PDFDocument.load(
    await processPDF("reverse", [await fixture(3)]),
  );
  assert.deepEqual(
    doc.getPages().map((p) => p.getWidth()),
    [302, 301, 300],
  );
});
test("writes Unicode document metadata", async () => {
  const doc = await PDFDocument.load(
    await processPDF("metadata", [await fixture(1)], {
      title: "مستند عربي",
      author: "SuitePDF",
    }),
  );
  assert.equal(doc.getTitle(), "مستند عربي");
  assert.equal(doc.getAuthor(), "SuitePDF");
});

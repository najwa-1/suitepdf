import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-800.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/noto-sans-arabic/arabic-400.css";
import "@fontsource/noto-sans-arabic/arabic-700.css";
import "./style.css";
import { attachDepth } from "./experience";
import {
  createIcons,
  Layers2,
  LayoutGrid,
  Sparkles,
  ShieldCheck,
  Languages,
  Sun,
  Moon,
  Zap,
  Check,
  FileText,
  LockKeyhole,
  Search,
  ArrowUpRight,
  ArrowRight,
  Fingerprint,
  Globe2,
  X,
  CloudUpload,
  Download,
  BookOpen,
  Combine,
  Scissors,
  Images,
  RotateCw,
  FileMinus2,
  Stamp,
  ListOrdered,
} from "lucide";
const icons = {
  Layers2,
  LayoutGrid,
  Sparkles,
  ShieldCheck,
  Languages,
  Sun,
  Moon,
  Zap,
  Check,
  FileText,
  LockKeyhole,
  Search,
  ArrowUpRight,
  ArrowRight,
  Fingerprint,
  Globe2,
  X,
  CloudUpload,
  Download,
  BookOpen,
  Combine,
  Scissors,
  Images,
  RotateCw,
  FileMinus2,
  Stamp,
  ListOrdered,
};
import { processPDF } from "./pdf";
import { rasterizePDF } from "./raster";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
const tools = [
  [
    "merge",
    "Merge PDF",
    "دمج PDF",
    "Combine documents into one beautiful file.",
    "اجمع مستنداتك في ملف واحد.",
    "combine",
    "purple",
  ],
  [
    "extract",
    "Split & extract",
    "فصل واستخراج",
    "Keep exactly the pages you need.",
    "استخرج الصفحات التي تحتاجها.",
    "scissors",
    "blue",
  ],
  [
    "images",
    "Images to PDF",
    "صور إلى PDF",
    "Turn your photos into a document.",
    "حوّل صورك إلى مستند.",
    "images",
    "orange",
  ],
  [
    "rotate",
    "Rotate pages",
    "تدوير الصفحات",
    "A fresh perspective, in one click.",
    "عدّل اتجاه صفحاتك بسهولة.",
    "rotate-cw",
    "green",
  ],
  [
    "delete",
    "Delete pages",
    "حذف صفحات",
    "Less clutter. Just the essentials.",
    "احتفظ بالمحتوى المهم فقط.",
    "file-minus-2",
    "rose",
  ],
  [
    "watermark",
    "Watermark",
    "علامة مائية",
    "Make your mark on every page.",
    "أضف بصمتك إلى كل صفحة.",
    "stamp",
    "purple",
  ],
  [
    "numbers",
    "Page numbers",
    "ترقيم الصفحات",
    "Give every page its place.",
    "أعطِ كل صفحة رقمها.",
    "list-ordered",
    "blue",
  ],
  [
    "compress",
    "Compress scans",
    "ضغط المستندات المصوّرة",
    "Lighter scans, ready to share.",
    "خفّف حجم المستندات المصوّرة.",
    "file-text",
    "green",
  ],
  [
    "pdfimages",
    "PDF to JPG",
    "PDF إلى صور",
    "Every page, picture perfect.",
    "صدّر كل صفحة بصورة واضحة.",
    "images",
    "blue",
  ],
  [
    "reverse",
    "Reverse pages",
    "عكس ترتيب الصفحات",
    "Flip the order in an instant.",
    "اعكس ترتيب الصفحات بلحظة.",
    "list-ordered",
    "rose",
  ],
  [
    "metadata",
    "Document details",
    "بيانات المستند",
    "A proper title. A personal touch.",
    "أضف عنوان المستند واسم المؤلف.",
    "file-text",
    "purple",
  ],
  [
    "reader",
    "Read PDF",
    "قراءة PDF",
    "A quiet space for your documents.",
    "مساحة هادئة لقراءة مستنداتك.",
    "book-open",
    "orange",
  ],
];
let lang = localStorage.getItem("suite-lang") || "en",
  theme = localStorage.getItem("suite-theme") || "dark",
  filter = "all",
  query = "",
  active = null,
  files = [],
  busy = false,
  readerDoc = null;
const $ = (s) => document.querySelector(s),
  t = (en, ar) => (lang === "ar" ? ar : en);
function icon(name, cls = "") {
  return `<i data-lucide="${name}" class="${cls}"></i>`;
}
function draw() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.documentElement.dataset.theme = theme;
  $("#app").innerHTML =
    `<aside class="sidebar"><a href="#" class="brand">${icon("layers-2")}<span>Suite<span class="brand-light">PDF</span><small>THE DOCUMENT STUDIO</small></span></a><div class="nav-caption">${t("WORKSPACE", "مساحة العمل")}</div><button class="nav active" id="home">${icon("layout-grid")}${t("All tools", "كل الأدوات")}<span>12</span></button><div class="side-note">${icon("sparkles")}<strong>${t("Good work. Zero limits.", "إنجاز مميز. بدون اشتراكات.")}</strong><p>${t("Your everyday PDF essentials, without the price tag.", "أدوات PDF اليومية، مجانًا وبين يديك.")}</p><span class="free-pill">${t("ALWAYS FREE", "مجاني دائمًا")}</span></div><div class="side-bottom">${icon("shield-check")}<span>${t("Private by design", "خصوصيتك أولًا")}<small>${t("Your files stay yours.", "ملفاتك تبقى لك.")}</small></span></div></aside>
 <div class="shell"><header><div class="breadcrumb">${t("Workspace", "مساحة العمل")} <span>/</span> <b>${t("All tools", "كل الأدوات")}</b></div><div class="header-actions"><button class="icon-btn" id="language" aria-label="Change language">${icon("languages")}<span>${lang === "en" ? "عربي" : "EN"}</span></button><button class="icon-btn" id="theme" aria-label="Toggle theme">${icon(theme === "dark" ? "sun" : "moon")}</button><span class="avatar">S</span></div></header>
 <main><section class="hero"><div class="hero-copy"><div class="eyebrow"><span></span>${t("LESS BUSYWORK. MORE POSSIBILITIES.", "أقل تعقيدًا. أكثر إنجازًا.")}</div><h1>${t("Big ideas.<br>Beautifully <em>handled.</em>", "أفكار كبيرة.<br>بكل <em>بساطة.</em>")}</h1><p>${t('Your complete PDF toolkit. Thoughtfully simple,<br class="desktop-br"> surprisingly powerful. And entirely yours.', 'كل أدوات PDF في مساحة واحدة. بسيطة، قوية،<br class="desktop-br"> ومصممة لتبقى ملفاتك بين يديك.')}</p><div class="hero-actions"><button class="hero-start" id="hero-start">${t("Let’s make it happen", "خلّينا نبدأ")}${icon("arrow-right")}</button><button class="hero-explore" id="hero-explore">${t("Explore the toolkit", "استكشف الأدوات")}${icon("arrow-up-right")}</button></div><div class="hero-tags"><span>${icon("shield-check")}${t("On-device processing", "معالجة على جهازك")}</span><span>${icon("zap")}${t("No sign-up. No limits.", "بدون تسجيل أو اشتراكات")}</span></div></div><div class="hero-art" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="float-chip chip-one">${icon("check")} ${t("Looking sharp", "جاهز للإنجاز")}</div><div class="paper paper-back"></div><div class="paper paper-front"><div class="paper-logo">${icon("file-text")} PDF</div><div class="paper-line wide"></div><div class="paper-line"></div><div class="paper-line short"></div><div class="paper-graph"><span></span><span></span><span></span><span></span><span></span></div><div class="paper-footer"><span>SUITE / 01</span>${icon("sparkles")}</div></div><div class="float-chip chip-two">${icon("lock-keyhole")} 100% ${t("private", "خصوصية")}</div><span class="art-star">✦</span></div></section>
 <section class="tool-section"><div class="section-heading"><div><h2>${t("A tool for every next step", "أداة لكل خطوة تالية")}<span class="count">12</span></h2><p>${t("From the first draft to the final send.", "من أول مسودة إلى آخر لمسة.")}</p></div><label class="search">${icon("search")}<input id="search" placeholder="${t("Find your tool…", "ابحث عن أداة…")}" value=""><kbd>⌘ K</kbd></label></div><div class="filters"><button data-filter="all" class="${filter === "all" ? "selected" : ""}">${t("All tools", "كل الأدوات")}</button><button data-filter="organize" class="${filter === "organize" ? "selected" : ""}">${t("Organize", "تنظيم")}</button><button data-filter="convert" class="${filter === "convert" ? "selected" : ""}">${t("Convert", "تحويل")}</button><button data-filter="edit" class="${filter === "edit" ? "selected" : ""}">${t("Edit & personalize", "تعديل وتخصيص")}</button></div><div class="tools" id="tools"></div></section><section class="privacy-banner"><div class="privacy-icon">${icon("fingerprint")}</div><div><h3>${t("Your documents. Your business.", "مستنداتك. خصوصيتك.")}</h3><p>${t("Files are processed right on your device. No uploads, no accounts, no compromises.", "نعالج ملفاتك على جهازك. بدون رفع للسيرفر، وبدون حسابات.")}</p></div>${icon("arrow-up-right", "privacy-arrow")}</section><footer><span>© ${new Date().getFullYear()} SuitePDF</span><span>${t("Made for your flow.", "مصمم ليناسبك.")} <span class="footer-dot">✦</span></span><span>${icon("globe-2")} ${t("English / العربية", "العربية / English")}</span></footer></main></div><div id="modal-root"></div><div id="toast" role="status"></div>`;
  attachDepth($(".hero"));
  $("#hero-start").onclick = () => openTool("merge");
  $("#hero-explore").onclick = () => {
    $(".tool-section").scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
    $("#search").focus({ preventScroll: true });
  };
  $("#search").value = query;
  drawTools();
  createIcons({ icons });
  $("#language").onclick = () => {
    lang = lang === "en" ? "ar" : "en";
    localStorage.setItem("suite-lang", lang);
    draw();
  };
  $("#theme").onclick = () => {
    theme = theme === "dark" ? "light" : "dark";
    localStorage.setItem("suite-theme", theme);
    draw();
  };
  $("#home").onclick = () => {
    query = "";
    filter = "all";
    draw();
  };
  $("#search").oninput = (e) => {
    query = e.target.value;
    drawTools();
  };
  document.querySelectorAll("[data-filter]").forEach(
    (b) =>
      (b.onclick = () => {
        filter = b.dataset.filter;
        draw();
      }),
  );
}
function drawTools() {
  const groups = {
    organize: ["merge", "extract", "rotate", "delete", "reverse"],
    convert: ["images", "pdfimages"],
    edit: ["watermark", "numbers", "reader", "metadata", "compress"],
  };
  const matched = tools.filter(
    (x) =>
      (filter === "all" || groups[filter].includes(x[0])) &&
      `${x[1]} ${x[2]}`.toLowerCase().includes(query.toLowerCase()),
  );
  $("#tools").innerHTML =
    matched
      .map(
        (x, index) =>
          `<button style="--stagger:${Math.min(index, 7) * 35}ms" class="tool-card" data-tool="${x[0]}"><div class="card-top"><span class="tool-icon ${x[6]}">${icon(x[5])}</span>${icon("arrow-up-right", "card-arrow")}</div><h3>${lang === "en" ? x[1] : x[2]}</h3><p>${lang === "en" ? x[3] : x[4]}</p><div class="card-bottom">${t("Open tool", "افتح الأداة")}${icon("arrow-right")}</div></button>`,
      )
      .join("") ||
    `<p class="empty">${t("No tools found. Try another search.", "لا توجد نتائج. جرّب بحثًا آخر.")}</p>`;
  createIcons({ icons });
  document
    .querySelectorAll("[data-tool]")
    .forEach((b) => (b.onclick = () => openTool(b.dataset.tool)));
}
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  setTimeout(() => $("#toast").classList.remove("show"), 5000);
}
function openTool(id) {
  active = tools.find((x) => x[0] === id);
  files = [];
  renderModal();
}
function closeModal() {
  if (busy) return;
  if (readerDoc) {
    readerDoc.destroy().catch(() => {});
    readerDoc = null;
  }
  $("#modal-root").innerHTML = "";
  active = null;
  document.body.style.overflow = "";
}
function renderModal() {
  const id = active[0];
  document.body.style.overflow = "hidden";
  $("#modal-root").innerHTML =
    `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div class="modal-heading"><span class="tool-icon ${active[6]}">${icon(active[5])}</span><button id="close" class="icon-btn" aria-label="Close">${icon("x")}</button></div><h2 id="dialog-title">${lang === "en" ? active[1] : active[2]}</h2><p class="modal-desc">${lang === "en" ? active[3] : active[4]}</p><label class="dropzone" id="dropzone">${icon("cloud-upload")}<strong>${t("Drop files here, or browse", "اسحب ملفاتك هنا أو اخترها")}</strong><span>${id === "images" ? "JPG · PNG" : "PDF"} · ${t("Processed privately on your device", "معالجة خاصة على جهازك")}</span><input id="file" type="file" accept="${id === "images" ? "image/jpeg,image/png" : ".pdf,application/pdf"}" ${["images", "merge"].includes(id) ? "multiple" : ""}></label><div id="file-list"></div>${["extract", "delete", "rotate"].includes(id) ? `<label class="field">${t("Pages (example: 1,3,5-8)", "الصفحات (مثال: 1,3,5-8)")}<input id="pages" dir="ltr" placeholder="${t("All pages", "كل الصفحات")}"></label>` : ""}${id === "watermark" ? `<label class="field">${t("Watermark text (Latin characters)", "نص العلامة المائية (أحرف لاتينية)")}<input id="watermark" placeholder="CONFIDENTIAL" maxlength="80" dir="ltr"></label>` : ""}${id === "metadata" ? `<label class="field">${t("Document title", "عنوان المستند")}<input id="doc-title" maxlength="200"></label><label class="field">${t("Author", "المؤلف")}<input id="doc-author" maxlength="200"></label>` : ""}${id === "compress" ? `<p class="warning-note">${t("For scanned documents. Rebuilds pages as images: searchable text, links and forms are lost. File size may increase. Keep your original.", "للمستندات المصوّرة. يحوّل الصفحات إلى صور، ويفقد النص القابل للبحث والروابط والنماذج. قد يزداد الحجم. احتفظ بالأصل.")}</p>` : ""}<div id="error" role="alert"></div><div id="reader"></div><button id="process" class="primary" disabled>${icon(id === "reader" ? "book-open" : "download")} ${id === "reader" ? t("Read document", "قراءة المستند") : t("Create & save PDF", "إنشاء وحفظ PDF")}</button><div class="modal-security">${icon("lock-keyhole")}${t("Your files never leave this device", "ملفاتك لا تغادر هذا الجهاز")}</div></section></div>`;
  createIcons({ icons });
  $("#close").onclick = closeModal;
  $(".modal-backdrop").onclick = (e) => {
    if (e.target === $(".modal-backdrop")) closeModal();
  };
  $("#file").onchange = (e) => addFiles([...e.target.files]);
  const zone = $("#dropzone");
  zone.ondragover = (e) => {
    e.preventDefault();
    zone.classList.add("drag");
  };
  zone.ondragleave = () => zone.classList.remove("drag");
  zone.ondrop = (e) => {
    e.preventDefault();
    zone.classList.remove("drag");
    addFiles([...e.dataTransfer.files]);
  };
  $("#process").onclick = run;
  $("#close").focus();
}
function addFiles(incoming) {
  const multi = ["merge", "images"].includes(active[0]);
  const valid = incoming.filter((f) =>
    active[0] === "images"
      ? ["image/jpeg", "image/png"].includes(f.type)
      : f.name.toLowerCase().endsWith(".pdf"),
  );
  if (valid.length !== incoming.length)
    toast(
      t("Please choose supported file types.", "اختر ملفات بالصيغة المطلوبة."),
    );
  files = multi ? [...files, ...valid] : valid.slice(0, 1);
  showFiles();
}
function showFiles() {
  $("#file-list").innerHTML = "";
  files.forEach((f, i) => {
    const row = document.createElement("div");
    row.className = "file-row";
    const name = document.createElement("span");
    name.textContent = `${i + 1}. ${f.name}`;
    const size = document.createElement("small");
    size.textContent = `${(f.size / 1048576).toFixed(1)} MB`;
    const remove = document.createElement("button");
    remove.className = "icon-btn";
    remove.textContent = "×";
    remove.setAttribute("aria-label", t("Remove file", "إزالة الملف"));
    remove.onclick = () => {
      files.splice(i, 1);
      showFiles();
    };
    if (files.length > 1) {
      const up = document.createElement("button"),
        down = document.createElement("button");
      up.className = down.className = "icon-btn";
      up.textContent = "↑";
      down.textContent = "↓";
      up.setAttribute("aria-label", t("Move up", "نقل للأعلى"));
      down.setAttribute("aria-label", t("Move down", "نقل للأسفل"));
      up.disabled = i === 0;
      down.disabled = i === files.length - 1;
      up.onclick = () => {
        [files[i - 1], files[i]] = [files[i], files[i - 1]];
        showFiles();
      };
      down.onclick = () => {
        [files[i + 1], files[i]] = [files[i], files[i + 1]];
        showFiles();
      };
      row.append(name, size, up, down, remove);
    } else row.append(name, size, remove);
    $("#file-list").append(row);
  });
  $("#process").disabled = !files.length;
}
async function save(bytes, ext = "pdf") {
  const mime = ext === "zip" ? "application/zip" : "application/pdf";
  if (Capacitor.isNativePlatform()) {
    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192)
      binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    const result = await Filesystem.writeFile({
      path: `SuitePDF-${Date.now()}.${ext}`,
      data: btoa(binary),
      directory: Directory.Cache,
    });
    await Share.share({
      title: "SuitePDF",
      url: result.uri,
      dialogTitle: t("Save or share your PDF", "احفظ أو شارك ملف PDF"),
    });
  } else {
    const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `SuitePDF-${active[0]}.${ext}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
}
async function run() {
  if (busy || !files.length) return;
  busy = true;
  $("#process").disabled = true;
  $("#close").disabled = true;
  $("#error").textContent = "";
  const button = $("#process");
  const label = button.innerHTML;
  button.textContent = t("Working on your document…", "جاري تجهيز مستندك…");
  try {
    if (active[0] === "reader") await readPDF();
    else if (["compress", "pdfimages"].includes(active[0])) {
      const bytes = await rasterizePDF(files[0], active[0], (i, n) => {
        button.textContent =
          t("Processing page ", "جاري معالجة الصفحة ") + `${i} / ${n}`;
      });
      await save(bytes, active[0] === "pdfimages" ? "zip" : "pdf");
      toast(
        active[0] === "compress"
          ? t(
              `Done: ${(files[0].size / 1048576).toFixed(2)} → ${(bytes.length / 1048576).toFixed(2)} MB`,
              `تم: ${(files[0].size / 1048576).toFixed(2)} ← ${(bytes.length / 1048576).toFixed(2)} MB`,
            )
          : t("Your images are ready.", "صورك جاهزة."),
      );
    } else {
      const bytes = await processPDF(active[0], files, {
        pages: $("#pages")?.value,
        text: $("#watermark")?.value,
        title: $("#doc-title")?.value,
        author: $("#doc-author")?.value,
      });
      await save(bytes);
      toast(t("Your PDF is ready.", "ملفك جاهز."));
    }
  } catch (e) {
    $("#error").textContent =
      t("Could not process this file. ", "تعذّرت معالجة الملف. ") +
      (e.message || "");
  } finally {
    busy = false;
    button.innerHTML = label;
    button.disabled = false;
    $("#close").disabled = false;
  }
}
async function readPDF() {
  if (readerDoc) {
    await readerDoc.destroy();
    readerDoc = null;
  }
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
  const doc = await pdfjs.getDocument({
    data: await files[0].arrayBuffer(),
    isEvalSupported: false,
  }).promise;
  readerDoc = doc;
  const root = $("#reader");
  root.innerHTML = "";
  let page = 1;
  const nav = document.createElement("div");
  nav.className = "reader-nav";
  const prev = document.createElement("button"),
    next = document.createElement("button"),
    status = document.createElement("span");
  prev.textContent = "←";
  next.textContent = "→";
  prev.className = next.className = "icon-btn";
  nav.append(prev, status, next);
  const canvas = document.createElement("canvas");
  root.append(nav, canvas);
  async function paint() {
    prev.disabled = next.disabled = true;
    const p = await doc.getPage(page);
    const base = p.getViewport({ scale: 1 });
    const viewport = p.getViewport({
      scale: Math.min(2, Math.max(240, root.clientWidth) / base.width),
    });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await p.render({ canvasContext: canvas.getContext("2d"), viewport })
      .promise;
    status.textContent = `${page} / ${doc.numPages}`;
    prev.disabled = page === 1;
    next.disabled = page === doc.numPages;
  }
  prev.onclick = async () => {
    page--;
    await paint();
  };
  next.onclick = async () => {
    page++;
    await paint();
  };
  await paint();
}
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    $("#search")?.focus();
  }
  if (e.key === "Escape") closeModal();
  if (e.key === "Tab" && active) {
    const focusable = [
      ...document.querySelectorAll(".modal button:not(:disabled),.modal input"),
    ];
    const first = focusable[0],
      last = focusable.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});
draw();

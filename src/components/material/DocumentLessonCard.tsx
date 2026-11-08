import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  FaExpand,
  FaFileAlt,
  FaFileExcel,
  FaFilePdf,
  FaFilePowerpoint,
  FaFileWord,
  FaTimes,
} from "react-icons/fa";
import { useTheme } from "../theme/ThemeContext";
import { formatFileSize, getFileExtension } from "./lessonCard.utils";
import type { LessonCardData } from "./lessonCard.types";
import LessonCardFooter from "./LessonCardFooter";
import { detectKindFromBytes, isKnownDocExtension, sniffRemoteKind } from "./DocumentPreview.utils";

interface DocumentLessonCardProps {
  lesson: LessonCardData;
  onDelete?: (lesson: LessonCardData) => void;
  isDeleting?: boolean;
  actions?: ReactNode;
}

const documentTypes: Record<string, { label: string; icon: typeof FaFileAlt; color: string }> = {
  pdf: { label: "PDF", icon: FaFilePdf, color: "bg-red-500 text-white" },
  doc: { label: "DOC", icon: FaFileWord, color: "bg-blue-600 text-white" },
  docx: { label: "DOC", icon: FaFileWord, color: "bg-blue-600 text-white" },
  ppt: { label: "PPT", icon: FaFilePowerpoint, color: "bg-orange-500 text-white" },
  pptx: { label: "PPT", icon: FaFilePowerpoint, color: "bg-orange-500 text-white" },
  xls: { label: "XLS", icon: FaFileExcel, color: "bg-green-600 text-white" },
  xlsx: { label: "XLS", icon: FaFileExcel, color: "bg-green-600 text-white" },
  csv: { label: "CSV", icon: FaFileExcel, color: "bg-green-600 text-white" },
  txt: { label: "TXT", icon: FaFileAlt, color: "bg-neutral-500 text-white" },
  file: { label: "FILE", icon: FaFileAlt, color: "bg-neutral-500 text-white" },
};

/* ---------- PDF rendered page-by-page (works even when Cloudinary blocks raw PDF delivery) ---------- */

const MAX_PDF_PAGES = 60;

const isCloudinaryPdf = (url: string) => url.includes("res.cloudinary.com") && url.includes("/image/upload/");

const cloudinaryPageUrl = (url: string, page: number) =>
  url.replace("/upload/", `/upload/pg_${page},f_jpg,q_auto,w_1400/`).replace(/\.pdf(\?.*)?$/i, ".jpg");

function PdfPages({ url, title }: { url: string; title: string }) {
  const { theme } = useTheme();
  const [pages, setPages] = useState(1);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <p className={`p-6 text-sm ${theme ? "text-gray-300" : "text-neutral-600"}`}>
        PDF preview could not be loaded.
      </p>
    );
  }

  return (
    <div className={`h-full space-y-4 overflow-auto rounded-xl p-4 ${theme ? "bg-black/30" : "bg-neutral-100"}`}>
      {Array.from({ length: pages }, (_, index) => {
        const page = index + 1;
        return (
          <img
            key={page}
            src={cloudinaryPageUrl(url, page)}
            alt={`${title} - page ${page}`}
            className="mx-auto block w-full max-w-3xl rounded-lg bg-white shadow-md"
            onLoad={() => {
              if (page === pages && pages < MAX_PDF_PAGES) setPages(pages + 1);
            }}
            onError={() => {
              if (page === 1) setFailed(true);
              else setPages(page - 1);
            }}
          />
        );
      })}
    </div>
  );
}

/* ---------- Preview modal ---------- */

const MAX_SHEET_ROWS = 500;
const MAX_SHEET_COLS = 40;

interface SheetData {
  name: string;
  rows: string[][];
  truncated: boolean;
}

type ViewState =
  | { type: "loading" }
  | { type: "error"; message: string }
  | { type: "pdf-pages" }
  | { type: "pdf-blob"; src: string }
  | { type: "text"; text: string }
  | { type: "sheet"; sheets: SheetData[] }
  | { type: "html"; html: string }
  | { type: "slides"; slides: string[][] }
  | { type: "unsupported"; message: string };

const wrapDocHtml = (body: string) =>
  `<!doctype html><html><head><meta charset="utf-8"><style>
body{font-family:Georgia,'Times New Roman',serif;line-height:1.65;color:#111;background:#fff;margin:0;padding:32px 40px;}
table{border-collapse:collapse;margin:12px 0}td,th{border:1px solid #ccc;padding:6px 10px}
img{max-width:100%;height:auto}h1,h2,h3{font-family:system-ui,sans-serif}
</style></head><body>${body}</body></html>`;

function DocumentPreviewModal({
  url,
  title,
  extension,
  onClose,
}: {
  url: string;
  title: string;
  extension: string;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const [view, setView] = useState<ViewState>({ type: "loading" });
  const [activeSheet, setActiveSheet] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";

    const load = async () => {
      // Cloudinary-hosted PDF with a normal extension: render page images (no raw PDF download needed).
      if (extension === "pdf" && isCloudinaryPdf(url)) {
        setView({ type: "pdf-pages" });
        return;
      }

      setView({ type: "loading" });

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const buffer = await response.arrayBuffer();
        if (cancelled) return;

        const bytes = new Uint8Array(buffer);
        const kind = detectKindFromBytes(bytes);

        switch (kind) {
          case "pdf": {
            objectUrl = URL.createObjectURL(new Blob([buffer], { type: "application/pdf" }));
            setView({ type: "pdf-blob", src: objectUrl });
            return;
          }

          case "xlsx":
          case "xls": {
            const XLSX = await import("xlsx");
            const workbook = XLSX.read(buffer, { type: "array" });
            const sheets: SheetData[] = workbook.SheetNames.map((name) => {
              const raw = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[name], {
                header: 1,
                defval: "",
                raw: false,
              }) as unknown[][];

              const truncated = raw.length > MAX_SHEET_ROWS;
              const limited = raw.slice(0, MAX_SHEET_ROWS);
              const columnCount = Math.min(
                limited.reduce((max, row) => Math.max(max, row.length), 0),
                MAX_SHEET_COLS
              );
              const rows = limited.map((row) =>
                Array.from({ length: columnCount }, (_, col) => String(row[col] ?? ""))
              );
              return { name, rows, truncated };
            });
            if (cancelled) return;
            setActiveSheet(0);
            setView({ type: "sheet", sheets });
            return;
          }

          case "docx": {
            const mod: any = await import("mammoth");
            const mammoth = mod.default ?? mod;
            const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
            if (cancelled) return;
            setView({ type: "html", html: wrapDocHtml(result.value || "<p>This document is empty.</p>") });
            return;
          }

          case "pptx": {
            const mod: any = await import("jszip");
            const JSZip = mod.default ?? mod;
            const zip = await JSZip.loadAsync(buffer);

            const slideNames: string[] = Object.keys(zip.files)
              .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
              .sort((a, b) => Number(a.match(/(\d+)\.xml$/)![1]) - Number(b.match(/(\d+)\.xml$/)![1]));

            const slides: string[][] = [];
            for (const name of slideNames) {
              const xml = await zip.file(name).async("string");
              const doc = new DOMParser().parseFromString(xml, "application/xml");
              const paragraphs = Array.from(doc.getElementsByTagName("a:p"))
                .map((p) =>
                  Array.from(p.getElementsByTagName("a:t"))
                    .map((t) => t.textContent ?? "")
                    .join("")
                )
                .filter((line) => line.trim().length > 0);
              slides.push(paragraphs);
            }
            if (cancelled) return;
            setView({ type: "slides", slides });
            return;
          }

          case "txt": {
            setView({ type: "text", text: new TextDecoder("utf-8").decode(bytes) });
            return;
          }

          case "doc":
          case "ppt":
            setView({
              type: "unsupported",
              message: "Old .doc / .ppt files cannot be previewed. Please upload them as .docx / .pptx.",
            });
            return;

          default:
            setView({ type: "unsupported", message: "Preview is not available for this file type." });
        }
      } catch {
        if (!cancelled) setView({ type: "error", message: "Document could not be loaded. Please try again." });
      }
    };

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, extension]);

  const surface = theme ? "bg-gray-900 text-white border-white/10" : "bg-white text-neutral-900 border-neutral-200";
  const muted = theme ? "text-gray-400" : "text-neutral-500";
  const panel = theme ? "bg-black/30 text-gray-200" : "bg-neutral-50 text-neutral-800";

  const renderBody = () => {
    switch (view.type) {
      case "loading":
        return <p className={`p-6 text-sm ${muted}`}>Loading document...</p>;

      case "error":
        return <p className="p-6 text-sm text-red-500">{view.message}</p>;

      case "unsupported":
        return <p className={`p-6 text-sm ${muted}`}>{view.message}</p>;

      case "pdf-pages":
        return <PdfPages url={url} title={title} />;

      case "pdf-blob":
        return <iframe title={title} src={`${view.src}#toolbar=0&navpanes=0`} className="h-full w-full rounded-xl border-0 bg-white" />;

      case "text":
        return (
          <pre className={`h-full overflow-auto whitespace-pre-wrap wrap-break-word rounded-xl p-6 text-sm leading-relaxed ${panel}`}>
            {view.text || "This document is empty."}
          </pre>
        );

      case "html":
        // sandbox="" -> no scripts / no navigation inside the rendered document
        return <iframe title={title} srcDoc={view.html} sandbox="" className="h-full w-full rounded-xl border-0 bg-white" />;

      case "slides":
        return (
          <div className={`h-full space-y-4 overflow-auto rounded-xl p-4 ${theme ? "bg-black/30" : "bg-neutral-100"}`}>
            {view.slides.length === 0 && <p className={`text-sm ${muted}`}>No slide text found.</p>}
            {view.slides.map((lines, index) => (
              <div key={index} className="mx-auto max-w-3xl rounded-2xl bg-white p-6 text-neutral-800 shadow-md">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-neutral-400">Slide {index + 1}</p>
                {lines.length === 0 ? (
                  <p className="text-sm text-neutral-400">(no text)</p>
                ) : (
                  lines.map((line, i) => (
                    <p key={i} className={i === 0 ? "text-lg font-semibold" : "mt-1.5 text-sm"}>
                      {line}
                    </p>
                  ))
                )}
              </div>
            ))}
          </div>
        );

      case "sheet": {
        const sheet = view.sheets[activeSheet] ?? view.sheets[0];
        return (
          <div className="flex h-full flex-col gap-3">
            {view.sheets.length > 1 && (
              <div className="flex shrink-0 flex-wrap gap-2">
                {view.sheets.map((item, index) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setActiveSheet(index)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      index === activeSheet
                        ? theme
                          ? "bg-blue-500 text-white"
                          : "bg-red-500 text-white"
                        : theme
                          ? "bg-white/10 text-gray-300 hover:bg-white/15"
                          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            )}

            <div className={`min-h-0 flex-1 overflow-auto rounded-xl border ${theme ? "border-white/10" : "border-neutral-200"}`}>
              {sheet && sheet.rows.length > 0 ? (
                <table className="w-max min-w-full border-collapse text-sm">
                  <tbody>
                    {sheet.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex === 0 ? (theme ? "bg-white/10 font-semibold" : "bg-neutral-100 font-semibold") : ""}>
                        <td className={`sticky left-0 border px-2 py-1.5 text-center text-xs ${muted} ${theme ? "border-white/10 bg-gray-900" : "border-neutral-200 bg-neutral-50"}`}>
                          {rowIndex + 1}
                        </td>
                        {row.map((cell, colIndex) => (
                          <td key={colIndex} className={`whitespace-pre-wrap border px-3 py-1.5 ${theme ? "border-white/10" : "border-neutral-200"}`}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className={`p-6 text-sm ${muted}`}>This sheet is empty.</p>
              )}
            </div>

            {sheet?.truncated && (
              <p className={`shrink-0 text-xs ${muted}`}>Showing the first {MAX_SHEET_ROWS} rows.</p>
            )}
          </div>
        );
      }
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border shadow-2xl ${surface}`}
      >
        <div className={`flex items-center justify-between gap-3 border-b px-5 py-3 ${theme ? "border-white/10" : "border-neutral-200"}`}>
          <h3 className="min-w-0 truncate text-base font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close document"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
              theme ? "hover:bg-white/10" : "hover:bg-neutral-100"
            }`}
          >
            <FaTimes />
          </button>
        </div>

        <div className="min-h-0 flex-1 p-3">{renderBody()}</div>
      </div>
    </div>,
    document.body
  );
}

/* ---------- Card ---------- */

export default function DocumentLessonCard({
  lesson,
  onDelete,
  isDeleting = false,
  actions,
}: DocumentLessonCardProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [sniffedExtension, setSniffedExtension] = useState("");
  const mutedText = theme ? "text-gray-400" : "text-neutral-500";

  const nameExtension = getFileExtension(lesson.fileName || lesson.mediaUrl).toLowerCase();
  const hasKnownExtension = isKnownDocExtension(nameExtension);

  // File name has no usable extension -> look at the file's content once to find the real type.
  useEffect(() => {
    if (!lesson.mediaUrl || hasKnownExtension) return;

    let cancelled = false;
    void sniffRemoteKind(lesson.mediaUrl).then((kind) => {
      if (!cancelled && kind !== "unknown") setSniffedExtension(kind);
    });

    return () => {
      cancelled = true;
    };
  }, [lesson.mediaUrl, hasKnownExtension]);

  const extension = hasKnownExtension ? nameExtension : sniffedExtension;
  const documentType = documentTypes[extension] ?? documentTypes.file;
  const DocumentIcon = documentType.icon;
  const fileSize = formatFileSize(lesson.fileSize);
  const baseName = lesson.fileName || lesson.title || "lesson-document";
  const fileName = hasKnownExtension || !extension ? baseName : `${baseName}.${extension}`;

  const openDocument = () => {
    if (lesson.mediaUrl) setIsOpen(true);
  };

  return (
    <>
      <article
        className={`group flex flex-col overflow-hidden rounded-3xl border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${theme ? "border-white/10 bg-white/5 backdrop-blur-xl" : "border-neutral-200 bg-white"}`}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={openDocument}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openDocument();
            }
          }}
          title={lesson.mediaUrl ? "Click to view document" : "No document URL available"}
          className={`relative flex aspect-video w-full items-center justify-center overflow-hidden bg-linear-to-br cursor-pointer ${theme ? "from-blue-950 via-slate-900 to-slate-800" : "from-red-50 via-rose-100 to-orange-100"}`}
        >
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/30 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
            <FaFileAlt className="h-3 w-3" aria-hidden="true" />
            Document
          </span>

          {lesson.mediaUrl && (
            <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/40 px-3 py-1 text-xs font-medium text-white opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100">
              <FaExpand className="h-3 w-3" aria-hidden="true" />
              View
            </span>
          )}

          <div
            className={`relative h-[72%] w-[58%] -rotate-3 rounded-xl bg-white p-4 shadow-xl transition-transform duration-300 group-hover:rotate-0 sm:w-[52%] ${theme ? "text-neutral-700" : "text-neutral-600"}`}
            aria-hidden="true"
          >
            <div className="absolute right-0 top-0 h-9 w-9 overflow-hidden rounded-tr-xl">
              <div className="absolute -right-4 -top-4 h-8 w-8 rotate-45 bg-neutral-200 shadow-inner" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-2 w-3/4 rounded-full bg-neutral-200" />
              <div className="h-1.5 w-full rounded-full bg-neutral-100" />
              <div className="h-1.5 w-5/6 rounded-full bg-neutral-100" />
              <div className="h-1.5 w-2/3 rounded-full bg-neutral-100" />
              <div className="h-1.5 w-full rounded-full bg-neutral-100" />
            </div>
            <div
              className={`absolute bottom-3 right-3 flex h-12 w-12 items-center justify-center rounded-xl shadow-md ${documentType.color}`}
            >
              <DocumentIcon className="h-7 w-7" />
            </div>
            <span className="absolute bottom-4 left-4 text-[10px] font-bold tracking-wider text-neutral-500">
              {documentType.label}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className={`truncate text-lg font-semibold leading-snug ${theme ? "text-white" : "text-neutral-900"}`}>
            {lesson.title}
          </h3>
          <div className={`mt-1.5 flex min-w-0 items-center gap-2 text-xs ${mutedText}`}>
            <span className="min-w-0 truncate" title={fileName}>{fileName}</span>
            {fileSize && <span className="shrink-0">{fileSize}</span>}
          </div>

          {lesson.description && (
            <p className={`mt-3 line-clamp-2 text-sm ${mutedText}`}>{lesson.description}</p>
          )}
          <LessonCardFooter
            lesson={lesson}
            onDelete={onDelete}
            isDeleting={isDeleting}
            actions={actions}
          />
        </div>
      </article>

      {isOpen && (
        <DocumentPreviewModal
          url={lesson.mediaUrl}
          title={lesson.title}
          extension={extension}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
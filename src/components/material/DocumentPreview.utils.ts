/**
 * Detects the real type of a document from its content (magic bytes),
 * so it works even when the stored file name / URL has no extension.
 */

export type DocKind = "pdf" | "xlsx" | "xls" | "docx" | "doc" | "pptx" | "ppt" | "txt" | "unknown";

export const KNOWN_DOC_EXTENSIONS = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "csv"];

export const isKnownDocExtension = (ext: string) => KNOWN_DOC_EXTENSIONS.includes(ext.toLowerCase());

const asciiBytes = (text: string) => Array.from(text, (char) => char.charCodeAt(0));

const utf16Bytes = (text: string) => Array.from(text).flatMap((char) => [char.charCodeAt(0), 0]);

const containsBytes = (bytes: Uint8Array, needle: number[]) => {
  const first = needle[0];
  const lastStart = bytes.length - needle.length;

  for (let i = 0; i <= lastStart; i++) {
    if (bytes[i] !== first) continue;

    let matched = true;
    for (let j = 1; j < needle.length; j++) {
      if (bytes[i + j] !== needle[j]) {
        matched = false;
        break;
      }
    }
    if (matched) return true;
  }
  return false;
};

const looksLikeText = (bytes: Uint8Array) => {
  const sample = bytes.subarray(0, 4096);
  if (sample.length === 0) return true;

  let suspicious = 0;
  for (const byte of sample) {
    if (byte === 0) return false;
    const isControl = byte < 32 && byte !== 9 && byte !== 10 && byte !== 13;
    if (isControl) suspicious += 1;
  }
  return suspicious / sample.length < 0.02;
};

export const detectKindFromBytes = (bytes: Uint8Array): DocKind => {
  if (bytes.length < 4) return looksLikeText(bytes) ? "txt" : "unknown";

  // %PDF
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "pdf";

  // ZIP container -> modern Office (xlsx / docx / pptx)
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    if (containsBytes(bytes, asciiBytes("xl/"))) return "xlsx";
    if (containsBytes(bytes, asciiBytes("word/"))) return "docx";
    if (containsBytes(bytes, asciiBytes("ppt/"))) return "pptx";
    return "unknown";
  }

  // OLE container -> legacy Office (xls / doc / ppt)
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) {
    if (containsBytes(bytes, utf16Bytes("Workbook")) || containsBytes(bytes, utf16Bytes("Book"))) return "xls";
    if (containsBytes(bytes, utf16Bytes("WordDocument"))) return "doc";
    if (containsBytes(bytes, utf16Bytes("PowerPoint Document"))) return "ppt";
    return "unknown";
  }

  return looksLikeText(bytes) ? "txt" : "unknown";
};

/** Reads only the first few KB of a remote file to find out what it is. */
export const sniffRemoteKind = async (url: string, limit = 16384): Promise<DocKind> => {
  try {
    const response = await fetch(url);
    if (!response.ok || !response.body) return "unknown";

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;

    while (total < limit) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        total += value.length;
      }
    }
    void reader.cancel();

    const merged = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    return detectKindFromBytes(merged);
  } catch {
    return "unknown";
  }
};
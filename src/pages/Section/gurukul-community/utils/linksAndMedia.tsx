import { MAX_IMAGE_DIM } from "../constants";
import type { ChatMessage, LinkItem, MediaBuckets, MediaItem } from "../types";

export const isImageMime = (mime: string) => mime.startsWith("image/");

export const readAsDataUrl = (f: Blob) =>
    new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(r.error);
        r.readAsDataURL(f);
    });

/** Photos are scaled down + compressed so they fit in browser storage. */
export const compressImage = async (file: File): Promise<string> => {
    if (file.type === "image/gif" || file.type === "image/svg+xml") return readAsDataUrl(file);
    const url = URL.createObjectURL(file);
    try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const i = new Image();
            i.onload = () => resolve(i);
            i.onerror = () => reject(new Error("Invalid image"));
            i.src = url;
        });
        const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return readAsDataUrl(file);
        ctx.fillStyle = "#ffffff"; // transparent PNGs get a white background in JPEG
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        return canvas.toDataURL("image/jpeg", 0.78);
    } finally {
        URL.revokeObjectURL(url);
    }
};

export const prepareAttachment = async (file: File): Promise<{ data: string; mime: string; name: string }> => {
    if (isImageMime(file.type)) {
        const data = await compressImage(file);
        const compressed = data.startsWith("data:image/jpeg") && file.type !== "image/jpeg";
        const name = compressed ? file.name.replace(/\.[^.]+$/, "") + ".jpg" : file.name;
        return { data, mime: data.slice(5, data.indexOf(";")) || file.type, name };
    }
    return { data: await readAsDataUrl(file), mime: file.type || "application/octet-stream", name: file.name };
};

/* ---------------- Links & Buckets ---------------- */
export const URL_RE = /(https?:\/\/[^\s<>"]+|www\.[^\s<>"]+)/gi;

export const splitTrailing = (u: string): [string, string] => {
    let end = u.length;
    while (end > 0 && /[.,;:!?)\]'"]/.test(u[end - 1])) end--;
    return [u.slice(0, end), u.slice(end)];
};

export const hrefOf = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);

export const hostOf = (u: string) => {
    try {
        return new URL(hrefOf(u)).hostname.replace(/^www\./, "");
    } catch {
        return u;
    }
};

export const extractLinks = (text: string): string[] => {
    if (!text) return [];
    const out: string[] = [];
    for (const m of text.matchAll(URL_RE)) {
        const [clean] = splitTrailing(m[0]);
        if (!clean) continue;
        try {
            new URL(hrefOf(clean));
        } catch {
            continue;
        }
        if (!out.includes(clean)) out.push(clean);
    }
    return out;
};

/** Turns URLs inside a message into clickable links. */
export const renderText = (text: string) =>
    text.split(URL_RE).map((part, i) => {
        if (i % 2 === 0) return part;
        const [clean, rest] = splitTrailing(part);
        return (
            <span key={i}>
                <a
                    href={hrefOf(clean)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="break-all underline underline-offset-2"
                >
                    {clean}
                </a>
                {rest}
            </span>
        );
    });

export const previewOf = (m: ChatMessage) => {
    if (!m.file) return m.text;
    const img = isImageMime(m.file.mime);
    return `${img ? "📷" : "📄"} ${m.text || (img ? "Photo" : m.file.name)}`;
};

export const buildBuckets = (sources: { key: string; title: string; list: ChatMessage[] }[]): MediaBuckets => {
    const media: MediaItem[] = [];
    const docs: MediaItem[] = [];
    const links: LinkItem[] = [];
    sources.forEach((s) =>
        s.list.forEach((m) => {
            if (m.file) {
                (isImageMime(m.file.mime) ? media : docs).push({ msg: m, convKey: s.key, chat: s.title });
            }
            if (m.text) {
                extractLinks(m.text).forEach((url, i) =>
                    links.push({ msg: m, convKey: s.key, chat: s.title, url, key: `${s.key}-${m.id}-${i}` })
                );
            }
        })
    );
    const byTime = (a: { msg: ChatMessage }, b: { msg: ChatMessage }) =>
        Date.parse(b.msg.time) - Date.parse(a.msg.time);
    media.sort(byTime);
    docs.sort(byTime);
    links.sort(byTime);
    return { media, docs, links };
};

export const monthLabel = (iso: string, nowMs: number) => {
    const d = new Date(iso);
    const n = new Date(nowMs);
    if (d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth()) return "This month";
    return d.toLocaleDateString([], { month: "long", year: "numeric" });
};

export const groupByMonth = <T extends { msg: ChatMessage }>(items: T[], nowMs: number): [string, T[]][] => {
    const out: [string, T[]][] = [];
    items.forEach((it) => {
        const label = monthLabel(it.msg.time, nowMs);
        const last = out[out.length - 1];
        if (last && last[0] === label) last[1].push(it);
        else out.push([label, [it]]);
    });
    return out;
};

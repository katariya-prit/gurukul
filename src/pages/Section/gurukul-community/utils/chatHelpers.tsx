import type { ChatMessage } from "../types";
import { isImageMime } from "./linksAndMedia";

export const HIDE_SCROLL = "[-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden";

export const MAX_PINS = 3;
export const MAX_FORWARD = 5;
export const MAX_PENDING_FILES = 10;
export const MAX_DOC_BYTES = 1.5 * 1024 * 1024;
export const MAX_IMAGE_SRC_BYTES = 20 * 1024 * 1024;

export const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
export const MORE_EMOJIS = [
    "👍", "❤️", "😂", "😮", "😢", "🙏",
    "👏", "🔥", "🎉", "😍", "😊", "😎",
    "🤔", "😅", "😭", "😡", "👌", "✌️",
    "💯", "✅", "❌", "👀", "🤝", "💪",
];

export const TTL_CHOICES = [
    { ms: 0, label: "Off" },
    { ms: 24 * 60 * 60 * 1000, label: "24 hours" },
    { ms: 7 * 24 * 60 * 60 * 1000, label: "7 days" },
    { ms: 90 * 24 * 60 * 60 * 1000, label: "90 days" },
];

export const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
};

export const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const formatBytes = (n: number) => {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

export const fileExt = (name: string) => {
    const i = name.lastIndexOf(".");
    return i > 0 && i < name.length - 1 ? name.slice(i + 1).toUpperCase().slice(0, 5) : "FILE";
};

export const muteLabel = (until: number) => {
    if (until === -1) return "Muted";
    const d = new Date(until);
    const sameDay = d.toDateString() === new Date().toDateString();
    return `Muted until ${
        sameDay
            ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : d.toLocaleDateString([], { day: "2-digit", month: "short" })
    }`;
};

/* ---- links ---- */
const URL_RE = /(https?:\/\/[^\s<>"]+|www\.[^\s<>"]+)/gi;

const splitTrailing = (u: string): [string, string] => {
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
    if (m.deleted) return "🚫 This message was deleted";
    if (!m.file) return m.text;
    const img = isImageMime(m.file.mime);
    return `${img ? "📷" : "📄"} ${m.text || (img ? "Photo" : m.file.name)}`;
};

/* ---- media grouping ---- */
const monthLabel = (iso: string, nowMs: number) => {
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
import type { ChatMessage } from "../types";
export { ttlLabel } from "../constants";

export const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const formatDay = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const yest = new Date();
    yest.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yest.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
};

export const formatListTime = (ms: number) => {
    if (!ms) return "";
    const d = new Date(ms);
    const today = new Date();
    const yest = new Date();
    yest.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString())
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (d.toDateString() === yest.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { day: "2-digit", month: "short" });
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

export const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
};

export const formatBytes = (n: number) => {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

export const fileExt = (name: string) => {
    const i = name.lastIndexOf(".");
    return i > 0 && i < name.length - 1 ? name.slice(i + 1).toUpperCase().slice(0, 5) : "FILE";
};

export const buildExportText = (list: ChatMessage[]) =>
    list
        .map((m) => {
            const d = new Date(m.time);
            const date = d.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "numeric" });
            const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const body = m.file ? `<attached: ${m.file.name}>${m.text ? ` ${m.text}` : ""}` : m.text;
            return `${date}, ${time} - ${m.sender_name || "Unknown"}: ${body}`;
        })
        .join("\n");

export const safeFileName = (s: string) => s.replace(/[\\/:*?"<>|]+/g, "").trim() || "chat";

export const downloadText = (filename: string, text: string) => {
    const blob = new Blob(["\uFEFF" + text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

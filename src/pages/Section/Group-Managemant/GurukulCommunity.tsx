/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback, memo } from "react";
import { toast } from "sonner";
import { useTheme } from "../../../components/theme/ThemeContext";
import ChatThemePicker from "../../../components/chat/ChatThemePicker";
import { DEFAULT_CHAT_THEME_ID, getChatTheme } from "../../../components/chat/chatThemes";
import { groupService, type GroupData } from "../../../services/groupService";
import {
    IoSend,
    IoPeopleOutline,
    IoColorPaletteOutline,
    IoSearchOutline,
    IoLockClosedOutline,
    IoCreateOutline,
    IoArrowBack,
    IoClose,
    IoChevronForward,
    IoChevronBack,
    IoPaperPlaneOutline,
    IoStarOutline,
    IoStar,
    IoNotificationsOutline,
    IoNotificationsOffOutline,
    IoTimerOutline,
    IoShieldCheckmarkOutline,
    IoSettingsOutline,
    IoDownloadOutline,
    IoRemoveCircleOutline,
    IoTrashOutline,
    IoChatboxOutline,
    IoPersonAddOutline,
    IoLinkOutline,
    IoTimeOutline,
    IoCheckmark,
    IoImageOutline,
    IoImagesOutline,
    IoDocumentTextOutline,
    IoAttachOutline,
    IoGlobeOutline,
    IoOpenOutline,
} from "react-icons/io5";
import gurukulLogo from "../../../assets/gurukul.png";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */
type FileMeta = {
    name: string;
    size: number; // original size in bytes
    mime: string;
};

type ChatMessage = {
    id: string;
    conv_key: string;
    sender_suid: string;
    sender_name: string;
    text: string; // message text, or the caption when a file is attached
    time: string; // ISO
    file?: FileMeta; // the file data itself is stored under fileKey(id)
};

type ChatUser = {
    suid: string;
    name: string;
    avatar?: string;
    role?: string;
    isSuper: boolean;
};

type DirUser = {
    suid: string;
    name: string;
    avatar?: string;
    role_code?: string;
    isSuper: boolean;
};

type ConvItem = {
    key: string;
    kind: "group" | "dm";
    id: string; // group_id (as string) or peer suid
    title: string;
    avatar?: string;
    isSuper: boolean;
    preview: string;
    lastTime: number; // ms, 0 = no messages
    lastMine: boolean;
    unread: number;
    muted: boolean;
};

/** Personal (per user, per conversation) settings */
type ConvMeta = {
    starred: string[];
    mutedUntil: number; // 0 = not muted, -1 = always, >0 = timestamp
    muteChoice: string;
    clearedAt: number; // messages older than this are hidden for this user
    keep: boolean; // keep an (empty) DM in the list after "Clear chat"
};

/** Shared (per conversation) settings */
type SharedSettings = {
    ttl: number; // disappearing messages duration in ms, 0 = off
    ttlSince: number; // only messages sent after this time disappear
    advPrivacy: boolean;
    // ---- group permissions ----
    onlyAdminsSend: boolean; // false => members can send new messages
    membersEditSettings: boolean; // members can change group settings (disappearing timer, privacy)
    membersAdd: boolean; // members can add other members
    membersInvite: boolean; // members can use the invite link
    sendHistory: boolean; // new members can see past messages
    approveNew: boolean; // admins must approve people joining via link
    admins: string[]; // extra group admins (suids). Super Admins are always admins
    added: string[]; // members added from this app (suids)
    pending: string[]; // join requests waiting for approval (suids)
    historyFrom: Record<string, number>; // per member: only messages after this time are visible (0 = all)
};

type MediaItem = { msg: ChatMessage; convKey: string; chat: string };
type LinkItem = MediaItem & { url: string; key: string };
type MediaBuckets = { media: MediaItem[]; docs: MediaItem[]; links: LinkItem[] };

type FilterTab = "all" | "unread" | "groups";
type InfoView = "main" | "starred" | "permissions" | "admins" | "addMembers" | "pending" | "privacy" | "media";
type MediaTab = "media" | "docs" | "links";
type DialogKind = "mute" | "disappearing" | "encryption" | "clear" | "delete" | null;
type ChatVars = any; // theme variables coming from chatThemes

/* -------------------------------------------------------------------------- */
/*  Config                                                                     */
/* -------------------------------------------------------------------------- */
const AUTH_USER_STORAGE_KEYS = ["user", "userData", "authUser", "currentUser", "auth", "profile", "loginUser", "userInfo"];
const AUTH_TOKEN_STORAGE_KEYS = ["token", "accessToken", "access_token", "authToken", "jwt"];
const CHAT_API_BASE = "" as string;
const PAGE_SIZE = 80;
const INVITE_PARAM = "gkjoin";

// Attachment limits (chats are stored in the browser, so files must stay small)
const MAX_PENDING_FILES = 10;
const MAX_DOC_BYTES = 1.5 * 1024 * 1024; // documents
const MAX_IMAGE_SRC_BYTES = 20 * 1024 * 1024; // photo picked from the device (it is compressed before saving)
const MAX_IMAGE_DIM = 1280; // longest side of a saved photo
const MAX_STORED_CHARS = 2_400_000; // safety limit for one stored file (data URL length)

const MUTE_OPTIONS = [
    { id: "8h", label: "8 hours", ms: 8 * 60 * 60 * 1000 },
    { id: "1w", label: "1 week", ms: 7 * 24 * 60 * 60 * 1000 },
    { id: "always", label: "Always", ms: -1 },
] as const;

const TTL_OPTIONS = [
    { ms: 0, label: "Off" },
    { ms: 24 * 60 * 60 * 1000, label: "24 hours" },
    { ms: 7 * 24 * 60 * 60 * 1000, label: "7 days" },
    { ms: 90 * 24 * 60 * 60 * 1000, label: "90 days" },
];

const ttlLabel = (ms: number) => TTL_OPTIONS.find((o) => o.ms === ms)?.label ?? "Off";

/* -------------------------------------------------------------------------- */
/*  Storage (cached – localStorage is read/parsed only once per key)           */
/* -------------------------------------------------------------------------- */
const storageKey = (convKey: string) => `gurukul_chat_${convKey}`;
const chatThemeStorageKey = (convKey: string) => `gurukul_chat_theme_${convKey}`;
const readStorageKey = (convKey: string) => `gurukul_chat_read_${convKey}`;
const metaKey = (suid: string, convKey: string) => `gurukul_chat_meta_${suid}__${convKey}`;
const sharedKey = (convKey: string) => `gurukul_chat_shared_${convKey}`;
const fileKey = (msgId: string) => `gurukul_chat_file_${msgId}`;
const CHAT_THEME_DEFAULT_KEY = "gurukul_chat_theme_default";

const jsonCache = new Map<string, any>();

const readJson = <T,>(key: string, fallback: T): T => {
    if (jsonCache.has(key)) return jsonCache.get(key) as T;
    let value: T = fallback;
    try {
        const raw = localStorage.getItem(key);
        if (raw !== null) value = JSON.parse(raw) as T;
    } catch {
        value = fallback;
    }
    jsonCache.set(key, value);
    return value;
};

const writeJson = (key: string, value: unknown, silent = false): boolean => {
    const had = jsonCache.has(key);
    const prev = jsonCache.get(key);
    jsonCache.set(key, value);
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        // storage is full / blocked -> restore the previous in-memory value so the UI stays consistent
        if (had) jsonCache.set(key, prev);
        else jsonCache.delete(key);
        if (!silent) toast.error("Changes could not be saved");
        return false;
    }
};

const removeKey = (key: string) => {
    jsonCache.delete(key);
    try {
        localStorage.removeItem(key);
    } catch {
        /* ignore */
    }
};

const loadChatThemeValue = (key: string): string | null => {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
};

const saveChatThemeValue = (key: string, value: string): boolean => {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch {
        toast.error("Chat theme could not be saved");
        return false;
    }
};

const removeChatThemeValue = (key: string): boolean => {
    try {
        localStorage.removeItem(key);
        return true;
    } catch {
        toast.error("Chat theme could not be reset");
        return false;
    }
};

const resolveStoredChatTheme = (convKey: string) => {
    const perChatTheme = loadChatThemeValue(chatThemeStorageKey(convKey));
    const defaultTheme = loadChatThemeValue(CHAT_THEME_DEFAULT_KEY);
    return {
        id: getChatTheme(perChatTheme ?? defaultTheme).id,
        applyToAll: !perChatTheme && !!defaultTheme,
    };
};

const EMPTY_MESSAGES: ChatMessage[] = [];

const loadMessages = (convKey: string): ChatMessage[] => {
    const v = readJson<ChatMessage[]>(storageKey(convKey), EMPTY_MESSAGES);
    return Array.isArray(v) ? v : EMPTY_MESSAGES;
};

const saveMessage = (msg: ChatMessage, silent = false): boolean => {
    const list = loadMessages(msg.conv_key);
    return writeJson(storageKey(msg.conv_key), [...list, msg], silent);
};

/** Attachment data (data URL) of a message – stored separately so the message list stays light. */
const loadFileData = (msgId: string): string | null => {
    const v = readJson<string | null>(fileKey(msgId), null);
    return typeof v === "string" ? v : null;
};

/* ---- unread tracking (last-read timestamp per conversation) ---- */
const getLastRead = (convKey: string): number => Number(readJson<number>(readStorageKey(convKey), 0)) || 0;
const markRead = (convKey: string) => {
    writeJson(readStorageKey(convKey), Date.now());
};

/* ---- per conversation settings ---- */
const DEFAULT_META: ConvMeta = { starred: [], mutedUntil: 0, muteChoice: "", clearedAt: 0, keep: false };
const DEFAULT_SHARED: SharedSettings = {
    ttl: 0,
    ttlSince: 0,
    advPrivacy: false,
    onlyAdminsSend: false,
    membersEditSettings: true,
    membersAdd: true,
    membersInvite: false,
    sendHistory: true,
    approveNew: false,
    admins: [],
    added: [],
    pending: [],
    historyFrom: {},
};

const getMeta = (suid: string, convKey: string): ConvMeta => ({
    ...DEFAULT_META,
    ...readJson<Partial<ConvMeta>>(metaKey(suid, convKey), {}),
});

const getShared = (convKey: string): SharedSettings => ({
    ...DEFAULT_SHARED,
    ...readJson<Partial<SharedSettings>>(sharedKey(convKey), {}),
});

const isMuted = (until: number, now: number) => until === -1 || until > now;

/** Messages the current user is allowed to see (after "clear chat", disappearing timers and member history). */
const getVisibleMessages = (convKey: string, suid: string, now: number, source?: ChatMessage[]): ChatMessage[] => {
    const list = source ?? loadMessages(convKey);
    if (!list.length) return EMPTY_MESSAGES;
    const meta = getMeta(suid, convKey);
    const shared = getShared(convKey);
    const historyFrom = shared.historyFrom?.[suid] ?? 0;
    return list.filter((m) => {
        const t = Date.parse(m.time);
        if (t <= meta.clearedAt) return false;
        if (t < historyFrom) return false;
        if (shared.ttl > 0 && t >= shared.ttlSince && now - t > shared.ttl) return false;
        return true;
    });
};

/** Physically remove messages (and their files) whose disappearing timer expired. */
const purgeExpired = (convKey: string, now: number) => {
    const shared = getShared(convKey);
    if (shared.ttl <= 0) return;
    const list = loadMessages(convKey);
    const expired = (m: ChatMessage) => {
        const t = Date.parse(m.time);
        return t >= shared.ttlSince && now - t > shared.ttl;
    };
    const next = list.filter((m) => !expired(m));
    if (next.length !== list.length) {
        if (writeJson(storageKey(convKey), next, true)) {
            list.filter(expired).forEach((m) => {
                if (m.file) removeKey(fileKey(m.id));
            });
        }
    }
};

const dmKey = (a: string, b: string) => `dm_${[a, b].sort().join("__")}`;

const authHeaders = (): Record<string, string> => {
    for (const k of AUTH_TOKEN_STORAGE_KEYS) {
        const t = localStorage.getItem(k);
        if (t) return { Authorization: `Bearer ${t.replace(/^Bearer\s+/i, "")}` };
    }
    return {};
};

const toMessage = (convKey: string, m: any): ChatMessage => ({
    id: String(m.id ?? m.message_id ?? `${m.created_at}-${m.sender_suid}`),
    conv_key: convKey,
    sender_suid: String(m.sender_suid ?? m.sender_id ?? m.suid),
    sender_name: String(m.sender_name ?? m.name ?? ""),
    text: String(m.text ?? m.message_text ?? m.message ?? ""),
    time: String(m.time ?? m.created_at ?? new Date().toISOString()),
});

const fetchRemoteMessages = async (convKey: string): Promise<ChatMessage[] | null> => {
    if (!CHAT_API_BASE) return null;
    try {
        const res = await fetch(`${CHAT_API_BASE}/chat/${encodeURIComponent(convKey)}/messages`, { headers: authHeaders() });
        if (!res.ok) return null;
        const json = await res.json();
        const arr = Array.isArray(json) ? json : json?.data;
        return Array.isArray(arr) ? arr.map((m: any) => toMessage(convKey, m)) : null;
    } catch {
        return null;
    }
};

const postRemoteMessage = async (convKey: string, text: string): Promise<boolean> => {
    if (!CHAT_API_BASE) return true;
    try {
        const res = await fetch(`${CHAT_API_BASE}/chat/${encodeURIComponent(convKey)}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify({ text }),
        });
        return res.ok;
    } catch {
        return false;
    }
};

/* -------------------------------------------------------------------------- */
/*  Attachments (photos & documents)                                           */
/* -------------------------------------------------------------------------- */
const isImageMime = (mime: string) => mime.startsWith("image/");

const formatBytes = (n: number) => {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

const fileExt = (name: string) => {
    const i = name.lastIndexOf(".");
    return i > 0 && i < name.length - 1 ? name.slice(i + 1).toUpperCase().slice(0, 5) : "FILE";
};

const readAsDataUrl = (f: Blob) =>
    new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(r.error);
        r.readAsDataURL(f);
    });

/** Photos are scaled down + compressed so they fit in browser storage. */
const compressImage = async (file: File): Promise<string> => {
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

const prepareAttachment = async (file: File): Promise<{ data: string; mime: string; name: string }> => {
    if (isImageMime(file.type)) {
        const data = await compressImage(file);
        const compressed = data.startsWith("data:image/jpeg") && file.type !== "image/jpeg";
        const name = compressed ? file.name.replace(/\.[^.]+$/, "") + ".jpg" : file.name;
        return { data, mime: data.slice(5, data.indexOf(";")) || file.type, name };
    }
    return { data: await readAsDataUrl(file), mime: file.type || "application/octet-stream", name: file.name };
};

/* -------------------------------------------------------------------------- */
/*  Links                                                                      */
/* -------------------------------------------------------------------------- */
const URL_RE = /(https?:\/\/[^\s<>"]+|www\.[^\s<>"]+)/gi;

const splitTrailing = (u: string): [string, string] => {
    let end = u.length;
    while (end > 0 && /[.,;:!?)\]'"]/.test(u[end - 1])) end--;
    return [u.slice(0, end), u.slice(end)];
};

const hrefOf = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);

const hostOf = (u: string) => {
    try {
        return new URL(hrefOf(u)).hostname.replace(/^www\./, "");
    } catch {
        return u;
    }
};

const extractLinks = (text: string): string[] => {
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
const renderText = (text: string) =>
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

const previewOf = (m: ChatMessage) => {
    if (!m.file) return m.text;
    const img = isImageMime(m.file.mime);
    return `${img ? "📷" : "📄"} ${m.text || (img ? "Photo" : m.file.name)}`;
};

const buildBuckets = (sources: { key: string; title: string; list: ChatMessage[] }[]): MediaBuckets => {
    const media: MediaItem[] = [];
    const docs: MediaItem[] = [];
    const links: LinkItem[] = [];
    sources.forEach((s) =>
        s.list.forEach((m) => {
            if (m.file) {
                (isImageMime(m.file.mime) ? media : docs).push({ msg: m, convKey: s.key, chat: s.title });
            }
            if (m.text) {
                extractLinks(m.text).forEach((url, i) => links.push({ msg: m, convKey: s.key, chat: s.title, url, key: `${s.key}-${m.id}-${i}` }));
            }
        })
    );
    const byTime = (a: { msg: ChatMessage }, b: { msg: ChatMessage }) => Date.parse(b.msg.time) - Date.parse(a.msg.time);
    media.sort(byTime);
    docs.sort(byTime);
    links.sort(byTime);
    return { media, docs, links };
};

const EMPTY_BUCKETS: MediaBuckets = { media: [], docs: [], links: [] };

const monthLabel = (iso: string, nowMs: number) => {
    const d = new Date(iso);
    const n = new Date(nowMs);
    if (d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth()) return "This month";
    return d.toLocaleDateString([], { month: "long", year: "numeric" });
};

const groupByMonth = <T extends { msg: ChatMessage }>(items: T[], nowMs: number): [string, T[]][] => {
    const out: [string, T[]][] = [];
    items.forEach((it) => {
        const label = monthLabel(it.msg.time, nowMs);
        const last = out[out.length - 1];
        if (last && last[0] === label) last[1].push(it);
        else out.push([label, [it]]);
    });
    return out;
};

/* -------------------------------------------------------------------------- */
/*  Current user & Directory Helpers                                           */
/* -------------------------------------------------------------------------- */
const isSuperRole = (v: any, name?: string) => {
    const r = String(v ?? "").toLowerCase();
    const n = String(name ?? "").toLowerCase().replace(/[^a-z]/g, "");
    return r.includes("super") || n === "superadmin";
};

const decodeJwt = (token: string): any | null => {
    try {
        const part = token.split(".")[1];
        if (!part) return null;
        const json = decodeURIComponent(
            atob(part.replace(/-/g, "+").replace(/_/g, "/"))
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        return JSON.parse(json);
    } catch {
        return null;
    }
};

const FALLBACK_USER: ChatUser = { suid: "unknown-user", name: "Me", role: undefined, isSuper: false };

/* ---- find the logged-in user anywhere in storage / cookies / JWT ---- */
const ID_KEYS = ["suid", "SUID", "user_id", "userId", "uid", "sub", "id"];
const STRICT_ID_KEYS = ["suid", "SUID", "user_id", "userId", "uid"];
const NAME_KEYS = ["name", "full_name", "fullName", "username", "userName", "user_name", "displayName", "display_name", "unique_name", "given_name"];
const ROLE_KEYS = ["role_code", "roleCode", "role", "role_name", "roleName", "user_type", "userType"];

const pick = (d: any, keys: string[]) => {
    for (const k of keys) {
        const v = d?.[k];
        if (v !== undefined && v !== null && v !== "") return v;
    }
    return undefined;
};

const nameOf = (d: any): string => {
    const n = pick(d, NAME_KEYS);
    if (n && typeof n !== "object") return String(n);
    const fl = [pick(d, ["first_name", "firstName"]), pick(d, ["last_name", "lastName"])].filter(Boolean).join(" ");
    if (fl) return fl;
    const e = pick(d, ["email", "Email"]);
    return e ? String(e).split("@")[0] : "";
};

const roleOf = (d: any): string | undefined => {
    const r = pick(d, ROLE_KEYS);
    if (r === undefined) return undefined;
    if (typeof r === "object") {
        const v = (r as any).role_code ?? (r as any).code ?? (r as any).name;
        return v ? String(v) : undefined;
    }
    return String(r);
};

const toChatUser = (d: any): ChatUser | null => {
    if (!d || typeof d !== "object" || Array.isArray(d)) return null;
    const suid = pick(d, ID_KEYS);
    const name = nameOf(d);
    if (suid === undefined || typeof suid === "object" || !name) return null;
    const role = roleOf(d);
    return {
        suid: String(suid),
        name,
        avatar: pick(d, ["avatar", "profile_image", "profile_pic"]),
        role,
        isSuper: isSuperRole(role, name),
    };
};

const scoreUser = (d: any): number => {
    const id = pick(d, ID_KEYS);
    if (id === undefined || typeof id === "object") return 0;
    if (!nameOf(d)) return 0;
    let sc = 1;
    if (pick(d, STRICT_ID_KEYS) !== undefined) sc += 3;
    if (pick(d, ROLE_KEYS) !== undefined) sc += 2;
    if (pick(d, ["email", "Email"])) sc += 2;
    if (pick(d, ["avatar", "profile_image", "profile_pic"])) sc += 1;
    return sc;
};

type Candidate = { u: ChatUser; score: number };

const collectUsers = (val: any, bonus: number, out: Candidate[], depth = 0) => {
    if (val === null || val === undefined || depth > 5) return;

    if (typeof val === "string") {
        const t = val.trim();
        if (t.startsWith("{") || t.startsWith("[")) {
            try {
                collectUsers(JSON.parse(t), bonus, out, depth + 1);
            } catch {
                /* not JSON */
            }
            return;
        }
        const tok = t.replace(/^Bearer\s+/i, "");
        if (tok.length > 40 && tok.split(".").length === 3) {
            const payload = decodeJwt(tok);
            if (payload) collectUsers(payload, bonus + 2, out, depth + 1);
        }
        return;
    }

    if (typeof val !== "object" || Array.isArray(val)) return; // skip lists (e.g. cached user lists)

    const sc = scoreUser(val);
    if (sc >= 3) {
        const u = toChatUser(val);
        if (u) out.push({ u, score: sc + bonus });
    }
    for (const v of Object.values(val)) collectUsers(v, bonus, out, depth + 1);
};

const readAllStorage = (): [string, string][] => {
    const out: [string, string][] = [];
    for (const store of [localStorage, sessionStorage]) {
        try {
            for (let i = 0; i < store.length; i++) {
                const k = store.key(i);
                if (!k || k.startsWith("gurukul_chat_")) continue;
                const v = store.getItem(k);
                if (v) out.push([k, v]);
            }
        } catch {
            /* ignore */
        }
    }
    try {
        document.cookie.split(";").forEach((c) => {
            const i = c.indexOf("=");
            if (i < 1) return;
            const k = c.slice(0, i).trim();
            let v = c.slice(i + 1);
            try {
                v = decodeURIComponent(v);
            } catch {
                /* keep raw */
            }
            if (v) out.push([k, v]);
        });
    } catch {
        /* ignore */
    }
    return out;
};

const resolveBaseUser = (): ChatUser | null => {
    const entries = readAllStorage();
    const out: Candidate[] = [];
    for (const [k, raw] of entries) {
        const known = AUTH_USER_STORAGE_KEYS.includes(k) || AUTH_TOKEN_STORAGE_KEYS.includes(k);
        collectUsers(raw, known ? 5 : 0, out);
    }
    out.sort((a, b) => b.score - a.score);
    if (out[0]) return out[0].u;

    console.warn(
        "[GroupList] Logged-in user not found. Keys checked:",
        entries.map(([k]) => k)
    );
    return null;
};

const normName = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const fetchAllUsers = async (): Promise<any[]> => {
    const svc: any = groupService;
    const candidates = ["getAllUsers", "getUsers", "getAvailableUsers", "getAllMembers", "getMembers", "fetchUsers", "getAllStudents"];
    for (const fn of candidates) {
        if (typeof svc?.[fn] !== "function") continue;
        try {
            const r = await svc[fn]();
            const arr = Array.isArray(r) ? r : r?.data?.users ?? r?.data?.data ?? r?.data ?? r?.users;
            if (Array.isArray(arr) && arr.length) return arr;
        } catch {
            /* try next */
        }
    }
    return [];
};

const normalizeUser = (u: any): DirUser | null => {
    if (!u) return null;
    const suid = u.suid ?? u.user_id ?? u.id;
    const name =
        u.name ?? u.full_name ?? u.username ?? u.user_name ?? [u.first_name, u.last_name].filter(Boolean).join(" ");
    if (suid === undefined || suid === null || !name) return null;
    const role = u.role_code ?? u.role ?? u.role_name ?? u.user_type;
    return {
        suid: String(suid),
        name: String(name),
        avatar: u.avatar ?? u.profile_image ?? u.profile_pic,
        role_code: role ? String(role) : undefined,
        isSuper: isSuperRole(role, String(name)),
    };
};

/* -------------------------------------------------------------------------- */
/*  Helpers & Colors                                                           */
/* -------------------------------------------------------------------------- */
const PALETTE_LIGHT = ["#dc2626", "#0f766e", "#7c3aed", "#d97706", "#0284c7", "#db2777", "#65a30d"];
const PALETTE_DARK = ["#f87171", "#2dd4bf", "#a78bfa", "#fbbf24", "#38bdf8", "#f472b6", "#a3e635"];

const hashStr = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
};

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatDay = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const yest = new Date();
    yest.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yest.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
};

const formatListTime = (ms: number) => {
    if (!ms) return "";
    const d = new Date(ms);
    const today = new Date();
    const yest = new Date();
    yest.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (d.toDateString() === yest.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { day: "2-digit", month: "short" });
};

const muteLabel = (until: number) => {
    if (until === -1) return "Muted";
    const d = new Date(until);
    const sameDay = d.toDateString() === new Date().toDateString();
    return `Muted until ${
        sameDay
            ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : d.toLocaleDateString([], { day: "2-digit", month: "short" })
    }`;
};

const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
};

const buildExportText = (list: ChatMessage[]) =>
    list
        .map((m) => {
            const d = new Date(m.time);
            const date = d.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "numeric" });
            const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const body = m.file ? `<attached: ${m.file.name}>${m.text ? ` ${m.text}` : ""}` : m.text;
            return `${date}, ${time} - ${m.sender_name || "Unknown"}: ${body}`;
        })
        .join("\n");

const safeFileName = (s: string) => s.replace(/[\\/:*?"<>|]+/g, "").trim() || "chat";

const downloadText = (filename: string, text: string) => {
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

const HIDE_SCROLL = "[-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden";

/* -------------------------------------------------------------------------- */
/*  Avatar Components (no backdrop-blur => no scroll lag)                      */
/* -------------------------------------------------------------------------- */
function LogoTile({ dark, size = 40, dot = false }: { dark: boolean; size?: number; dot?: boolean }) {
    return (
        <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
            <span
                className={`w-full h-full rounded-2xl flex items-center justify-center border transition-transform duration-300 hover:scale-105
                ${dark
                        ? "bg-linear-to-br from-slate-900 to-slate-950 border-slate-700 shadow-[0_8px_25px_rgba(0,0,0,0.6)]"
                        : "bg-linear-to-br from-white to-red-50/50 border-red-200/80 shadow-[0_8px_25px_rgba(220,38,38,0.15)]"
                    }`}
            >
                <img src={gurukulLogo} alt="Gurukul" className="object-contain drop-shadow-sm" style={{ width: size * 0.64, height: size * 0.64 }} />
            </span>
            {dot && (
                <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 ${dark ? "border-[#0B1120]" : "border-white"} shadow-sm`} />
            )}
        </span>
    );
}

function GroupAvatar({ dark, name, size = 40 }: { dark: boolean; name: string; size?: number }) {
    return (
        <span
            style={{ width: size, height: size, fontSize: size * 0.34 }}
            className={`shrink-0 rounded-full flex items-center justify-center font-bold tracking-wide text-white shadow-lg
            ${dark ? "bg-linear-to-br from-blue-600 via-indigo-600 to-sky-700 shadow-blue-950/50 border border-blue-400/30" : "bg-linear-to-br from-red-600 via-rose-600 to-orange-600 shadow-red-950/30 border border-red-400/30"}`}
        >
            {getInitials(name)}
        </span>
    );
}

function PersonAvatar({
    dark,
    name,
    avatar,
    size = 32,
    superBadge = false,
    online = false,
}: {
    dark: boolean;
    name: string;
    avatar?: string;
    size?: number;
    superBadge?: boolean;
    online?: boolean;
}) {
    return (
        <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
            <span
                style={{ fontSize: Math.max(9, size * 0.32) }}
                className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden font-bold shadow-md
                ${superBadge
                        ? dark
                            ? "bg-linear-to-br from-blue-600 to-indigo-700 text-white ring-2 ring-blue-400/60 shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                            : "bg-linear-to-br from-red-600 to-rose-700 text-white ring-2 ring-red-400/60 shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                        : dark
                            ? "bg-slate-800 text-blue-300 border border-slate-700"
                            : "bg-red-50 text-red-700 border border-red-200"
                    }`}
            >
                {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : getInitials(name)}
            </span>
            {online && (
                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 ${dark ? "border-[#0B1120]" : "border-white"}`} />
            )}
        </span>
    );
}

/* -------------------------------------------------------------------------- */
/*  Small UI building blocks (info panel / dialogs)                            */
/* -------------------------------------------------------------------------- */
function Switch({ on, dark, accent }: { on: boolean; dark: boolean; accent: string }) {
    return (
        <span
            aria-hidden="true"
            className={`relative inline-block h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "" : dark ? "bg-slate-700" : "bg-slate-300"}`}
            style={on ? { backgroundColor: accent } : undefined}
        >
            <span
                className="absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                style={{ transform: `translateX(${on ? 22 : 2}px)` }}
            />
        </span>
    );
}

function SettingRow({
    dark,
    icon,
    title,
    subtitle,
    trailing,
    onClick,
    tone = "default",
    switchOn,
    disabled = false,
}: {
    dark: boolean;
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    trailing?: React.ReactNode;
    onClick?: () => void;
    tone?: "default" | "danger";
    switchOn?: boolean;
    disabled?: boolean;
}) {
    const titleColor = tone === "danger" ? (dark ? "text-rose-400" : "text-red-600") : dark ? "text-slate-100" : "text-slate-800";
    const iconColor = tone === "danger" ? (dark ? "text-rose-400" : "text-red-500") : dark ? "text-slate-400" : "text-slate-500";
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            role={switchOn !== undefined ? "switch" : undefined}
            aria-checked={switchOn}
            className={`flex w-full items-center gap-5 rounded-xl px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                dark ? "enabled:hover:bg-slate-800/70" : "enabled:hover:bg-slate-50"
            }`}
        >
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center text-[22px] ${iconColor}`}>{icon}</span>
            <span className="min-w-0 flex-1">
                <span className={`block text-sm font-medium ${titleColor}`}>{title}</span>
                {subtitle && (
                    <span className={`mt-0.5 block text-xs leading-snug ${dark ? "text-slate-400" : "text-slate-500"}`}>{subtitle}</span>
                )}
            </span>
            {trailing}
        </button>
    );
}

function DialogShell({
    dark,
    title,
    onClose,
    children,
}: {
    dark: boolean;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
            <div onClick={onClose} className="absolute inset-0 bg-black/55" />
            <div
                className={`relative w-full max-w-sm overflow-hidden rounded-2xl border shadow-2xl ${
                    dark ? "border-slate-700 bg-[#0E1626] text-slate-100" : "border-slate-200 bg-white text-slate-900"
                }`}
                style={{ animation: "gkDialogIn .18s ease-out" }}
            >
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <h3 className="text-base font-bold tracking-tight">{title}</h3>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${dark ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
                    >
                        <IoClose className="text-xl" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function RadioRow({
    dark,
    accent,
    label,
    selected,
    onClick,
}: {
    dark: boolean;
    accent: string;
    label: string;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={onClick}
            className={`flex w-full items-center gap-4 px-5 py-3 text-left text-sm font-medium transition-colors ${dark ? "hover:bg-slate-800/70" : "hover:bg-slate-50"}`}
        >
            <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                style={{ borderColor: selected ? accent : dark ? "#475569" : "#cbd5e1" }}
            >
                {selected && <span className="h-2.5 w-2.5 rounded-full" style={{ background: accent }} />}
            </span>
            {label}
        </button>
    );
}

function CheckBox({ checked, dark, accent }: { checked: boolean; dark: boolean; accent: string }) {
    return (
        <span
            aria-hidden="true"
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-white ${checked ? "" : dark ? "border-slate-600" : "border-slate-300"}`}
            style={checked ? { background: accent, borderColor: accent } : undefined}
        >
            {checked && <IoCheckmark className="text-sm" />}
        </span>
    );
}

/* -------------------------------------------------------------------------- */
/*  Message row (memoised: a new message does not re-render old ones)          */
/* -------------------------------------------------------------------------- */
type MessageRowProps = {
    m: ChatMessage;
    day: string | null;
    mine: boolean;
    sameSender: boolean;
    showName: boolean;
    nameColor: string;
    avatar?: string;
    dark: boolean;
    cv: ChatVars;
    starred: boolean;
    highlight: boolean;
    privacy: boolean;
    onStar: (id: string) => void;
    onOpenMedia: (id: string) => void;
    onDownload: (m: ChatMessage) => void;
};

const MessageRow = memo(function MessageRow({
    m,
    day,
    mine,
    sameSender,
    showName,
    nameColor,
    avatar,
    dark,
    cv,
    starred,
    highlight,
    privacy,
    onStar,
    onOpenMedia,
    onDownload,
}: MessageRowProps) {
    const fileData = useMemo(() => (m.file ? loadFileData(m.id) : null), [m.id, m.file]);
    const isImg = !!m.file && isImageMime(m.file.mime);

    const starBtn = (
        <button
            type="button"
            onClick={() => onStar(m.id)}
            aria-label={starred ? "Remove star" : "Star message"}
            title={starred ? "Remove star" : "Star message"}
            className={`flex h-7 w-7 shrink-0 items-center justify-center self-center rounded-full text-sm opacity-0 transition-opacity focus-visible:opacity-100 group-hover/row:opacity-100 ${
                dark ? "text-slate-300 hover:bg-slate-700/70" : "text-slate-600 hover:bg-slate-200/70"
            }`}
        >
            {starred ? <IoStar className="text-amber-400" /> : <IoStarOutline />}
        </button>
    );

    const bubbleStyle = mine
        ? {
              background: cv.mine.background,
              color: cv.mine.color,
              boxShadow: highlight ? `0 0 0 3px ${cv.accent}99` : cv.mine.shadow,
          }
        : {
              background: cv.theirs.background,
              color: cv.theirs.color,
              border: cv.theirs.border,
              boxShadow: highlight ? `0 0 0 3px ${cv.accent}99` : cv.theirs.shadow,
          };

    return (
        <div data-mid={m.id}>
            {day && (
                <div className="my-4 flex justify-center">
                    <span
                        className="rounded-full border px-3.5 py-1 text-[10px] font-semibold uppercase tracking-wider shadow-sm"
                        style={{ background: cv.chip.background, color: cv.chip.color, borderColor: cv.chip.border }}
                    >
                        {day}
                    </span>
                </div>
            )}
            <div className={`group/row flex items-end gap-2 ${mine ? "justify-end" : "justify-start"} ${sameSender ? "mt-1" : "mt-3"}`}>
                {!mine && (
                    <div className="w-8 shrink-0">
                        {!sameSender && <PersonAvatar dark={dark} name={m.sender_name} avatar={avatar} size={32} />}
                    </div>
                )}
                {mine && starBtn}
                <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-md md:max-w-[68%] ${
                        mine ? "rounded-br-sm" : "rounded-bl-sm"
                    } ${privacy ? "select-none" : ""}`}
                    style={bubbleStyle}
                >
                    {showName && (
                        <p className="mb-1 text-[11px] font-bold tracking-wide" style={{ color: nameColor }}>
                            {m.sender_name}
                        </p>
                    )}

                    {/* Photo */}
                    {m.file && isImg && (
                        <button
                            type="button"
                            onClick={() => fileData && onOpenMedia(m.id)}
                            disabled={!fileData}
                            aria-label={`Open photo ${m.file.name}`}
                            className="mb-1 block w-full overflow-hidden rounded-xl"
                        >
                            {fileData ? (
                                <img
                                    src={fileData}
                                    alt={m.file.name}
                                    draggable={false}
                                    onContextMenu={privacy ? (e) => e.preventDefault() : undefined}
                                    className="max-h-72 w-full min-w-44 rounded-xl object-cover"
                                />
                            ) : (
                                <span className="flex h-28 min-w-44 items-center justify-center rounded-xl bg-black/10 text-xs font-medium opacity-80">
                                    Photo unavailable
                                </span>
                            )}
                        </button>
                    )}

                    {/* Document */}
                    {m.file && !isImg && (
                        <div className="mb-1 flex min-w-52 items-center gap-3 rounded-xl p-2.5" style={{ background: "rgba(127,127,127,.18)" }}>
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/15 text-xl">
                                <IoDocumentTextOutline />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold">{m.file.name}</span>
                                <span className="block text-[11px] opacity-75">
                                    {fileExt(m.file.name)} · {formatBytes(m.file.size)}
                                </span>
                            </span>
                            <button
                                type="button"
                                onClick={() => onDownload(m)}
                                aria-label={privacy ? "Download blocked" : `Download ${m.file.name}`}
                                title={privacy ? "Blocked by Advanced chat privacy" : "Download"}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/15 text-lg hover:bg-black/25"
                            >
                                {privacy ? <IoLockClosedOutline /> : <IoDownloadOutline />}
                            </button>
                        </div>
                    )}

                    {m.text && <p className="whitespace-pre-wrap wrap-break-word">{renderText(m.text)}</p>}
                    <p
                        className="mt-1 flex items-center justify-end gap-1 text-[10px] font-medium"
                        style={{ color: mine ? cv.mine.timeColor : cv.theirs.timeColor }}
                    >
                        {starred && <IoStar className="text-[10px] text-amber-400" />}
                        {formatTime(m.time)}
                    </p>
                </div>
                {!mine && starBtn}
            </div>
        </div>
    );
});

/* -------------------------------------------------------------------------- */
/*  Composer (own state => typing never re-renders the whole page)             */
/* -------------------------------------------------------------------------- */
const Composer = memo(function Composer({
    dark,
    cv,
    meName,
    onSend,
}: {
    dark: boolean;
    cv: ChatVars;
    meName: string;
    onSend: (text: string, files: File[]) => Promise<boolean>;
}) {
    const [draft, setDraft] = useState("");
    const [pending, setPending] = useState<File[]>([]);
    const [busy, setBusy] = useState(false);
    const busyRef = useRef(false);
    const ref = useRef<HTMLTextAreaElement>(null);
    const imgInputRef = useRef<HTMLInputElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);

    const previews = useMemo(() => pending.map((f) => (isImageMime(f.type) ? URL.createObjectURL(f) : null)), [pending]);
    useEffect(() => () => previews.forEach((u) => u && URL.revokeObjectURL(u)), [previews]);

    useEffect(() => {
        if (window.matchMedia?.("(pointer: fine)").matches) ref.current?.focus({ preventScroll: true });
    }, []);

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
    }, [draft]);

    const addFiles = (files: File[]) => {
        if (!files.length) return;
        const room = MAX_PENDING_FILES - pending.length;
        if (room <= 0) {
            toast.error(`You can attach up to ${MAX_PENDING_FILES} files at once`);
            return;
        }
        const ok: File[] = [];
        for (const f of files) {
            if (ok.length >= room) {
                toast.error(`You can attach up to ${MAX_PENDING_FILES} files at once`);
                break;
            }
            if (isImageMime(f.type)) {
                if (f.size > MAX_IMAGE_SRC_BYTES) {
                    toast.error(`"${f.name}" is too large (max ${formatBytes(MAX_IMAGE_SRC_BYTES)})`);
                    continue;
                }
            } else if (f.size > MAX_DOC_BYTES) {
                toast.error(`"${f.name}" is too large (max ${formatBytes(MAX_DOC_BYTES)} per document)`);
                continue;
            }
            ok.push(f);
        }
        if (ok.length) setPending((p) => [...p, ...ok]);
    };

    const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
        addFiles(Array.from(e.target.files ?? []));
        e.target.value = ""; // allow picking the same file again
    };

    const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const files = Array.from(e.clipboardData?.files ?? []);
        if (files.length) {
            e.preventDefault();
            addFiles(files);
        }
    };

    const canSubmit = (!!draft.trim() || pending.length > 0) && !busy;

    const submit = async () => {
        const text = draft.trim();
        if ((!text && !pending.length) || busyRef.current) return;
        busyRef.current = true;
        setBusy(true);
        let ok = false;
        try {
            ok = await onSend(text, pending);
        } finally {
            busyRef.current = false;
            setBusy(false);
        }
        if (ok) {
            setDraft("");
            setPending([]);
        }
        ref.current?.focus({ preventScroll: true });
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            void submit();
        }
    };

    const iconBtn = `flex h-12 w-11 shrink-0 items-center justify-center rounded-2xl text-xl transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        dark ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"
    }`;

    return (
        <>
            <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] uppercase tracking-wider font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>Sending as</span>
                <span
                    className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{ background: cv.chip.background, color: cv.chip.color, borderColor: cv.chip.border }}
                >
                    {meName}
                </span>
            </div>

            {pending.length > 0 && (
                <div className={`mb-2 flex gap-2 overflow-x-auto pb-1 ${HIDE_SCROLL}`}>
                    {pending.map((f, i) => (
                        <div
                            key={`${f.name}-${f.size}-${i}`}
                            className={`relative flex h-16 shrink-0 items-center overflow-hidden rounded-xl border ${
                                dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-slate-50"
                            }`}
                        >
                            {previews[i] ? (
                                <img src={previews[i]!} alt={f.name} className="h-16 w-16 object-cover" />
                            ) : (
                                <span className="flex items-center gap-2 px-3">
                                    <IoDocumentTextOutline className={`text-2xl ${dark ? "text-slate-300" : "text-slate-600"}`} />
                                    <span className="max-w-32">
                                        <span className={`block truncate text-xs font-semibold ${dark ? "text-slate-100" : "text-slate-800"}`}>{f.name}</span>
                                        <span className={`block text-[10px] ${dark ? "text-slate-400" : "text-slate-500"}`}>{formatBytes(f.size)}</span>
                                    </span>
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={() => setPending((p) => p.filter((_, idx) => idx !== i))}
                                aria-label={`Remove ${f.name}`}
                                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/65 text-xs text-white hover:bg-black/80"
                            >
                                <IoClose />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-end gap-2">
                <input ref={imgInputRef} type="file" accept="image/*" multiple hidden onChange={onPick} />
                <input ref={docInputRef} type="file" multiple hidden onChange={onPick} />
                <button type="button" className={iconBtn} onClick={() => imgInputRef.current?.click()} disabled={busy} aria-label="Attach photo" title="Photo">
                    <IoImageOutline />
                </button>
                <button type="button" className={iconBtn} onClick={() => docInputRef.current?.click()} disabled={busy} aria-label="Attach document" title="Document">
                    <IoAttachOutline />
                </button>
                <textarea
                    ref={ref}
                    rows={1}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={onKeyDown}
                    onPaste={onPaste}
                    placeholder={pending.length ? "Add a caption..." : "Type a message..."}
                    className={`chat-themed-input flex-1 resize-none max-h-32 px-4 py-3 rounded-2xl text-sm outline-none border transition-colors shadow-inner ${HIDE_SCROLL}
                    ${dark
                            ? "bg-slate-900/90 border-slate-700 text-slate-100 placeholder:text-slate-500"
                            : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                        }`}
                />
                <button
                    onClick={() => void submit()}
                    disabled={!canSubmit}
                    className="group flex h-12 items-center gap-2 rounded-2xl px-5 text-sm font-semibold text-white shadow-lg transition-all duration-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ background: cv.accentGradient, boxShadow: cv.mine.shadow }}
                >
                    <IoSend className="text-base transition-transform duration-300 group-hover:translate-x-0.5" />
                    <span className="hidden sm:inline">{busy ? "Sending..." : "Send"}</span>
                </button>
            </div>
        </>
    );
});

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */
export default function GurukulCommunity() {
    const { theme } = useTheme();

    const [groups, setGroups] = useState<GroupData[]>([]);
    const [apiUsers, setApiUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Active conversation
    const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
    const [activePeerId, setActivePeerId] = useState<string | null>(null);
    const [remoteState, setRemoteState] = useState<{ key: string; list: ChatMessage[] } | null>(null);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [highlightId, setHighlightId] = useState<string | null>(null);

    // Overlays inside the chat
    const [infoOpen, setInfoOpen] = useState(false);
    const [infoView, setInfoView] = useState<InfoView>("main");
    const [dialog, setDialog] = useState<DialogKind>(null);
    const [themePickerOpen, setThemePickerOpen] = useState(false);
    const [chatThemeId, setChatThemeId] = useState(DEFAULT_CHAT_THEME_ID);
    const [applyThemeToAll, setApplyThemeToAll] = useState(false);
    const [themeConversationKey, setThemeConversationKey] = useState<string | null>(null);

    // Media, links and docs
    const [mediaTab, setMediaTab] = useState<MediaTab>("media");
    const [mediaScope, setMediaScope] = useState<"chat" | "all">("chat");
    const [lightbox, setLightbox] = useState<{ items: MediaItem[]; index: number } | null>(null);
    const lightboxOpen = !!lightbox;

    // "Add members" screen
    const [addSel, setAddSel] = useState<string[]>([]);
    const [addQuery, setAddQuery] = useState("");

    // Left list state
    const [filter, setFilter] = useState<FilterTab>("all");
    const [search, setSearch] = useState("");

    // "version" changes whenever stored chat data changes; "now" is refreshed every 30s
    const [version, setVersion] = useState(0);
    const [now, setNow] = useState(() => Date.now());
    const [sessionStart] = useState(() => Date.now());

    // New message modal
    const [newOpen, setNewOpen] = useState(false);
    const [newSearch, setNewSearch] = useState("");

    const messagesRef = useRef<HTMLDivElement>(null);
    const messagesLive = useRef<ChatMessage[]>(EMPTY_MESSAGES);
    const nearBottomRef = useRef(true);
    const lastScrollConv = useRef<string | null>(null);
    const prependRef = useRef<number | null>(null);
    const toastedRef = useRef<Map<string, number>>(new Map());
    const joinHandled = useRef(false);

    const baseMe = useMemo(() => resolveBaseUser() ?? FALLBACK_USER, []);

    const bump = useCallback(() => setVersion((v) => v + 1), []);

    /* ------------------------------ API & Data ------------------------------ */
    const fetchGroups = async () => {
        setLoading(true);
        try {
            let list: GroupData[] | null = null;

            // Normal members only see the groups they belong to
            if (!baseMe.isSuper && baseMe.suid !== FALLBACK_USER.suid) {
                const mine = await groupService.getGroupsByMember(Number(baseMe.suid));
                if (mine.success && Array.isArray(mine.data)) list = mine.data;
            }
            // Super admin (or fallback) sees every group
            if (!list) {
                const all = await groupService.getAllGroups();
                if (all.success && Array.isArray(all.data)) list = all.data;
                else toast.error(all.message || "Error occurred while fetching groups");
            }
            if (list) setGroups([...list].sort((a, b) => a.group_id - b.group_id));
        } catch (error: any) {
            toast.error(error.message || "Error occurred while fetching groups");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
        fetchAllUsers().then(setApiUsers);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ------------------------------ Directory & Users ------------------------------ */
    const rawDirectory = useMemo<DirUser[]>(() => {
        const map = new Map<string, DirUser>();
        const add = (raw: any) => {
            const u = normalizeUser(raw);
            if (u && !map.has(u.suid)) map.set(u.suid, u);
        };
        apiUsers.forEach(add);
        groups.forEach((g) => (g.members || []).forEach(add));
        return Array.from(map.values());
    }, [apiUsers, groups]);

    const me = useMemo<ChatUser>(() => {
        const match =
            rawDirectory.find((u) => u.suid === baseMe.suid) ||
            rawDirectory.find((u) => normName(u.name) === normName(baseMe.name));
        if (!match) return baseMe;
        return {
            ...baseMe,
            suid: match.suid,
            name: match.name || baseMe.name,
            avatar: baseMe.avatar ?? match.avatar,
            role: baseMe.role ?? match.role_code,
            isSuper: baseMe.isSuper || match.isSuper,
        };
    }, [rawDirectory, baseMe]);

    const directory = useMemo<DirUser[]>(() => {
        if (rawDirectory.some((u) => u.suid === me.suid)) return rawDirectory;
        return [...rawDirectory, { suid: me.suid, name: me.name, avatar: me.avatar, role_code: me.role, isSuper: me.isSuper }];
    }, [rawDirectory, me]);

    const avatarBySuid = useMemo(() => new Map(directory.map((u) => [u.suid, u.avatar] as const)), [directory]);

    const otherUsers = useMemo(
        () => directory.filter((u) => u.suid !== me.suid).sort((a, b) => a.name.localeCompare(b.name)),
        [directory, me.suid]
    );

    /** Members of a group = members from the server + people added from this app. */
    const membersOf = useCallback(
        (g: GroupData): any[] => {
            void version;
            const base = ((g.members || []) as any[]).slice();
            const added = getShared(`group_${g.group_id}`).added;
            if (!added.length) return base;
            const have = new Set(base.map((m) => String(m.suid)));
            added.forEach((id) => {
                if (have.has(id)) return;
                const u = directory.find((d) => d.suid === id);
                if (u) {
                    base.push({ suid: u.suid, name: u.name, avatar: u.avatar, role_code: u.role_code });
                    have.add(id);
                }
            });
            return base;
        },
        [directory, version]
    );

    const groupsOfUser = useCallback(
        (suid: string) => groups.filter((g) => membersOf(g).some((m) => String(m.suid) === suid)),
        [groups, membersOf]
    );

    /* ------------------------------ Active Chat State ------------------------------ */
    const activeGroup = useMemo(() => groups.find((g) => g.group_id === activeGroupId) || null, [groups, activeGroupId]);
    const activePeer = useMemo(() => directory.find((u) => u.suid === activePeerId) || null, [directory, activePeerId]);

    const convKey = activeGroup ? `group_${activeGroup.group_id}` : activePeer ? dmKey(me.suid, activePeer.suid) : null;
    const chatTitle = activeGroup ? activeGroup.group_name : activePeer?.name || "";

    const activeMembers = useMemo(() => (activeGroup ? membersOf(activeGroup) : []), [activeGroup, membersOf]);
    const isMember = !!activeGroup && activeMembers.some((m) => String(m.suid) === me.suid);

    const shared = useMemo<SharedSettings>(() => {
        void version;
        return convKey ? getShared(convKey) : DEFAULT_SHARED;
    }, [convKey, version]);

    const meta = useMemo<ConvMeta>(() => {
        void version;
        return convKey ? getMeta(me.suid, convKey) : DEFAULT_META;
    }, [convKey, me.suid, version]);

    // Admin = Super Admin or a member promoted in "Edit group admins"
    const meAdmin = me.isSuper || shared.admins.includes(me.suid);
    const adminBlocked = !!activeGroup && shared.onlyAdminsSend && !meAdmin;
    const canSend = activeGroup ? (isMember || me.isSuper) && !adminBlocked : !!activePeer;

    const canEditSettings = !activeGroup || meAdmin || shared.membersEditSettings;
    const canAdd = !!activeGroup && (meAdmin || (shared.membersAdd && isMember));
    const canInvite = !!activeGroup && (meAdmin || (shared.membersInvite && isMember));

    const remote = remoteState && remoteState.key === convKey ? remoteState.list : null;

    const messages = useMemo<ChatMessage[]>(() => {
        void version;
        if (!convKey) return EMPTY_MESSAGES;
        return getVisibleMessages(convKey, me.suid, now, remote ?? undefined);
    }, [convKey, me.suid, version, now, remote]);

    useLayoutEffect(() => {
        messagesLive.current = messages;
    }, [messages]);

    const starredSet = useMemo(() => new Set(meta.starred), [meta.starred]);
    const starredMessages = useMemo(() => messages.filter((m) => starredSet.has(m.id)), [messages, starredSet]);

    const shown = useMemo(
        () => (messages.length > visibleCount ? messages.slice(-visibleCount) : messages),
        [messages, visibleCount]
    );
    const hasEarlier = messages.length > shown.length;

    const rows = useMemo(() => {
        const palette = theme ? PALETTE_DARK : PALETTE_LIGHT;
        const isGroup = !!activeGroup;
        const days = shown.map((m) => formatDay(m.time));
        return shown.map((m, i) => {
            const showDay = i === 0 || days[i - 1] !== days[i];
            const mine = m.sender_suid === me.suid;
            const sameSender = i > 0 && shown[i - 1].sender_suid === m.sender_suid && !showDay;
            return {
                m,
                day: showDay ? days[i] : null,
                mine,
                sameSender,
                showName: isGroup && !mine && !sameSender,
                nameColor: palette[hashStr(m.sender_suid) % palette.length],
                avatar: avatarBySuid.get(m.sender_suid),
            };
        });
    }, [shown, activeGroup, me.suid, theme, avatarBySuid]);

    /* ------------------------------ Effects ------------------------------ */

    // Other browser tabs changed chat data -> drop cache & refresh (replaces the old 1.5s / 2s polling)
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === null) jsonCache.clear();
            else if (e.key.startsWith("gurukul_chat_")) jsonCache.delete(e.key);
            else return;
            setVersion((v) => v + 1);
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    // Every conversation key (used for disappearing-message cleanup)
    const allKeys = useMemo(
        () => [...groups.map((g) => `group_${g.group_id}`), ...otherUsers.map((u) => dmKey(me.suid, u.suid))],
        [groups, otherUsers, me.suid]
    );

    // Light maintenance every 30s: purge expired messages, refresh timers (mute / disappearing)
    useEffect(() => {
        const run = () => {
            const t = Date.now();
            allKeys.forEach((k) => purgeExpired(k, t));
            setNow(t);
        };
        const id = window.setInterval(run, 30000);
        return () => window.clearInterval(id);
    }, [allKeys]);

    // Remote API polling (only when CHAT_API_BASE is configured)
    useEffect(() => {
        if (!CHAT_API_BASE || !convKey) return;
        let alive = true;
        const load = async () => {
            const list = await fetchRemoteMessages(convKey);
            if (alive && list) setRemoteState({ key: convKey, list });
        };
        load();
        const id = window.setInterval(load, 2500);
        return () => {
            alive = false;
            window.clearInterval(id);
        };
    }, [convKey]);

    // Chat theme + overlays reset for the opened conversation
    useEffect(() => {
        const timer = window.setTimeout(() => {
            setThemePickerOpen(false);
            setInfoOpen(false);
            setInfoView("main");
            setDialog(null);
            setLightbox(null);
            setMediaTab("media");
            setMediaScope("chat");
            if (!convKey) {
                setThemeConversationKey(null);
                setChatThemeId(DEFAULT_CHAT_THEME_ID);
                setApplyThemeToAll(false);
                return;
            }

            const preference = resolveStoredChatTheme(convKey);
            setThemeConversationKey(convKey);
            setChatThemeId(preference.id);
            setApplyThemeToAll(preference.applyToAll);
        }, 0);
        return () => window.clearTimeout(timer);
    }, [convKey]);

    // Mark the open conversation as read whenever it changes / receives messages
    useEffect(() => {
        if (!convKey) return;
        markRead(convKey);
        setVersion((v) => v + 1);
    }, [convKey, messages.length]);

    // Scroll only when needed: on open, when I send, or when the user is already near the bottom
    useEffect(() => {
        const el = messagesRef.current;
        if (!el) return;
        const first = lastScrollConv.current !== convKey;
        lastScrollConv.current = convKey;
        const last = messages[messages.length - 1];
        const lastMine = !!last && last.sender_suid === me.suid;
        if (first || lastMine || nearBottomRef.current) {
            el.scrollTo({ top: el.scrollHeight, behavior: first ? "auto" : "smooth" });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages.length, convKey]);

    // Keep the scroll position when older messages are prepended
    useLayoutEffect(() => {
        const el = messagesRef.current;
        if (el && prependRef.current !== null) {
            el.scrollTop = el.scrollHeight - prependRef.current;
            prependRef.current = null;
        }
    }, [visibleCount]);

    const onMessagesScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
    }, []);

    const loadEarlier = () => {
        const el = messagesRef.current;
        if (el) prependRef.current = el.scrollHeight - el.scrollTop;
        setVisibleCount((c) => c + PAGE_SIZE);
    };

    // Photo viewer: left / right arrow keys
    useEffect(() => {
        if (!lightboxOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") setLightbox((l) => (l && l.index > 0 ? { ...l, index: l.index - 1 } : l));
            else if (e.key === "ArrowRight") setLightbox((l) => (l && l.index < l.items.length - 1 ? { ...l, index: l.index + 1 } : l));
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [lightboxOpen]);

    /* ------------------------------ Conversation List ------------------------------ */
    const conversations = useMemo<ConvItem[]>(() => {
        void version;
        const build = (
            key: string,
            kind: "group" | "dm",
            id: string,
            title: string,
            avatar: string | undefined,
            isSuper: boolean
        ): ConvItem | null => {
            const cMeta = getMeta(me.suid, key);
            const list = getVisibleMessages(key, me.suid, now);
            if (kind === "dm" && !list.length && !cMeta.keep) return null; // DMs appear after the first message
            const last = list.length ? list[list.length - 1] : null;
            const lastRead = getLastRead(key);
            const unread = list.filter((m) => m.sender_suid !== me.suid && Date.parse(m.time) > lastRead).length;
            let preview = "No messages yet";
            if (last) {
                const mine = last.sender_suid === me.suid;
                const body = previewOf(last);
                if (kind === "group") preview = `${mine ? "You" : last.sender_name}: ${body}`;
                else preview = mine ? `You: ${body}` : body;
            }
            return {
                key,
                kind,
                id,
                title,
                avatar,
                isSuper,
                preview,
                lastTime: last ? Date.parse(last.time) : 0,
                lastMine: !!last && last.sender_suid === me.suid,
                unread,
                muted: isMuted(cMeta.mutedUntil, now),
            };
        };

        const items: ConvItem[] = [];
        groups.forEach((g) => {
            const item = build(`group_${g.group_id}`, "group", String(g.group_id), g.group_name, undefined, false);
            if (item) items.push(item);
        });
        otherUsers.forEach((u) => {
            const item = build(dmKey(me.suid, u.suid), "dm", u.suid, u.name, u.avatar, u.isSuper);
            if (item) items.push(item);
        });

        return items.sort((a, b) => b.lastTime - a.lastTime || a.title.localeCompare(b.title));
    }, [groups, otherUsers, me.suid, version, now]);

    // Toast for new messages that arrive in other (not muted) conversations
    useEffect(() => {
        conversations.forEach((c) => {
            if (c.lastTime <= sessionStart) return;
            if ((toastedRef.current.get(c.key) ?? 0) >= c.lastTime) return;
            toastedRef.current.set(c.key, c.lastTime);
            if (c.key !== convKey && !c.lastMine && !c.muted) toast(c.title, { description: c.preview });
        });
    }, [conversations, convKey, sessionStart]);

    const unreadChats = useMemo(() => conversations.filter((c) => c.unread > 0).length, [conversations]);

    /* ------------------------------ Media, links and docs ------------------------------ */
    const chatBuckets = useMemo<MediaBuckets>(
        () => (convKey ? buildBuckets([{ key: convKey, title: chatTitle, list: messages }]) : EMPTY_BUCKETS),
        [convKey, chatTitle, messages]
    );

    const buckets = useMemo<MediaBuckets>(() => {
        if (mediaScope !== "all" || !infoOpen || infoView !== "media") return chatBuckets;
        return buildBuckets(
            conversations.map((c) => ({ key: c.key, title: c.title, list: getVisibleMessages(c.key, me.suid, now) }))
        );
    }, [mediaScope, infoOpen, infoView, chatBuckets, conversations, me.suid, now]);

    const mediaTotal = chatBuckets.media.length + chatBuckets.docs.length + chatBuckets.links.length;

    const q = search.trim().toLowerCase();

    const visibleConversations = useMemo(() => {
        return conversations.filter((c) => {
            if (filter === "unread" && c.unread === 0) return false;
            if (filter === "groups" && c.kind !== "group") return false;
            if (q && !c.title.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [conversations, filter, q]);

    // While searching (All tab), also surface people you haven't chatted with yet
    const suggestedPeople = useMemo(() => {
        if (!q || filter !== "all") return [];
        const existing = new Set(conversations.filter((c) => c.kind === "dm").map((c) => c.id));
        return otherUsers.filter(
            (u) => !existing.has(u.suid) && (u.name.toLowerCase().includes(q) || (u.role_code || "").toLowerCase().includes(q))
        );
    }, [q, filter, conversations, otherUsers]);

    /* ------------------------------ Actions ------------------------------ */
    const resetOverlays = useCallback(() => {
        setThemePickerOpen(false);
        setInfoOpen(false);
        setInfoView("main");
        setDialog(null);
        setLightbox(null);
        setMediaTab("media");
        setMediaScope("chat");
    }, []);

    const openGroupChat = (groupId: number) => {
        setActiveGroupId(groupId);
        setActivePeerId(null);
        resetOverlays();
        setNewOpen(false);
        setVisibleCount(PAGE_SIZE);
    };

    const openDirectChat = (peerId: string) => {
        if (peerId === me.suid) return;
        setActivePeerId(peerId);
        setActiveGroupId(null);
        resetOverlays();
        setNewOpen(false);
        setNewSearch("");
        setVisibleCount(PAGE_SIZE);
    };

    const closeChat = () => {
        resetOverlays();
        setActiveGroupId(null);
        setActivePeerId(null);
    };

    const infoBack = (v: InfoView): InfoView => (v === "admins" ? "permissions" : "main");

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            if (lightbox) setLightbox(null);
            else if (dialog) setDialog(null);
            else if (themePickerOpen) setThemePickerOpen(false);
            else if (newOpen) setNewOpen(false);
            else if (infoOpen) {
                if (infoView !== "main") setInfoView(infoBack(infoView));
                else setInfoOpen(false);
            } else if (convKey) closeChat();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lightbox, dialog, themePickerOpen, newOpen, infoOpen, infoView, convKey]);

    const sendMessage = useCallback(
        async (text: string, files: File[] = []): Promise<boolean> => {
            if (!convKey || !canSend) return false;
            const key = convKey;
            const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

            /* ---- text only ---- */
            if (!files.length) {
                if (!text) return false;
                const ok = saveMessage({
                    id: newId(),
                    conv_key: key,
                    sender_suid: me.suid,
                    sender_name: me.name,
                    text,
                    time: new Date().toISOString(),
                });
                if (!ok) return false;
                markRead(key);
                setVersion((v) => v + 1);

                if (CHAT_API_BASE) {
                    const posted = await postRemoteMessage(key, text);
                    if (!posted) toast.error("Message did not reach the server");
                    else {
                        const list = await fetchRemoteMessages(key);
                        if (list) setRemoteState({ key, list });
                    }
                }
                return true;
            }

            /* ---- photos / documents (the first successfully saved file carries the caption) ---- */
            let caption = text;
            let sent = 0;
            for (const f of files) {
                try {
                    const prepared = await prepareAttachment(f);
                    if (prepared.data.length > MAX_STORED_CHARS) {
                        toast.error(`"${f.name}" is too large to send`);
                        continue;
                    }
                    const id = newId();
                    if (!writeJson(fileKey(id), prepared.data, true)) {
                        toast.error(`"${f.name}" could not be saved. Browser storage is full.`);
                        continue;
                    }
                    const ok = saveMessage(
                        {
                            id,
                            conv_key: key,
                            sender_suid: me.suid,
                            sender_name: me.name,
                            text: caption,
                            time: new Date().toISOString(),
                            file: { name: prepared.name, size: f.size, mime: prepared.mime },
                        },
                        true
                    );
                    if (!ok) {
                        removeKey(fileKey(id));
                        toast.error(`"${f.name}" could not be saved. Browser storage is full.`);
                        continue;
                    }
                    caption = "";
                    sent++;
                    markRead(key);
                    setVersion((v) => v + 1);
                } catch {
                    toast.error(`"${f.name}" could not be read`);
                }
            }
            return sent > 0;
        },
        [convKey, canSend, me.suid, me.name]
    );

    const updateMeta = (patch: Partial<ConvMeta>) => {
        if (!convKey) return;
        writeJson(metaKey(me.suid, convKey), { ...getMeta(me.suid, convKey), ...patch });
        bump();
    };

    const updateShared = (patch: Partial<SharedSettings>) => {
        if (!convKey) return;
        writeJson(sharedKey(convKey), { ...getShared(convKey), ...patch });
        bump();
    };

    const toggleStar = useCallback(
        (id: string) => {
            if (!convKey) return;
            const cur = getMeta(me.suid, convKey);
            const has = cur.starred.includes(id);
            writeJson(metaKey(me.suid, convKey), {
                ...cur,
                starred: has ? cur.starred.filter((x) => x !== id) : [...cur.starred, id],
            });
            setVersion((v) => v + 1);
        },
        [convKey, me.suid]
    );

    /** Download a photo / document (blocked while Advanced chat privacy is on for that chat). */
    const downloadAttachment = useCallback((m: ChatMessage) => {
        if (!m.file) return;
        if (getShared(m.conv_key).advPrivacy) {
            toast.error("Downloading is blocked while Advanced chat privacy is on");
            return;
        }
        const data = loadFileData(m.id);
        if (!data) {
            toast.error("This file is no longer available");
            return;
        }
        const a = document.createElement("a");
        a.href = data;
        a.download = safeFileName(m.file.name);
        document.body.appendChild(a);
        a.click();
        a.remove();
    }, []);

    /** Open the photo viewer from a message bubble (all photos of this chat). */
    const openMediaFromChat = useCallback(
        (id: string) => {
            if (!convKey) return;
            const items: MediaItem[] = messagesLive.current
                .filter((m) => m.file && isImageMime(m.file.mime))
                .map((m) => ({ msg: m, convKey, chat: chatTitle }));
            const index = items.findIndex((it) => it.msg.id === id);
            if (index >= 0) setLightbox({ items, index });
        },
        [convKey, chatTitle]
    );

    const applyMute = (choice: "off" | (typeof MUTE_OPTIONS)[number]["id"]) => {
        const opt = MUTE_OPTIONS.find((o) => o.id === choice);
        const until = !opt ? 0 : opt.ms === -1 ? -1 : Date.now() + opt.ms;
        updateMeta({ mutedUntil: until, muteChoice: opt ? opt.id : "" });
        setDialog(null);
        toast.success(until === 0 ? "Notifications turned on" : "Notifications muted");
    };

    const applyTtl = (ms: number) => {
        if (!canEditSettings) {
            toast.error("Only admins can change this setting");
            setDialog(null);
            return;
        }
        updateShared({ ttl: ms, ttlSince: Date.now() });
        setDialog(null);
        toast.success(ms ? `Disappearing messages: ${ttlLabel(ms)}` : "Disappearing messages turned off");
    };

    const togglePrivacy = () => {
        if (!canEditSettings) {
            toast.error("Only admins can change this setting");
            return;
        }
        const next = !shared.advPrivacy;
        updateShared({ advPrivacy: next });
        toast.success(next ? "Advanced chat privacy turned on" : "Advanced chat privacy turned off");
    };

    const exportChat = () => {
        if (shared.advPrivacy) {
            toast.error("Export is blocked while Advanced chat privacy is on");
            return;
        }
        if (!messages.length) {
            toast.info("There are no messages to export");
            return;
        }
        downloadText(`${safeFileName(`Gurukul chat with ${chatTitle}`)}.txt`, buildExportText(messages));
        toast.success("Chat exported");
    };

    const clearChat = () => {
        updateMeta({ clearedAt: Date.now(), starred: [], keep: true });
        setDialog(null);
        setInfoOpen(false);
        setInfoView("main");
        toast.success("Chat cleared");
    };

    const deleteChat = () => {
        updateMeta({ clearedAt: Date.now(), starred: [], keep: false });
        closeChat();
        toast.success("Chat deleted");
    };

    /* ---- group permissions ---- */
    const setPermission = (patch: Partial<SharedSettings>) => {
        if (!meAdmin) {
            toast.error("Only admins can change group permissions");
            return;
        }
        updateShared(patch);
    };

    const toggleAdmin = (suid: string) => {
        if (!meAdmin) {
            toast.error("Only admins can edit group admins");
            return;
        }
        const has = shared.admins.includes(suid);
        updateShared({ admins: has ? shared.admins.filter((x) => x !== suid) : [...shared.admins, suid] });
    };

    const addMembersToGroup = (ids: string[], fromPending = false) => {
        if (!convKey || !activeGroup || !ids.length) return;
        if (!fromPending && !canAdd) {
            toast.error("You don't have permission to add members");
            return;
        }
        const cur = getShared(convKey);
        const stamp = cur.sendHistory ? 0 : Date.now();
        const historyFrom = { ...cur.historyFrom };
        ids.forEach((id) => {
            historyFrom[id] = stamp;
        });
        writeJson(sharedKey(convKey), {
            ...cur,
            added: Array.from(new Set([...cur.added, ...ids])),
            pending: cur.pending.filter((p) => !ids.includes(p)),
            historyFrom,
        });
        bump();
    };

    const rejectRequest = (suid: string) => {
        if (!convKey) return;
        const cur = getShared(convKey);
        writeJson(sharedKey(convKey), { ...cur, pending: cur.pending.filter((p) => p !== suid) });
        bump();
        toast.success("Request rejected");
    };

    const confirmAddMembers = () => {
        if (!addSel.length) return;
        addMembersToGroup(addSel);
        toast.success(`${addSel.length} member${addSel.length === 1 ? "" : "s"} added`);
        setAddSel([]);
        setAddQuery("");
        setInfoView("main");
    };

    const copyInviteLink = async () => {
        if (!convKey || !canInvite) return;
        const url = `${window.location.origin}${window.location.pathname}?${INVITE_PARAM}=${encodeURIComponent(convKey)}`;
        try {
            await navigator.clipboard.writeText(url);
            toast.success("Invite link copied");
        } catch {
            window.prompt("Copy this invite link", url);
        }
    };

    // Someone opened an invite link: ?gkjoin=group_<id>
    useEffect(() => {
        if (loading || joinHandled.current) return;
        joinHandled.current = true;
        let key: string | null = null;
        try {
            key = new URLSearchParams(window.location.search).get(INVITE_PARAM);
        } catch {
            key = null;
        }
        if (!key) return;

        const gid = Number(String(key).replace(/^group_/, ""));
        const clean = () => {
            try {
                const u = new URL(window.location.href);
                u.searchParams.delete(INVITE_PARAM);
                window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash);
            } catch {
                /* ignore */
            }
        };

        (async () => {
            let g: GroupData | null = groups.find((x) => x.group_id === gid) || null;
            if (!g) {
                try {
                    const all = await groupService.getAllGroups();
                    if (all.success && Array.isArray(all.data)) g = all.data.find((x) => x.group_id === gid) || null;
                } catch {
                    /* ignore */
                }
                if (g) {
                    const found = g;
                    setGroups((prev) =>
                        prev.some((x) => x.group_id === found.group_id) ? prev : [...prev, found].sort((a, b) => a.group_id - b.group_id)
                    );
                }
            }
            clean();
            if (!g) {
                toast.error("This invite link is not valid");
                return;
            }

            const gkey = `group_${g.group_id}`;
            const sh = getShared(gkey);
            const already = membersOf(g).some((m) => String(m.suid) === me.suid);
            if (already) {
                openGroupChat(g.group_id);
                return;
            }
            const admin = me.isSuper || sh.admins.includes(me.suid);
            if (sh.approveNew && !admin) {
                if (!sh.pending.includes(me.suid)) writeJson(sharedKey(gkey), { ...sh, pending: [...sh.pending, me.suid] });
                bump();
                toast.success("Request sent. An admin needs to approve it.");
                return;
            }
            writeJson(sharedKey(gkey), {
                ...sh,
                added: [...sh.added, me.suid],
                historyFrom: { ...sh.historyFrom, [me.suid]: sh.sendHistory ? 0 : Date.now() },
            });
            bump();
            toast.success(`You joined ${g.group_name}`);
            openGroupChat(g.group_id);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading]);

    const jumpToMessage = (id: string) => {
        const idx = messages.findIndex((m) => m.id === id);
        if (idx < 0) return;
        const needed = messages.length - idx;
        if (needed > visibleCount) setVisibleCount(needed + 20);
        setInfoOpen(false);
        setInfoView("main");
        setHighlightId(id);
        window.setTimeout(() => {
            const cont = messagesRef.current;
            const el = cont?.querySelector<HTMLElement>(`[data-mid="${CSS.escape(id)}"]`);
            if (cont && el) {
                const c = cont.getBoundingClientRect();
                const r = el.getBoundingClientRect();
                cont.scrollTo({
                    top: cont.scrollTop + (r.top - c.top) - cont.clientHeight / 2 + r.height / 2,
                    behavior: "smooth",
                });
            }
        }, 80);
        window.setTimeout(() => setHighlightId(null), 1800);
    };

    const persistChatTheme = (id: string, applyToAll: boolean) => {
        if (!convKey) return;
        if (applyToAll) {
            if (saveChatThemeValue(CHAT_THEME_DEFAULT_KEY, id)) {
                removeChatThemeValue(chatThemeStorageKey(convKey));
            }
        } else {
            saveChatThemeValue(chatThemeStorageKey(convKey), id);
        }
    };

    /* -------------------------------------------------------------------------- */
    /*  CHATS LIST PANEL                                                           */
    /* -------------------------------------------------------------------------- */
    const renderRow = (c: ConvItem) => {
        const active = c.key === convKey;
        const hasUnread = c.unread > 0;
        return (
            <button
                key={c.key}
                onClick={() => (c.kind === "group" ? openGroupChat(Number(c.id)) : openDirectChat(c.id))}
                className={`w-full flex items-center gap-3.5 px-4 py-3 text-left transition-colors duration-150
                ${active
                        ? theme ? "bg-slate-800/90" : "bg-red-50"
                        : theme ? "hover:bg-slate-800/50" : "hover:bg-slate-50"
                    }`}
            >
                {c.kind === "group" ? (
                    <GroupAvatar dark={theme} name={c.title} size={52} />
                ) : (
                    <PersonAvatar dark={theme} name={c.title} avatar={c.avatar} size={52} superBadge={c.isSuper} online />
                )}
                <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                        <span className={`truncate text-sm ${hasUnread ? "font-bold" : "font-semibold"} ${theme ? "text-slate-100" : "text-slate-900"}`}>
                            {c.title}
                        </span>
                        {c.lastTime > 0 && (
                            <span
                                className={`shrink-0 text-[11px] font-medium ${
                                    hasUnread && !c.muted ? (theme ? "text-blue-400" : "text-red-600") : theme ? "text-slate-500" : "text-slate-400"
                                }`}
                            >
                                {formatListTime(c.lastTime)}
                            </span>
                        )}
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                        <span
                            className={`truncate text-xs ${
                                hasUnread
                                    ? theme ? "font-semibold text-slate-200" : "font-semibold text-slate-800"
                                    : theme ? "text-slate-400" : "text-slate-500"
                            }`}
                        >
                            {c.preview}
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5">
                            {c.muted && (
                                <IoNotificationsOffOutline
                                    aria-label="Muted"
                                    className={`text-sm ${theme ? "text-slate-500" : "text-slate-400"}`}
                                />
                            )}
                            {hasUnread && (
                                <span
                                    className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white
                                    ${c.muted ? (theme ? "bg-slate-600" : "bg-slate-400") : theme ? "bg-blue-600" : "bg-red-600"}`}
                                >
                                    {c.unread > 99 ? "99+" : c.unread}
                                </span>
                            )}
                        </span>
                    </span>
                </span>
            </button>
        );
    };

    const renderLeftPanel = () => {
        const chip = (id: FilterTab, label: string, count?: number) => {
            const on = filter === id;
            return (
                <button
                    key={id}
                    onClick={() => setFilter(id)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors
                    ${on
                            ? theme ? "border-blue-500/40 bg-blue-600/20 text-blue-300" : "border-red-200 bg-red-50 text-red-700"
                            : theme ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                >
                    {label}
                    {count !== undefined && count > 0 && <span className="ml-1.5 opacity-80">{count}</span>}
                </button>
            );
        };

        return (
            <aside
                className={`${convKey ? "hidden md:flex" : "flex"} w-full md:w-88 lg:w-96 shrink-0 min-h-0 flex-col border-l
                ${theme ? "border-slate-700/80 bg-[#0B1120]" : "border-slate-200 bg-white"}`}
            >
                {/* Title row */}
                <div className="flex shrink-0 items-center gap-3 px-4 pt-5 pb-3">
                    <LogoTile dark={theme} size={40} />
                    <div className="min-w-0 flex-1">
                        <h1 className={`text-xl font-bold tracking-tight leading-tight ${theme ? "text-white" : "text-slate-900"}`}>Gurukul Community</h1>
                        <p className={`truncate text-[11px] font-medium ${theme ? "text-slate-400" : "text-slate-500"}`}>
                            {me.name} · {directory.length} members
                        </p>
                    </div>
                    <button
                        onClick={() => setNewOpen(true)}
                        title="New message"
                        aria-label="New message"
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg transition-all active:scale-95
                        ${theme ? "bg-blue-600 hover:bg-blue-500 shadow-blue-900/40" : "bg-red-600 hover:bg-red-700 shadow-red-600/25"}`}
                    >
                        <IoCreateOutline className="text-xl" />
                    </button>
                </div>

                {/* Search (WhatsApp style) */}
                <div className="shrink-0 px-4 pb-3">
                    <div
                        className={`flex items-center gap-2.5 rounded-full border px-4 py-2.5 transition-colors
                        ${theme ? "border-transparent bg-slate-800/80 focus-within:border-blue-500" : "border-transparent bg-slate-100 focus-within:border-red-400"}`}
                    >
                        <IoSearchOutline className={`text-base ${theme ? "text-slate-400" : "text-slate-500"}`} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search or start a new chat"
                            className={`w-full bg-transparent text-sm outline-none ${theme ? "text-slate-100 placeholder:text-slate-500" : "text-slate-800 placeholder:text-slate-500"}`}
                        />
                        {search && (
                            <button onClick={() => setSearch("")} aria-label="Clear search">
                                <IoClose className={theme ? "text-slate-400" : "text-slate-500"} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter chips: All / Unread / Groups */}
                <div className={`flex shrink-0 gap-2 overflow-x-auto px-4 pb-3 ${HIDE_SCROLL}`}>
                    {chip("all", "All")}
                    {chip("unread", "Unread", unreadChats)}
                    {chip("groups", "Groups", groups.length)}
                </div>

                {/* List */}
                <div className={`flex-1 min-h-0 overflow-y-auto pb-3 ${HIDE_SCROLL}`}>
                    {loading ? (
                        <div className="space-y-1 px-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex animate-pulse items-center gap-3.5 py-3">
                                    <div className={`h-13 w-13 rounded-full ${theme ? "bg-slate-800" : "bg-slate-200"}`} />
                                    <div className="flex-1 space-y-2">
                                        <div className={`h-3.5 w-1/2 rounded ${theme ? "bg-slate-800" : "bg-slate-200"}`} />
                                        <div className={`h-3 w-3/4 rounded ${theme ? "bg-slate-800/70" : "bg-slate-100"}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {visibleConversations.map(renderRow)}

                            {suggestedPeople.length > 0 && (
                                <>
                                    <p className={`px-4 pt-4 pb-1 text-[10px] font-bold uppercase tracking-[0.2em] ${theme ? "text-slate-500" : "text-slate-400"}`}>
                                        People
                                    </p>
                                    {suggestedPeople.map((u) => (
                                        <button
                                            key={u.suid}
                                            onClick={() => openDirectChat(u.suid)}
                                            className={`flex w-full items-center gap-3.5 px-4 py-3 text-left transition-colors ${theme ? "hover:bg-slate-800/50" : "hover:bg-slate-50"}`}
                                        >
                                            <PersonAvatar dark={theme} name={u.name} avatar={u.avatar} size={52} superBadge={u.isSuper} online />
                                            <span className="min-w-0 flex-1">
                                                <span className={`block truncate text-sm font-semibold ${theme ? "text-slate-100" : "text-slate-900"}`}>{u.name}</span>
                                                <span className={`block truncate text-xs ${theme ? "text-slate-400" : "text-slate-500"}`}>
                                                    {u.role_code || "Tap to start conversation"}
                                                </span>
                                            </span>
                                        </button>
                                    ))}
                                </>
                            )}

                            {visibleConversations.length === 0 && suggestedPeople.length === 0 && (
                                <div className="flex flex-col items-center px-6 py-14 text-center">
                                    <p className={`text-sm font-semibold ${theme ? "text-slate-300" : "text-slate-700"}`}>
                                        {filter === "unread"
                                            ? "No unread chats"
                                            : filter === "groups"
                                                ? "No groups found"
                                                : q
                                                    ? "No chats found"
                                                    : "No chats yet"}
                                    </p>
                                    <p className={`mt-1 text-xs ${theme ? "text-slate-500" : "text-slate-400"}`}>
                                        {filter === "all" && !q ? "Tap the compose button to message someone." : "Try a different filter or search."}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </aside>
        );
    };

    /* -------------------------------------------------------------------------- */
    /*  CHAT AREA – empty state / chat                                             */
    /* -------------------------------------------------------------------------- */
    const renderEmptyState = () => (
        <div
            className={`${convKey ? "hidden" : "hidden md:flex"} flex-1 min-w-0 flex-col items-center justify-center gap-3 px-6 text-center
            ${theme ? "bg-[#0A0E14]" : "bg-[#FAFAFA]"}`}
        >
            <span
                className={`flex h-24 w-24 items-center justify-center rounded-full border-2 ${
                    theme ? "border-slate-200 text-slate-100" : "border-slate-900 text-slate-900"
                }`}
            >
                <IoPaperPlaneOutline className="text-5xl" />
            </span>
            <h2 className={`mt-2 text-xl font-bold ${theme ? "text-white" : "text-slate-900"}`}>Your messages</h2>
            <p className={`text-sm ${theme ? "text-slate-400" : "text-slate-500"}`}>Send a message to start a chat.</p>
            <button
                onClick={() => setNewOpen(true)}
                className={`mt-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all active:scale-95
                ${theme ? "bg-blue-600 hover:bg-blue-500 shadow-blue-900/40" : "bg-red-600 hover:bg-red-700 shadow-red-600/25"}`}
            >
                Send message
            </button>
        </div>
    );

    const renderChat = () => {
        if (!convKey) return renderEmptyState();

        const isGroup = !!activeGroup;
        const title = chatTitle;
        const peerGroups = activePeer ? groupsOfUser(activePeer.suid) : [];
        const members = isGroup ? activeMembers : [];
        const subtitle = isGroup
            ? members.map((m) => m.name).join(", ")
            : [activePeer?.role_code, peerGroups.map((g) => g.group_name).join(", ")].filter(Boolean).join(" · ") || "Direct message";

        const preference =
            themeConversationKey === convKey
                ? { id: chatThemeId, applyToAll: applyThemeToAll }
                : resolveStoredChatTheme(convKey);
        const ct = getChatTheme(preference.id);
        const cv: ChatVars = theme ? ct.dark : ct.light;

        const surface = theme ? "bg-[#0E1626]" : "bg-white";
        const subText = theme ? "text-slate-400" : "text-slate-500";
        const mutedNow = isMuted(meta.mutedUntil, now);

        const isAdminMember = (m: any) => isSuperRole(m.role_code, m.name) || shared.admins.includes(String(m.suid));
        const adminMembers = members.filter(isAdminMember);

        /* ---------------- Dialogs ---------------- */
        const renderDialog = () => {
            switch (dialog) {
                case "mute":
                    return (
                        <DialogShell dark={theme} title="Mute notifications" onClose={() => setDialog(null)}>
                            <p className={`px-5 pb-2 text-xs leading-relaxed ${subText}`}>
                                You won't see notifications for new messages in this chat. Muted chats show a bell icon in your chats list.
                            </p>
                            <div role="radiogroup" className="pb-2">
                                {MUTE_OPTIONS.map((o) => (
                                    <RadioRow
                                        key={o.id}
                                        dark={theme}
                                        accent={cv.accent}
                                        label={o.label}
                                        selected={mutedNow && meta.muteChoice === o.id}
                                        onClick={() => applyMute(o.id)}
                                    />
                                ))}
                            </div>
                            {mutedNow && (
                                <div className={`border-t px-5 py-3 ${theme ? "border-slate-700/80" : "border-slate-200"}`}>
                                    <button onClick={() => applyMute("off")} className="text-sm font-semibold" style={{ color: cv.accent }}>
                                        Unmute notifications
                                    </button>
                                </div>
                            )}
                        </DialogShell>
                    );

                case "disappearing":
                    return (
                        <DialogShell dark={theme} title="Disappearing messages" onClose={() => setDialog(null)}>
                            <p className={`px-5 pb-2 text-xs leading-relaxed ${subText}`}>
                                New messages in this chat will disappear after the selected time. Messages sent earlier are not affected.
                            </p>
                            <div role="radiogroup" className="pb-3">
                                {TTL_OPTIONS.map((o) => (
                                    <RadioRow
                                        key={o.ms}
                                        dark={theme}
                                        accent={cv.accent}
                                        label={o.label}
                                        selected={shared.ttl === o.ms}
                                        onClick={() => applyTtl(o.ms)}
                                    />
                                ))}
                            </div>
                        </DialogShell>
                    );

                case "encryption":
                    return (
                        <DialogShell dark={theme} title="Encryption & privacy" onClose={() => setDialog(null)}>
                            <div className="px-5 pb-2">
                                <span
                                    className="mb-3 flex h-12 w-12 items-center justify-center rounded-full text-white"
                                    style={{ background: cv.accentGradient }}
                                >
                                    <IoLockClosedOutline className="text-2xl" />
                                </span>
                                <p className={`text-sm leading-relaxed ${theme ? "text-slate-200" : "text-slate-700"}`}>
                                    {isGroup
                                        ? "Messages in this group are visible only to the group's members and Super Admins."
                                        : "Messages in this chat are visible only to you and this contact."}
                                </p>
                                <p className={`mt-2 text-xs leading-relaxed ${subText}`}>
                                    Chats are currently saved on this device. Turn on Advanced chat privacy to block exporting, downloading and copying messages.
                                </p>
                            </div>
                            <div className="px-5 pb-4 pt-2">
                                <button
                                    onClick={() => setDialog(null)}
                                    className="w-full rounded-xl py-2.5 text-sm font-semibold text-white"
                                    style={{ background: cv.accentGradient }}
                                >
                                    Got it
                                </button>
                            </div>
                        </DialogShell>
                    );

                case "clear":
                case "delete": {
                    const isDelete = dialog === "delete";
                    return (
                        <DialogShell dark={theme} title={isDelete ? "Delete this chat?" : "Clear this chat?"} onClose={() => setDialog(null)}>
                            <p className={`px-5 pb-4 text-sm leading-relaxed ${theme ? "text-slate-300" : "text-slate-600"}`}>
                                {isDelete
                                    ? `This chat with ${title} and all its messages will be removed from your chats list. This can't be undone.`
                                    : "All messages in this chat will be removed from your view. This can't be undone."}
                            </p>
                            <div className="flex justify-end gap-2 px-5 pb-4">
                                <button
                                    onClick={() => setDialog(null)}
                                    className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
                                        theme ? "border-slate-700 text-slate-200 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-100"
                                    }`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={isDelete ? deleteChat : clearChat}
                                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                                >
                                    {isDelete ? "Delete chat" : "Clear chat"}
                                </button>
                            </div>
                        </DialogShell>
                    );
                }

                default:
                    return null;
            }
        };

        /* ---------------- Photo viewer ---------------- */
        const renderLightbox = () => {
            if (!lightbox) return null;
            const item = lightbox.items[lightbox.index];
            if (!item) return null;
            const data = loadFileData(item.msg.id);
            const priv = getShared(item.convKey).advPrivacy;
            const go = (d: number) =>
                setLightbox((l) => (l ? { ...l, index: Math.min(l.items.length - 1, Math.max(0, l.index + d)) } : l));
            const navBtn = "absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/25 disabled:opacity-30";
            return (
                <div className="absolute inset-0 z-50 flex flex-col bg-black/95 text-white" role="dialog" aria-modal="true" aria-label="Photo viewer">
                    <div className="flex shrink-0 items-center gap-3 px-3 py-3 md:px-5">
                        <button
                            onClick={() => setLightbox(null)}
                            aria-label="Close"
                            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/15"
                        >
                            <IoClose className="text-2xl" />
                        </button>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{item.msg.sender_suid === me.suid ? "You" : item.msg.sender_name}</p>
                            <p className="truncate text-[11px] text-white/70">
                                {formatDay(item.msg.time)} · {formatTime(item.msg.time)}
                                {mediaScope === "all" && item.chat ? ` · ${item.chat}` : ""}
                            </p>
                        </div>
                        <span className="text-xs text-white/70">
                            {lightbox.index + 1} / {lightbox.items.length}
                        </span>
                        {priv ? (
                            <span title="Download blocked by Advanced chat privacy" className="flex h-10 w-10 items-center justify-center text-xl text-white/70">
                                <IoLockClosedOutline />
                            </span>
                        ) : (
                            <button
                                onClick={() => downloadAttachment(item.msg)}
                                aria-label="Download"
                                title="Download"
                                className="flex h-10 w-10 items-center justify-center rounded-full text-xl hover:bg-white/15"
                            >
                                <IoDownloadOutline />
                            </button>
                        )}
                    </div>

                    <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4">
                        <button className={`${navBtn} left-3`} onClick={() => go(-1)} disabled={lightbox.index === 0} aria-label="Previous photo">
                            <IoChevronBack />
                        </button>
                        {data ? (
                            <img
                                src={data}
                                alt={item.msg.file?.name || "Photo"}
                                draggable={false}
                                onContextMenu={priv ? (e) => e.preventDefault() : undefined}
                                className={`max-h-full max-w-full rounded-lg object-contain ${priv ? "select-none" : ""}`}
                            />
                        ) : (
                            <p className="text-sm text-white/70">This photo is no longer available</p>
                        )}
                        <button
                            className={`${navBtn} right-3`}
                            onClick={() => go(1)}
                            disabled={lightbox.index >= lightbox.items.length - 1}
                            aria-label="Next photo"
                        >
                            <IoChevronForward />
                        </button>
                    </div>
                    {item.msg.text && <p className="shrink-0 px-6 pb-4 text-center text-sm text-white/90 wrap-break-word">{item.msg.text}</p>}
                </div>
            );
        };

        /* ---------------- Info: main ---------------- */
        const actionRow = (key: string, icon: React.ReactNode, label: string, onClick: () => void, trailing?: React.ReactNode) => (
            <button
                key={key}
                type="button"
                onClick={onClick}
                className={`chat-sidebar-row flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left transition-colors ${theme ? "hover:bg-slate-800" : "hover:bg-slate-50"}`}
            >
                <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl text-white shadow-md"
                    style={{ background: cv.accentGradient }}
                >
                    {icon}
                </span>
                <span className={`min-w-0 flex-1 text-sm font-semibold ${theme ? "text-slate-100" : "text-slate-800"}`}>{label}</span>
                {trailing}
            </button>
        );

        const renderInfoMain = () => (
            <>
                {/* Hero */}
                <div className={`flex flex-col items-center px-6 pt-8 pb-6 text-center ${surface}`}>
                    {isGroup ? (
                        <GroupAvatar dark={theme} name={title} size={112} />
                    ) : (
                        <PersonAvatar dark={theme} name={title} avatar={activePeer?.avatar} size={112} superBadge={activePeer?.isSuper} />
                    )}
                    <h4 className="mt-4 text-xl font-bold tracking-tight">{title}</h4>
                    <p className={`mt-1 text-sm font-medium ${subText}`}>
                        {isGroup
                            ? `Group · ${members.length} member${members.length === 1 ? "" : "s"}`
                            : activePeer?.role_code || "Community member"}
                    </p>
                    {!isGroup && activePeer?.role_code && (
                        <span
                            className="mt-3 rounded-full border px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                            style={{ borderColor: cv.accent, color: cv.chip.color, backgroundColor: `${cv.accent}18` }}
                        >
                            {activePeer.role_code}
                        </span>
                    )}
                </div>

                {/* Description */}
                {isGroup && activeGroup!.description && (
                    <div className={`mt-2 px-6 py-4 ${surface}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${subText}`}>Description</p>
                        <p className={`mt-1.5 text-sm leading-relaxed whitespace-pre-wrap ${theme ? "text-slate-200" : "text-slate-700"}`}>
                            {activeGroup!.description}
                        </p>
                    </div>
                )}

                {/* Settings */}
                <div className={`mt-2 px-2 py-2 ${surface}`}>
                    <SettingRow
                        dark={theme}
                        icon={<IoImagesOutline />}
                        title="Media, links and docs"
                        onClick={() => {
                            setMediaTab("media");
                            setMediaScope("chat");
                            setInfoView("media");
                        }}
                        trailing={
                            <span className={`flex items-center gap-1 text-xs ${subText}`}>
                                {mediaTotal > 0 && mediaTotal}
                                <IoChevronForward />
                            </span>
                        }
                    />
                    <SettingRow
                        dark={theme}
                        icon={<IoStarOutline />}
                        title="Starred messages"
                        onClick={() => setInfoView("starred")}
                        trailing={
                            <span className={`flex items-center gap-1 text-xs ${subText}`}>
                                {starredMessages.length > 0 && starredMessages.length}
                                <IoChevronForward />
                            </span>
                        }
                    />
                    <SettingRow
                        dark={theme}
                        icon={mutedNow ? <IoNotificationsOffOutline /> : <IoNotificationsOutline />}
                        title="Notification settings"
                        subtitle={mutedNow ? muteLabel(meta.mutedUntil) : undefined}
                        onClick={() => setDialog("mute")}
                    />
                    <SettingRow
                        dark={theme}
                        icon={<IoColorPaletteOutline />}
                        title="Chat theme"
                        onClick={() => setThemePickerOpen(true)}
                    />
                    <SettingRow
                        dark={theme}
                        icon={<IoLockClosedOutline />}
                        title="Encryption"
                        subtitle={
                            isGroup
                                ? "Only group members can see these messages. Click to learn more."
                                : "Only you and this contact can see these messages. Click to learn more."
                        }
                        onClick={() => setDialog("encryption")}
                    />
                    <SettingRow
                        dark={theme}
                        icon={<IoTimerOutline />}
                        title="Disappearing messages"
                        subtitle={canEditSettings ? ttlLabel(shared.ttl) : `${ttlLabel(shared.ttl)} · Only admins can change this`}
                        disabled={!canEditSettings}
                        onClick={() => setDialog("disappearing")}
                    />
                    <SettingRow
                        dark={theme}
                        icon={<IoShieldCheckmarkOutline />}
                        title="Advanced chat privacy"
                        subtitle={shared.advPrivacy ? "On" : "Off"}
                        onClick={() => setInfoView("privacy")}
                        trailing={<IoChevronForward className={subText} />}
                    />
                    {isGroup && (
                        <SettingRow
                            dark={theme}
                            icon={<IoSettingsOutline />}
                            title="Group permissions"
                            onClick={() => setInfoView("permissions")}
                            trailing={<IoChevronForward className={subText} />}
                        />
                    )}
                </div>

                {/* Members / groups in common */}
                <div className={`mt-2 pb-4 ${surface}`}>
                    <p className={`flex items-center gap-2 px-6 pt-4 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] ${subText}`}>
                        <IoPeopleOutline className="text-sm" />
                        {isGroup
                            ? `${members.length} Member${members.length === 1 ? "" : "s"}`
                            : `Member of ${peerGroups.length} group${peerGroups.length === 1 ? "" : "s"}`}
                    </p>

                    <div className="px-3 space-y-0.5">
                        {isGroup && canAdd &&
                            actionRow("add", <IoPersonAddOutline />, "Add members", () => {
                                setAddSel([]);
                                setAddQuery("");
                                setInfoView("addMembers");
                            })}
                        {isGroup && canInvite && actionRow("invite", <IoLinkOutline />, "Invite via link", copyInviteLink)}
                        {isGroup && meAdmin && shared.pending.length > 0 &&
                            actionRow(
                                "pending",
                                <IoTimeOutline />,
                                "Pending requests",
                                () => setInfoView("pending"),
                                <span
                                    className="flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold text-white"
                                    style={{ background: cv.accent }}
                                >
                                    {shared.pending.length}
                                </span>
                            )}

                        {isGroup
                            ? members.map((m) => {
                                const self = String(m.suid) === me.suid;
                                return (
                                    <button
                                        key={m.suid}
                                        disabled={self}
                                        onClick={() => openDirectChat(String(m.suid))}
                                        title={self ? "You" : `Message ${m.name}`}
                                        className={`chat-sidebar-row w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-left transition-colors
                                        ${self ? "cursor-default" : theme ? "hover:bg-slate-800" : "hover:bg-slate-50"}`}
                                    >
                                        <PersonAvatar dark={theme} name={m.name} avatar={m.avatar} size={44} />
                                        <span className="min-w-0 flex-1">
                                            <span className={`block truncate text-sm font-semibold ${theme ? "text-slate-100" : "text-slate-800"}`}>
                                                {m.name} {self && <span className="font-normal opacity-60">(You)</span>}
                                            </span>
                                            {m.role_code && <span className={`block truncate text-xs ${subText}`}>{m.role_code}</span>}
                                        </span>
                                        {isAdminMember(m) && (
                                            <span
                                                className="shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold"
                                                style={{ borderColor: cv.accent, color: cv.chip.color, backgroundColor: `${cv.accent}18` }}
                                            >
                                                Group admin
                                            </span>
                                        )}
                                    </button>
                                );
                            })
                            : peerGroups.length === 0 ? (
                                <p className={`py-6 text-center text-xs ${subText}`}>Not in any group</p>
                            ) : (
                                peerGroups.map((g) => (
                                    <button
                                        key={g.group_id}
                                        onClick={() => openGroupChat(g.group_id)}
                                        className={`chat-sidebar-row w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-left transition-colors ${theme ? "hover:bg-slate-800" : "hover:bg-slate-50"}`}
                                    >
                                        <GroupAvatar dark={theme} name={g.group_name} size={44} />
                                        <span className={`min-w-0 flex-1 truncate text-sm font-semibold ${theme ? "text-slate-100" : "text-slate-800"}`}>{g.group_name}</span>
                                    </button>
                                ))
                            )}
                    </div>
                </div>

                {/* Contact actions: Export / Clear / Delete */}
                {!isGroup && (
                    <div className={`mt-2 mb-4 px-2 py-2 ${surface}`}>
                        <SettingRow
                            dark={theme}
                            icon={<IoDownloadOutline />}
                            title="Export chat"
                            subtitle={shared.advPrivacy ? "Disabled by Advanced chat privacy" : undefined}
                            onClick={exportChat}
                        />
                        <SettingRow dark={theme} tone="danger" icon={<IoRemoveCircleOutline />} title="Clear chat" onClick={() => setDialog("clear")} />
                        <SettingRow dark={theme} tone="danger" icon={<IoTrashOutline />} title="Delete chat" onClick={() => setDialog("delete")} />
                    </div>
                )}
            </>
        );

        /* ---------------- Info: media, links and docs ---------------- */
        const renderInfoMedia = () => {
            const tabs: { id: MediaTab; label: string; count: number }[] = [
                { id: "media", label: "Media", count: buckets.media.length },
                { id: "docs", label: "Docs", count: buckets.docs.length },
                { id: "links", label: "Links", count: buckets.links.length },
            ];
            const heading = (label: string) => (
                <p className={`px-4 pt-5 pb-2 text-[11px] font-bold uppercase tracking-wider ${subText}`}>{label}</p>
            );
            const empty = (icon: React.ReactNode, text: string) => (
                <div className="flex flex-col items-center px-8 py-16 text-center">
                    <span className={`text-5xl ${theme ? "text-slate-600" : "text-slate-300"}`}>{icon}</span>
                    <p className={`mt-3 text-sm font-semibold ${theme ? "text-slate-300" : "text-slate-700"}`}>{text}</p>
                    <p className={`mt-1 text-xs ${subText}`}>
                        {mediaScope === "all" ? "Nothing shared in any of your chats yet." : "Nothing has been shared in this chat yet."}
                    </p>
                </div>
            );
            const chatLabel = (it: MediaItem) => (mediaScope === "all" && it.chat ? ` · ${it.chat}` : "");

            return (
                <div className={`${surface} flex min-h-full flex-col`}>
                    {/* Tabs */}
                    <div role="tablist" className={`sticky top-0 z-10 flex border-b ${theme ? "border-slate-700/80 bg-[#0E1626]" : "border-slate-200 bg-white"}`}>
                        {tabs.map((t) => {
                            const on = mediaTab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    role="tab"
                                    aria-selected={on}
                                    onClick={() => setMediaTab(t.id)}
                                    className={`relative flex-1 py-3 text-sm font-semibold transition-colors ${
                                        on ? (theme ? "text-white" : "text-slate-900") : subText
                                    }`}
                                >
                                    {t.label}
                                    {t.count > 0 && <span className="ml-1.5 text-[11px] opacity-70">{t.count}</span>}
                                    {on && <span className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: cv.accent }} />}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex-1 pb-4">
                        {mediaTab === "media" &&
                            (buckets.media.length === 0
                                ? empty(<IoImagesOutline className="mx-auto" />, "No media")
                                : groupByMonth(buckets.media, now).map(([label, list]) => (
                                    <div key={label}>
                                        {heading(label)}
                                        <div className="grid grid-cols-3 gap-1.5 px-3">
                                            {list.map((it) => {
                                                const data = loadFileData(it.msg.id);
                                                const priv = getShared(it.convKey).advPrivacy;
                                                return (
                                                    <button
                                                        key={`${it.convKey}-${it.msg.id}`}
                                                        type="button"
                                                        onClick={() => setLightbox({ items: buckets.media, index: buckets.media.indexOf(it) })}
                                                        aria-label={`Open ${it.msg.file?.name || "photo"}`}
                                                        className={`relative aspect-square overflow-hidden rounded-lg border ${theme ? "border-slate-700/70 bg-slate-900" : "border-slate-200 bg-slate-100"}`}
                                                    >
                                                        {data ? (
                                                            <img
                                                                src={data}
                                                                alt=""
                                                                loading="lazy"
                                                                draggable={false}
                                                                onContextMenu={priv ? (e) => e.preventDefault() : undefined}
                                                                className="h-full w-full object-cover transition-transform hover:scale-105"
                                                            />
                                                        ) : (
                                                            <span className={`flex h-full items-center justify-center text-[10px] ${subText}`}>Unavailable</span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )))}

                        {mediaTab === "docs" &&
                            (buckets.docs.length === 0
                                ? empty(<IoDocumentTextOutline className="mx-auto" />, "No documents")
                                : groupByMonth(buckets.docs, now).map(([label, list]) => (
                                    <div key={label}>
                                        {heading(label)}
                                        <div className="space-y-1 px-3">
                                            {list.map((it) => {
                                                const priv = getShared(it.convKey).advPrivacy;
                                                return (
                                                    <button
                                                        key={`${it.convKey}-${it.msg.id}`}
                                                        type="button"
                                                        onClick={() => downloadAttachment(it.msg)}
                                                        title={priv ? "Blocked by Advanced chat privacy" : "Download"}
                                                        className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left transition-colors ${theme ? "hover:bg-slate-800" : "hover:bg-slate-50"}`}
                                                    >
                                                        <span
                                                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl text-white"
                                                            style={{ background: cv.accentGradient }}
                                                        >
                                                            <IoDocumentTextOutline />
                                                        </span>
                                                        <span className="min-w-0 flex-1">
                                                            <span className={`block truncate text-sm font-semibold ${theme ? "text-slate-100" : "text-slate-800"}`}>
                                                                {it.msg.file?.name}
                                                            </span>
                                                            <span className={`block truncate text-xs ${subText}`}>
                                                                {fileExt(it.msg.file?.name || "")} · {formatBytes(it.msg.file?.size || 0)} · {formatDay(it.msg.time)}
                                                                {chatLabel(it)}
                                                            </span>
                                                        </span>
                                                        <span className={`shrink-0 text-lg ${subText}`}>{priv ? <IoLockClosedOutline /> : <IoDownloadOutline />}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )))}

                        {mediaTab === "links" &&
                            (buckets.links.length === 0
                                ? empty(<IoLinkOutline className="mx-auto" />, "No links")
                                : groupByMonth(buckets.links, now).map(([label, list]) => (
                                    <div key={label}>
                                        {heading(label)}
                                        <div className="space-y-1 px-3">
                                            {list.map((it) => (
                                                <a
                                                    key={it.key}
                                                    href={hrefOf(it.url)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left transition-colors ${theme ? "hover:bg-slate-800" : "hover:bg-slate-50"}`}
                                                >
                                                    <span
                                                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
                                                            theme ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"
                                                        }`}
                                                    >
                                                        <IoGlobeOutline />
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className={`block truncate text-sm font-semibold ${theme ? "text-slate-100" : "text-slate-800"}`}>
                                                            {hostOf(it.url)}
                                                        </span>
                                                        <span className="block truncate text-xs" style={{ color: cv.accent }}>
                                                            {it.url}
                                                        </span>
                                                        <span className={`block truncate text-[11px] ${subText}`}>
                                                            {it.msg.sender_suid === me.suid ? "You" : it.msg.sender_name} · {formatDay(it.msg.time)}
                                                            {chatLabel(it)}
                                                        </span>
                                                    </span>
                                                    <IoOpenOutline className={`shrink-0 text-base ${subText}`} />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )))}
                    </div>

                    <div className={`sticky bottom-0 border-t px-4 py-3 text-center ${theme ? "border-slate-700/80 bg-[#0E1626]" : "border-slate-200 bg-white"}`}>
                        <button
                            type="button"
                            onClick={() => setMediaScope((s) => (s === "chat" ? "all" : "chat"))}
                            className="inline-flex items-center gap-2 text-sm font-semibold"
                            style={{ color: cv.accent }}
                        >
                            <IoImagesOutline className="text-lg" />
                            {mediaScope === "chat" ? "View media from all chats" : "View media from this chat"}
                        </button>
                    </div>
                </div>
            );
        };

        /* ---------------- Info: advanced chat privacy ---------------- */
        const renderInfoPrivacy = () => {
            const bullet = (icon: React.ReactNode, text: string) => (
                <div className="flex items-start gap-5 px-6 py-3">
                    <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-[22px] ${subText}`}>{icon}</span>
                    <p className={`text-sm leading-snug ${theme ? "text-slate-100" : "text-slate-800"}`}>{text}</p>
                </div>
            );
            return (
                <div className={`${surface} min-h-full pb-8`}>
                    <div className="flex justify-center pt-10 pb-8">
                        <span className="relative flex h-24 w-28 items-center justify-center">
                            <span
                                className="flex h-20 w-24 items-center justify-center rounded-3xl rounded-tl-md text-white shadow-lg"
                                style={{ background: cv.accentGradient }}
                            >
                                <IoChatboxOutline className="text-5xl opacity-90" />
                            </span>
                            <span
                                className={`absolute -bottom-1 -right-1 flex h-12 w-12 items-center justify-center rounded-xl border-4 text-2xl text-white ${
                                    theme ? "border-[#0E1626]" : "border-white"
                                }`}
                                style={{ background: shared.advPrivacy ? "#16a34a" : "#64748b" }}
                            >
                                <IoLockClosedOutline />
                            </span>
                        </span>
                    </div>

                    <p className={`px-6 text-lg font-medium leading-snug ${theme ? "text-white" : "text-slate-900"}`}>
                        Limit how messages and media from this chat can be shared outside of Gurukul Community
                    </p>
                    <p className={`px-6 pt-5 text-sm leading-relaxed ${subText}`}>
                        {isGroup
                            ? "Messages in this group are visible only to its members and Super Admins, even if you don't turn on advanced chat privacy."
                            : "Messages in this chat are visible only to you and this contact, even if you don't turn on advanced chat privacy."}
                    </p>
                    <p className={`px-6 pt-5 pb-1 text-sm ${subText}`}>If you turn this on, people in this chat:</p>

                    {bullet(<IoImageOutline />, "Can't download photos or documents")}
                    {bullet(<IoChatboxOutline />, "Can't select or copy messages")}
                    {bullet(<IoDownloadOutline />, "Can't export the chat")}

                    <div className={`mx-6 mt-3 border-t ${theme ? "border-slate-700/80" : "border-slate-200"}`} />
                    <div className="px-2 pt-2">
                        <SettingRow
                            dark={theme}
                            icon={<span />}
                            title="Advanced chat privacy"
                            switchOn={shared.advPrivacy}
                            disabled={!canEditSettings}
                            onClick={togglePrivacy}
                            trailing={<Switch on={shared.advPrivacy} dark={theme} accent={cv.accent} />}
                        />
                    </div>
                    {!canEditSettings && (
                        <p className={`mx-6 mt-2 text-xs leading-relaxed ${subText}`}>Only admins can change this setting.</p>
                    )}
                </div>
            );
        };

        /* ---------------- Info: starred ---------------- */
        const renderInfoStarred = () => (
            <div className="py-3">
                {starredMessages.length === 0 ? (
                    <div className="flex flex-col items-center px-8 py-16 text-center">
                        <IoStarOutline className={`text-5xl ${theme ? "text-slate-600" : "text-slate-300"}`} />
                        <p className={`mt-3 text-sm font-semibold ${theme ? "text-slate-300" : "text-slate-700"}`}>No starred messages</p>
                        <p className={`mt-1 text-xs ${subText}`}>Hover over a message and click the star to save it here.</p>
                    </div>
                ) : (
                    starredMessages.map((m) => (
                        <div
                            key={m.id}
                            className={`mx-3 mb-2 flex items-start gap-3 rounded-xl border p-3 ${
                                theme ? "border-slate-700/70 bg-[#0E1626]" : "border-slate-200 bg-white"
                            }`}
                        >
                            <button type="button" onClick={() => jumpToMessage(m.id)} className="min-w-0 flex-1 text-left" title="Go to message">
                                <span className="flex items-center justify-between gap-2">
                                    <span className="truncate text-xs font-bold" style={{ color: cv.accent }}>
                                        {m.sender_suid === me.suid ? "You" : m.sender_name}
                                    </span>
                                    <span className={`shrink-0 text-[10px] font-medium ${subText}`}>
                                        {formatDay(m.time)} · {formatTime(m.time)}
                                    </span>
                                </span>
                                <span className={`mt-1 block line-clamp-4 whitespace-pre-wrap wrap-break-word text-sm ${theme ? "text-slate-200" : "text-slate-700"}`}>
                                    {previewOf(m)}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => toggleStar(m.id)}
                                aria-label="Remove star"
                                title="Remove star"
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${theme ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
                            >
                                <IoStar className="text-amber-400" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        );

        /* ---------------- Info: group permissions ---------------- */
        const sectionLabel = (text: string) => (
            <p className={`px-6 pt-5 pb-1 text-xs font-semibold ${subText}`}>{text}</p>
        );

        const permRow = (icon: React.ReactNode, titleText: string, subtitleText: string | undefined, on: boolean, onToggle: () => void) => (
            <SettingRow
                dark={theme}
                icon={icon}
                title={titleText}
                subtitle={subtitleText}
                switchOn={on}
                disabled={!meAdmin}
                onClick={onToggle}
                trailing={<Switch on={on} dark={theme} accent={cv.accent} />}
            />
        );

        const renderInfoPermissions = () => (
            <div className={`${surface} min-h-full pb-6`}>
                {sectionLabel("Members can:")}
                <div className="px-2">
                    {permRow(
                        <IoCreateOutline />,
                        "Edit group settings",
                        "This includes the disappearing message timer and Advanced chat privacy. When turned off, only admins can change them.",
                        shared.membersEditSettings,
                        () => setPermission({ membersEditSettings: !shared.membersEditSettings })
                    )}
                    {permRow(
                        <IoChatboxOutline />,
                        "Send new messages",
                        shared.onlyAdminsSend ? "Only admins can send messages" : undefined,
                        !shared.onlyAdminsSend,
                        () => setPermission({ onlyAdminsSend: !shared.onlyAdminsSend })
                    )}
                    {permRow(
                        <IoPersonAddOutline />,
                        "Add other members",
                        undefined,
                        shared.membersAdd,
                        () => setPermission({ membersAdd: !shared.membersAdd })
                    )}
                    {permRow(
                        <IoLinkOutline />,
                        "Invite via link",
                        undefined,
                        shared.membersInvite,
                        () => setPermission({ membersInvite: !shared.membersInvite })
                    )}
                    {permRow(
                        <IoTimeOutline />,
                        "Send message history",
                        "Past messages can be sent to new members.",
                        shared.sendHistory,
                        () => setPermission({ sendHistory: !shared.sendHistory })
                    )}
                </div>

                {sectionLabel("Admins can:")}
                <div className="px-2">
                    {permRow(
                        <IoShieldCheckmarkOutline />,
                        "Approve new members",
                        "When turned on, admins must approve anyone who wants to join this group using the invite link.",
                        shared.approveNew,
                        () => setPermission({ approveNew: !shared.approveNew })
                    )}
                </div>

                {sectionLabel("Group admins")}
                <div className="px-2">
                    <SettingRow
                        dark={theme}
                        icon={<IoPeopleOutline />}
                        title="Edit group admins"
                        subtitle={adminMembers.length ? adminMembers.map((m) => m.name).join(", ") : "No admins"}
                        onClick={() => setInfoView("admins")}
                        trailing={<IoChevronForward className={subText} />}
                    />
                </div>

                {!meAdmin && (
                    <p className={`mx-6 mt-4 rounded-xl border px-4 py-3 text-xs leading-relaxed ${theme ? "border-slate-700/70 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                        Only admins can change these permissions.
                    </p>
                )}
            </div>
        );

        /* ---------------- Info: edit group admins ---------------- */
        const renderInfoAdmins = () => (
            <div className={`${surface} min-h-full py-3`}>
                <p className={`px-6 pb-2 text-xs leading-relaxed ${subText}`}>
                    {meAdmin
                        ? "Admins can change group permissions, approve new members and always send messages. Super Admins are always admins."
                        : "Only admins can edit group admins."}
                </p>
                <div className="px-3 space-y-0.5">
                    {members.map((m) => {
                        const superAdmin = isSuperRole(m.role_code, m.name);
                        const isAdm = superAdmin || shared.admins.includes(String(m.suid));
                        const locked = superAdmin || !meAdmin;
                        return (
                            <button
                                key={m.suid}
                                type="button"
                                role="switch"
                                aria-checked={isAdm}
                                disabled={locked}
                                onClick={() => toggleAdmin(String(m.suid))}
                                className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed ${
                                    theme ? "enabled:hover:bg-slate-800" : "enabled:hover:bg-slate-50"
                                }`}
                            >
                                <PersonAvatar dark={theme} name={m.name} avatar={m.avatar} size={44} />
                                <span className="min-w-0 flex-1">
                                    <span className={`block truncate text-sm font-semibold ${theme ? "text-slate-100" : "text-slate-800"}`}>
                                        {m.name} {String(m.suid) === me.suid && <span className="font-normal opacity-60">(You)</span>}
                                    </span>
                                    <span className={`block truncate text-xs ${subText}`}>
                                        {superAdmin ? "Super Admin" : m.role_code || "Member"}
                                    </span>
                                </span>
                                <span className={locked ? "opacity-60" : ""}>
                                    <Switch on={isAdm} dark={theme} accent={cv.accent} />
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        );

        /* ---------------- Info: add members ---------------- */
        const renderInfoAddMembers = () => {
            const have = new Set(members.map((m) => String(m.suid)));
            const aq = addQuery.trim().toLowerCase();
            const candidates = otherUsers.filter(
                (u) => !have.has(u.suid) && (!aq || u.name.toLowerCase().includes(aq) || (u.role_code || "").toLowerCase().includes(aq))
            );
            return (
                <div className={`${surface} flex min-h-full flex-col`}>
                    <div className="px-4 pt-3 pb-2">
                        <div
                            className={`flex items-center gap-2.5 rounded-full px-4 py-2.5 ${theme ? "bg-slate-800/80" : "bg-slate-100"}`}
                        >
                            <IoSearchOutline className={subText} />
                            <input
                                autoFocus
                                value={addQuery}
                                onChange={(e) => setAddQuery(e.target.value)}
                                placeholder="Search people..."
                                className={`w-full bg-transparent text-sm outline-none ${theme ? "text-slate-100 placeholder:text-slate-500" : "text-slate-800 placeholder:text-slate-500"}`}
                            />
                        </div>
                        {!shared.sendHistory && (
                            <p className={`mt-2 px-1 text-xs ${subText}`}>New members will not see earlier messages.</p>
                        )}
                    </div>

                    <div className="flex-1 px-3 pb-2 space-y-0.5">
                        {candidates.map((u) => {
                            const sel = addSel.includes(u.suid);
                            return (
                                <button
                                    key={u.suid}
                                    type="button"
                                    role="checkbox"
                                    aria-checked={sel}
                                    onClick={() => setAddSel((cur) => (cur.includes(u.suid) ? cur.filter((x) => x !== u.suid) : [...cur, u.suid]))}
                                    className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left transition-colors ${theme ? "hover:bg-slate-800" : "hover:bg-slate-50"}`}
                                >
                                    <PersonAvatar dark={theme} name={u.name} avatar={u.avatar} size={44} superBadge={u.isSuper} />
                                    <span className="min-w-0 flex-1">
                                        <span className={`block truncate text-sm font-semibold ${theme ? "text-slate-100" : "text-slate-800"}`}>{u.name}</span>
                                        {u.role_code && <span className={`block truncate text-xs ${subText}`}>{u.role_code}</span>}
                                    </span>
                                    <CheckBox checked={sel} dark={theme} accent={cv.accent} />
                                </button>
                            );
                        })}
                        {candidates.length === 0 && (
                            <p className={`py-12 text-center text-xs ${subText}`}>
                                {aq ? "No people found" : "Everyone is already in this group"}
                            </p>
                        )}
                    </div>

                    <div className={`sticky bottom-0 border-t px-4 py-3 ${theme ? "border-slate-700/80 bg-[#0E1626]" : "border-slate-200 bg-white"}`}>
                        <button
                            onClick={confirmAddMembers}
                            disabled={!addSel.length}
                            className="w-full rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition-all active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-40"
                            style={{ background: cv.accentGradient }}
                        >
                            {addSel.length ? `Add ${addSel.length} member${addSel.length === 1 ? "" : "s"}` : "Select people to add"}
                        </button>
                    </div>
                </div>
            );
        };

        /* ---------------- Info: pending requests ---------------- */
        const renderInfoPending = () => (
            <div className={`${surface} min-h-full py-3`}>
                {shared.pending.length === 0 ? (
                    <p className={`px-8 py-16 text-center text-sm ${subText}`}>No pending requests</p>
                ) : (
                    <div className="px-3 space-y-1">
                        {shared.pending.map((id) => {
                            const u = directory.find((d) => d.suid === id);
                            const name = u?.name || `User ${id}`;
                            return (
                                <div key={id} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                                    <PersonAvatar dark={theme} name={name} avatar={u?.avatar} size={44} />
                                    <span className="min-w-0 flex-1">
                                        <span className={`block truncate text-sm font-semibold ${theme ? "text-slate-100" : "text-slate-800"}`}>{name}</span>
                                        <span className={`block truncate text-xs ${subText}`}>Wants to join via invite link</span>
                                    </span>
                                    <button
                                        onClick={() => rejectRequest(id)}
                                        aria-label={`Reject ${name}`}
                                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                                            theme ? "border-slate-700 text-slate-200 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-100"
                                        }`}
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => {
                                            addMembersToGroup([id], true);
                                            toast.success(`${name} added`);
                                        }}
                                        aria-label={`Approve ${name}`}
                                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                                        style={{ background: cv.accentGradient }}
                                    >
                                        Approve
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );

        const infoTitle =
            infoView === "starred"
                ? "Starred messages"
                : infoView === "permissions"
                    ? "Group permissions"
                    : infoView === "admins"
                        ? "Edit group admins"
                        : infoView === "addMembers"
                            ? "Add members"
                            : infoView === "pending"
                                ? "Pending requests"
                                : infoView === "privacy"
                                    ? "Advanced chat privacy"
                                    : infoView === "media"
                                        ? "Media, links and docs"
                                        : isGroup
                                            ? "Group info"
                                            : "Contact info";

        return (
            <div className="flex flex-1 min-w-0 min-h-0">
                <style>{`
                    @keyframes gkInfoIn {
                        from { opacity: 0; transform: translateX(24px); }
                        to { opacity: 1; transform: translateX(0); }
                    }
                    @keyframes gkDialogIn {
                        from { opacity: 0; transform: translateY(8px) scale(.97); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    @keyframes gkAvatarRing {
                        0% { box-shadow: 0 0 0 0 ${cv.accent}66; }
                        100% { box-shadow: 0 0 0 12px ${cv.accent}00; }
                    }
                    /* Header avatar hover animation (no background on the header itself) */
                    .gk-hd-avatar {
                        border-radius: 9999px;
                        transition: transform .35s cubic-bezier(.34, 1.56, .64, 1);
                    }
                    .gk-hd-btn:hover .gk-hd-avatar,
                    .gk-hd-btn:focus-visible .gk-hd-avatar {
                        transform: scale(1.12) rotate(-6deg);
                        animation: gkAvatarRing 1.1s ease-out infinite;
                    }
                    .gk-hd-btn:active .gk-hd-avatar {
                        transform: scale(.96);
                    }
                    .chat-themed-input:focus {
                        border-color: ${cv.accent};
                        box-shadow: 0 0 0 2px ${cv.accent}33;
                    }
                    .chat-sidebar-row:not(:disabled):hover {
                        background-color: ${cv.accent}12;
                    }
                    @media (prefers-reduced-motion: reduce) {
                        .gk-hd-btn:hover .gk-hd-avatar,
                        .gk-hd-btn:focus-visible .gk-hd-avatar { animation: none; transform: none; }
                    }
                `}</style>

                {/* Chat Section */}
                <section className="relative flex-1 min-w-0 min-h-0 h-full flex flex-col overflow-clip">
                    <div
                        className="h-0.5 shrink-0"
                        style={{ backgroundImage: `linear-gradient(to right, transparent, ${cv.accent}, transparent)` }}
                    />
                    <header
                        className={`shrink-0 px-3 md:px-5 py-3 flex items-center gap-3 border-b
                        ${theme ? "bg-[#0E1626] border-slate-700/80" : "bg-white border-slate-200"}`}
                        style={{ backgroundImage: `linear-gradient(${cv.headerTint}, ${cv.headerTint})` }}
                    >
                        <button
                            onClick={closeChat}
                            aria-label="Back to chats"
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full md:hidden ${theme ? "text-slate-200 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"}`}
                        >
                            <IoArrowBack className="text-xl" />
                        </button>

                        {/* Group name / avatar (click => info, like WhatsApp). Hover animates only the avatar. */}
                        <button
                            type="button"
                            onClick={() => {
                                setInfoView("main");
                                setInfoOpen(true);
                            }}
                            title={isGroup ? "Group info" : "Contact info"}
                            aria-label={isGroup ? "Open group info" : "Open contact info"}
                            className="gk-hd-btn flex min-w-0 flex-1 items-center gap-3 bg-transparent py-1 text-left outline-none"
                        >
                            <span className="gk-hd-avatar inline-flex shrink-0">
                                {isGroup ? (
                                    <GroupAvatar dark={theme} name={title} size={44} />
                                ) : (
                                    <PersonAvatar dark={theme} name={title} avatar={activePeer?.avatar} size={44} superBadge={activePeer?.isSuper} online />
                                )}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className={`block truncate text-base font-bold tracking-tight ${theme ? "text-white" : "text-slate-900"}`}>{title}</span>
                                <span className={`block truncate text-[11px] font-medium ${subText}`}>{subtitle}</span>
                            </span>
                        </button>
                    </header>

                    {/* Messages */}
                    <div
                        ref={messagesRef}
                        onScroll={onMessagesScroll}
                        onCopy={shared.advPrivacy ? (e) => e.preventDefault() : undefined}
                        onCut={shared.advPrivacy ? (e) => e.preventDefault() : undefined}
                        className={`flex-1 min-h-0 overflow-y-auto px-4 md:px-8 py-6 space-y-3 ${shared.advPrivacy ? "select-none" : ""} ${HIDE_SCROLL}`}
                        style={cv.wallpaper}
                    >
                        {(shared.ttl > 0 || shared.advPrivacy) && (
                            <div className="flex flex-wrap justify-center gap-2">
                                {shared.ttl > 0 && (
                                    <span
                                        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold shadow-sm"
                                        style={{ background: cv.chip.background, color: cv.chip.color, borderColor: cv.chip.border }}
                                    >
                                        <IoTimerOutline /> Disappearing messages · {ttlLabel(shared.ttl)}
                                    </span>
                                )}
                                {shared.advPrivacy && (
                                    <span
                                        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold shadow-sm"
                                        style={{ background: cv.chip.background, color: cv.chip.color, borderColor: cv.chip.border }}
                                    >
                                        <IoShieldCheckmarkOutline /> Advanced chat privacy is on
                                    </span>
                                )}
                            </div>
                        )}

                        {hasEarlier && (
                            <div className="flex justify-center">
                                <button
                                    onClick={loadEarlier}
                                    className="rounded-full border px-4 py-1.5 text-xs font-semibold shadow-sm"
                                    style={{ background: cv.chip.background, color: cv.chip.color, borderColor: cv.chip.border }}
                                >
                                    Load earlier messages
                                </button>
                            </div>
                        )}

                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                                <LogoTile dark={theme} size={72} />
                                <p className={`text-lg font-bold tracking-tight ${theme ? "text-slate-200" : "text-slate-800"}`}>{title}</p>
                                <p className={`text-xs max-w-xs ${subText}`}>
                                    There are no messages yet. Send a message first and start the conversation.
                                </p>
                            </div>
                        )}

                        {rows.map((r) => (
                            <MessageRow
                                key={r.m.id}
                                m={r.m}
                                day={r.day}
                                mine={r.mine}
                                sameSender={r.sameSender}
                                showName={r.showName}
                                nameColor={r.nameColor}
                                avatar={r.avatar}
                                dark={theme}
                                cv={cv}
                                starred={starredSet.has(r.m.id)}
                                highlight={highlightId === r.m.id}
                                privacy={shared.advPrivacy}
                                onStar={toggleStar}
                                onOpenMedia={openMediaFromChat}
                                onDownload={downloadAttachment}
                            />
                        ))}
                    </div>

                    {/* Footer / Input */}
                    <footer
                        className={`shrink-0 px-3 md:px-5 py-3 border-t ${theme ? "bg-[#0E1626] border-slate-700/80" : "bg-white border-slate-200"}`}
                        style={{ backgroundImage: `linear-gradient(${cv.headerTint}, ${cv.headerTint})` }}
                    >
                        {canSend ? (
                            <Composer key={convKey} dark={theme} cv={cv} meName={me.name} onSend={sendMessage} />
                        ) : (
                            <div className={`flex items-center justify-center gap-2 py-3 text-xs font-medium ${subText}`}>
                                <IoLockClosedOutline className="text-base" />
                                {adminBlocked ? "Only admins can send messages" : "You are not a member of this group"}
                            </div>
                        )}
                    </footer>

                    {/* ---------------- Group / Contact info (inside the chat) ---------------- */}
                    {infoOpen && (
                        <div
                            className={`absolute inset-0 z-30 flex flex-col ${theme ? "bg-[#0B1120] text-slate-100" : "bg-[#F8FAFC] text-slate-900"}`}
                            style={{ animation: "gkInfoIn .22s cubic-bezier(.2,.8,.2,1)" }}
                        >
                            <div
                                className="h-0.5 shrink-0"
                                style={{ backgroundImage: `linear-gradient(to right, transparent, ${cv.accent}, transparent)` }}
                            />
                            <div className={`flex shrink-0 items-center gap-3 border-b px-3 md:px-5 py-3 ${theme ? "border-slate-700/80 bg-[#0E1626]" : "border-slate-200 bg-white"}`}>
                                <button
                                    onClick={() => (infoView === "main" ? setInfoOpen(false) : setInfoView(infoBack(infoView)))}
                                    aria-label={infoView === "main" ? "Close" : "Back"}
                                    className={`flex h-9 w-9 items-center justify-center rounded-full ${theme ? "text-slate-200 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"}`}
                                >
                                    {infoView === "main" ? <IoClose className="text-xl" /> : <IoArrowBack className="text-xl" />}
                                </button>
                                <h3 className="text-base font-bold tracking-tight">{infoTitle}</h3>
                            </div>

                            <div className={`flex-1 min-h-0 overflow-y-auto ${HIDE_SCROLL}`}>
                                {infoView === "starred"
                                    ? renderInfoStarred()
                                    : infoView === "permissions"
                                        ? renderInfoPermissions()
                                        : infoView === "admins"
                                            ? renderInfoAdmins()
                                            : infoView === "addMembers"
                                                ? renderInfoAddMembers()
                                                : infoView === "pending"
                                                    ? renderInfoPending()
                                                    : infoView === "privacy"
                                                        ? renderInfoPrivacy()
                                                        : infoView === "media"
                                                            ? renderInfoMedia()
                                                            : renderInfoMain()}
                            </div>
                        </div>
                    )}

                    {/* Dialogs (mute, disappearing, encryption, clear, delete) */}
                    {renderDialog()}

                    {/* Photo viewer (above everything inside the chat) */}
                    {renderLightbox()}

                    {/* Theme picker is rendered AFTER the info panel so it always opens on top of it */}
                    <ChatThemePicker
                        open={themePickerOpen && themeConversationKey === convKey}
                        dark={theme}
                        selectedId={preference.id}
                        applyToAll={preference.applyToAll}
                        onSelect={(id) => {
                            setChatThemeId(id);
                            persistChatTheme(id, preference.applyToAll);
                        }}
                        onApplyToAllChange={(applyToAll) => {
                            setApplyThemeToAll(applyToAll);
                            persistChatTheme(preference.id, applyToAll);
                        }}
                        onReset={() => {
                            setChatThemeId(DEFAULT_CHAT_THEME_ID);
                            persistChatTheme(DEFAULT_CHAT_THEME_ID, preference.applyToAll);
                        }}
                        onClose={() => setThemePickerOpen(false)}
                    />
                </section>
            </div>
        );
    };

    /* -------------------------------------------------------------------------- */
    /*  New message modal                                                          */
    /* -------------------------------------------------------------------------- */
    const renderNewMessage = () => {
        if (!newOpen) return null;
        const nq = newSearch.trim().toLowerCase();
        const list = otherUsers.filter(
            (u) => !nq || u.name.toLowerCase().includes(nq) || (u.role_code || "").toLowerCase().includes(nq)
        );

        return (
            <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                <div
                    onClick={() => setNewOpen(false)}
                    className={`absolute inset-0 ${theme ? "bg-black/70" : "bg-slate-900/40"}`}
                />
                <div
                    className={`relative flex h-[min(70vh,560px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border shadow-2xl
                    ${theme ? "border-slate-700 bg-[#0E1626] text-slate-100" : "border-slate-200 bg-white text-slate-900"}`}
                >
                    <div className={`flex shrink-0 items-center justify-between border-b px-4 py-3 ${theme ? "border-slate-700/80" : "border-slate-200"}`}>
                        <span className="w-8" />
                        <h3 className="text-sm font-bold">New message</h3>
                        <button
                            onClick={() => setNewOpen(false)}
                            aria-label="Close"
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${theme ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
                        >
                            <IoClose className="text-xl" />
                        </button>
                    </div>

                    <div className={`flex shrink-0 items-center gap-2.5 border-b px-4 py-2.5 ${theme ? "border-slate-700/80" : "border-slate-200"}`}>
                        <IoSearchOutline className={theme ? "text-slate-400" : "text-slate-500"} />
                        <input
                            autoFocus
                            value={newSearch}
                            onChange={(e) => setNewSearch(e.target.value)}
                            placeholder="Search people..."
                            className={`w-full bg-transparent text-sm outline-none ${theme ? "placeholder:text-slate-500" : "placeholder:text-slate-400"}`}
                        />
                    </div>

                    <div className={`flex-1 min-h-0 overflow-y-auto py-1 ${HIDE_SCROLL}`}>
                        {list.map((u) => (
                            <button
                                key={u.suid}
                                onClick={() => openDirectChat(u.suid)}
                                className={`flex w-full items-center gap-3.5 px-4 py-2.5 text-left transition-colors ${theme ? "hover:bg-slate-800/60" : "hover:bg-slate-50"}`}
                            >
                                <PersonAvatar dark={theme} name={u.name} avatar={u.avatar} size={44} superBadge={u.isSuper} />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-semibold">{u.name}</span>
                                    {u.role_code && (
                                        <span className={`block truncate text-xs ${theme ? "text-slate-400" : "text-slate-500"}`}>{u.role_code}</span>
                                    )}
                                </span>
                            </button>
                        ))}
                        {list.length === 0 && (
                            <p className={`py-10 text-center text-xs ${theme ? "text-slate-400" : "text-slate-500"}`}>No members found</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    /* -------------------------------------------------------------------------- */
    /*  Page                                                                       */
    /* -------------------------------------------------------------------------- */
    return (
        <div
            className={`flex h-[calc(100vh-9rem)] min-h-130 w-full overflow-hidden rounded-3xl border transition-colors duration-500
            ${theme
                    ? "border-slate-700/80 bg-[#0B1120] text-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
                    : "border-slate-200 bg-white text-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.1)]"
                }`}
        >
            {renderChat()}
            {renderLeftPanel()}
            {renderNewMessage()}
        </div>
    );
}
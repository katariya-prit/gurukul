/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from "sonner";
import { getChatTheme } from "../../../../components/chat/chatThemes";
import {
    CHAT_THEME_DEFAULT_KEY,
    DEFAULT_META,
    DEFAULT_SHARED,
    EMPTY_MESSAGES,
} from "../constants";
import type { ChatMessage, ConvMeta, SharedSettings } from "../types";

export const storageKey = (convKey: string) => `gurukul_chat_${convKey}`;
export const chatThemeStorageKey = (convKey: string) => `gurukul_chat_theme_${convKey}`;
export const readStorageKey = (convKey: string) => `gurukul_chat_read_${convKey}`;
export const metaKey = (suid: string, convKey: string) => `gurukul_chat_meta_${suid}__${convKey}`;
export const sharedKey = (convKey: string) => `gurukul_chat_shared_${convKey}`;
export const fileKey = (msgId: string) => `gurukul_chat_file_${msgId}`;
export const dmKey = (a: string, b: string) => `dm_${[a, b].sort().join("__")}`;

export const generateUUID = (): string => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

export const jsonCache = new Map<string, any>();

export const readJson = <T,>(key: string, fallback: T): T => {
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

export const writeJson = (key: string, value: unknown, silent = false): boolean => {
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

export const removeKey = (key: string) => {
    jsonCache.delete(key);
    try {
        localStorage.removeItem(key);
    } catch {
        /* ignore */
    }
};

export const loadChatThemeValue = (key: string): string | null => {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
};

export const saveChatThemeValue = (key: string, value: string): boolean => {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch {
        toast.error("Chat theme could not be saved");
        return false;
    }
};

export const removeChatThemeValue = (key: string): boolean => {
    try {
        localStorage.removeItem(key);
        return true;
    } catch {
        toast.error("Chat theme could not be reset");
        return false;
    }
};

export const resolveStoredChatTheme = (convKey: string) => {
    const perChatTheme = loadChatThemeValue(chatThemeStorageKey(convKey));
    const defaultTheme = loadChatThemeValue(CHAT_THEME_DEFAULT_KEY);
    return {
        id: getChatTheme(perChatTheme ?? defaultTheme).id,
        applyToAll: !perChatTheme && !!defaultTheme,
    };
};

export const areMessagesMatching = (a: ChatMessage, b: ChatMessage): boolean => {
    if (!a || !b) return false;
    const aId = a.id ? String(a.id).trim() : "";
    const bId = b.id ? String(b.id).trim() : "";
    const aClientId = a.client_id ? String(a.client_id).trim() : "";
    const bClientId = b.client_id ? String(b.client_id).trim() : "";

    if (aId && bId && aId === bId) return true;
    if (aClientId && bClientId && aClientId === bClientId) return true;
    if (aClientId && bId && aClientId === bId) return true;
    if (aId && bClientId && aId === bClientId) return true;

    const aSender = String(a.sender_suid || "").trim();
    const bSender = String(b.sender_suid || "").trim();
    const aText = (a.text || "").trim();
    const bText = (b.text || "").trim();

    if (aSender && bSender && aSender === bSender && aText && bText && aText === bText) {
        const aTime = Date.parse(a.time);
        const bTime = Date.parse(b.time);
        if (!isNaN(aTime) && !isNaN(bTime)) {
            if (Math.abs(aTime - bTime) < 300000) {
                return true;
            }
        } else {
            return true;
        }
    }
    return false;
};

export const deduplicateMessages = (list: ChatMessage[]): ChatMessage[] => {
    if (!Array.isArray(list) || list.length === 0) return EMPTY_MESSAGES;
    const clean: ChatMessage[] = [];

    for (const msg of list) {
        if (!msg) continue;
        // Purge dummy preview messages
        if (msg.id && typeof msg.id === "string" && msg.id.startsWith("server_")) continue;

        const matchIdx = clean.findIndex((existing) => areMessagesMatching(existing, msg));
        if (matchIdx >= 0) {
            const existing = clean[matchIdx];
            // Prefer server / numeric ID over temporary UUID
            const isMsgServerId = msg.id && /^\d+$/.test(msg.id);
            const isExistingServerId = existing.id && /^\d+$/.test(existing.id);
            const preferredId = isMsgServerId ? msg.id : isExistingServerId ? existing.id : msg.id || existing.id;
            const preferredClientId = msg.client_id || existing.client_id;

            clean[matchIdx] = {
                ...existing,
                ...msg,
                id: preferredId,
                client_id: preferredClientId,
                file: msg.file || existing.file,
            };
        } else {
            clean.push(msg);
        }
    }

    return clean;
};

export const loadMessages = (convKey: string): ChatMessage[] => {
    const raw = readJson<ChatMessage[]>(storageKey(convKey), EMPTY_MESSAGES);
    if (!Array.isArray(raw)) return EMPTY_MESSAGES;
    const clean = deduplicateMessages(raw);
    if (clean.length !== raw.length) {
        writeJson(storageKey(convKey), clean, true);
    }
    return clean;
};

export const saveMessage = (msg: ChatMessage, silent = false): boolean => {
    if (!msg || !msg.conv_key) return false;
    // Don't save dummy server preview messages
    if (msg.id && typeof msg.id === "string" && msg.id.startsWith("server_")) return true;

    const list = loadMessages(msg.conv_key);
    const existingIndex = list.findIndex((m) => areMessagesMatching(m, msg));

    if (existingIndex >= 0) {
        const updated = [...list];
        const existing = updated[existingIndex];
        const isMsgServerId = msg.id && /^\d+$/.test(msg.id);
        const isExistingServerId = existing.id && /^\d+$/.test(existing.id);
        const preferredId = isMsgServerId ? msg.id : isExistingServerId ? existing.id : msg.id || existing.id;

        updated[existingIndex] = {
            ...existing,
            ...msg,
            id: preferredId,
            client_id: msg.client_id || existing.client_id,
            file: msg.file || existing.file,
        };
        const finalClean = deduplicateMessages(updated);
        return writeJson(storageKey(msg.conv_key), finalClean, silent);
    }
    const finalClean = deduplicateMessages([...list, msg]);
    return writeJson(storageKey(msg.conv_key), finalClean, silent);
};

export const syncRemotePeerMessages = (convKey: string, remoteList: ChatMessage[]): void => {
    if (!convKey || !Array.isArray(remoteList)) return;
    const local = loadMessages(convKey);
    const result: ChatMessage[] = [];

    // First take server messages (server is source of truth)
    remoteList.forEach((rm) => {
        if (rm.id && typeof rm.id === "string" && rm.id.startsWith("server_")) return;
        const item: ChatMessage = { ...rm, conv_key: convKey };
        const matchIdx = result.findIndex((existing) => areMessagesMatching(existing, item));
        if (matchIdx >= 0) {
            result[matchIdx] = {
                ...result[matchIdx],
                ...item,
                id: item.id || result[matchIdx].id,
                client_id: item.client_id || result[matchIdx].client_id,
            };
        } else {
            result.push(item);
        }
    });

    // Then keep local messages only if they are not already on server
    local.forEach((lm) => {
        if (lm.id && typeof lm.id === "string" && lm.id.startsWith("server_")) return;
        if (!lm.conv_key || lm.conv_key === convKey) {
            const matchIdx = result.findIndex((existing) => areMessagesMatching(existing, lm));
            if (matchIdx >= 0) {
                // Merge in any local attachment if present
                if (lm.file && !result[matchIdx].file) {
                    result[matchIdx].file = lm.file;
                }
            } else {
                result.push({ ...lm, conv_key: convKey });
            }
        }
    });

    result.sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
    const finalClean = deduplicateMessages(result);
    writeJson(storageKey(convKey), finalClean, true);
};

/** Attachment data (data URL) of a message – stored separately so the message list stays light. */
export const loadFileData = (msgId: string): string | null => {
    const v = readJson<string | null>(fileKey(msgId), null);
    return typeof v === "string" ? v : null;
};

/* ---- unread tracking (last-read timestamp per conversation) ---- */
export const getLastRead = (convKey: string): number => Number(readJson<number>(readStorageKey(convKey), 0)) || 0;

export const markRead = (convKey: string) => {
    writeJson(readStorageKey(convKey), Date.now());
};

/* ---- per conversation settings ---- */
export const getMeta = (suid: string, convKey: string): ConvMeta => ({
    ...DEFAULT_META,
    ...readJson<Partial<ConvMeta>>(metaKey(suid, convKey), {}),
});

export const getShared = (convKey: string): SharedSettings => ({
    ...DEFAULT_SHARED,
    ...readJson<Partial<SharedSettings>>(sharedKey(convKey), {}),
});

export const isMuted = (until: number, now: number) => until === -1 || until > now;

/** Messages the current user is allowed to see (after "clear chat", disappearing timers and member history). */
export const getVisibleMessages = (
    convKey: string,
    suid: string,
    now: number,
    source?: ChatMessage[]
): ChatMessage[] => {
    const rawList = source ?? loadMessages(convKey);
    if (!rawList.length) return EMPTY_MESSAGES;
    const list = deduplicateMessages(rawList);
    const meta = getMeta(suid, convKey);
    const shared = getShared(convKey);
    const historyFrom = shared.historyFrom?.[suid] ?? 0;
    return list.filter((m) => {
        if (m.conv_key && m.conv_key !== convKey) return false;
        const t = Date.parse(m.time);
        if (t <= meta.clearedAt) return false;
        if (t < historyFrom) return false;
        if (shared.ttl > 0 && t >= shared.ttlSince && now - t > shared.ttl) return false;
        return true;
    });
};

/** Physically remove messages (and their files) whose disappearing timer expired. */
export const purgeExpired = (convKey: string, now: number) => {
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

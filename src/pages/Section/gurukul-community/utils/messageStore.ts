import type { ChatMessage } from "../types";
import type { Reads } from "../messageTypes";
import { getMeta, getVisibleMessages, jsonCache, writeJson } from "./storage";

const listKey = (convKey: string) => `gurukul_chat_${convKey}`;
const readsKey = (convKey: string) => `gurukul_chat_reads_${convKey}`;
const peerReadKey = (convKey: string) => `gurukul_chat_peerread_${convKey}`;

export type PeerRead = { upTo: number; at: number };

const readCached = <T,>(key: string, fallback: T): T => {
    if (jsonCache.has(key)) return jsonCache.get(key) as T;
    let v: T = fallback;
    try {
        const raw = localStorage.getItem(key);
        if (raw !== null) v = JSON.parse(raw) as T;
    } catch {
        v = fallback;
    }
    jsonCache.set(key, v);
    return v;
};

/** Change one stored message (reactions, delete for everyone ...). */
export const updateMessage = (convKey: string, id: string, fn: (m: ChatMessage) => ChatMessage): boolean => {
    const list = readCached<ChatMessage[]>(listKey(convKey), []);
    if (!Array.isArray(list) || !list.some((m) => m.id === id)) return false;
    return writeJson(listKey(convKey), list.map((m) => (m.id === id ? fn(m) : m)), true);
};

export const applyRemoteReactions = (
    convKey: string,
    ref: { id?: string; clientId?: string },
    reactions: Record<string, string> | undefined
): boolean => {
    const list = readCached<ChatMessage[]>(listKey(convKey), []);
    if (!Array.isArray(list)) return false;
    const index = list.findIndex(
        (message) =>
            message.id === ref.id ||
            (!!ref.clientId && (message.client_id === ref.clientId || message.id === ref.clientId))
    );
    if (index < 0) return false;

    const normalized = reactions && Object.keys(reactions).length ? reactions : undefined;
    if (JSON.stringify(list[index].reactions) === JSON.stringify(normalized)) return false;

    const next = [...list];
    next[index] = { ...next[index], reactions: normalized };
    return writeJson(listKey(convKey), next, true);
};

/* ---- read receipts ---- */
export const EMPTY_READS: Reads = {};

export const getReads = (convKey: string): Reads => {
    const v = readCached<Reads>(readsKey(convKey), EMPTY_READS);
    return v && typeof v === "object" ? v : EMPTY_READS;
};

export const getPeerRead = (convKey: string): PeerRead | null => {
    const value = readCached<PeerRead | null>(peerReadKey(convKey), null);
    if (!value || !Number.isFinite(value.upTo) || value.upTo <= 0 || !Number.isFinite(value.at)) return null;
    return value;
};

export const setPeerRead = (convKey: string, upTo: number, at: number): boolean => {
    if (!Number.isFinite(upTo) || upTo <= 0) return false;
    const current = getPeerRead(convKey);
    if (current && upTo <= current.upTo) return false;
    const timestamp = Number.isFinite(at) ? at : Date.now();
    return writeJson(peerReadKey(convKey), { upTo, at: timestamp }, true);
};

/** Remember the moment `suid` read the messages of other people. Returns true when something changed. */
export const recordReads = (convKey: string, suid: string, list: ChatMessage[]): boolean => {
    const cur = getReads(convKey);
    let next: Reads | null = null;
    const t = Date.now();
    list.forEach((m) => {
        if (m.sender_suid === suid || m.deleted) return;
        if (cur[m.id]?.[suid]) return;
        if (!next) next = { ...cur };
        next[m.id] = { ...(next[m.id] || {}), [suid]: t };
    });
    if (!next) return false;
    return writeJson(readsKey(convKey), next, true);
};

/** Same as getVisibleMessages, plus the messages the user removed with "Delete for me". */
export const getVisibleMessagesPlus = (convKey: string, suid: string, now: number, source?: ChatMessage[]): ChatMessage[] => {
    const list = getVisibleMessages(convKey, suid, now, source);
    const hidden = getMeta(suid, convKey).hiddenIds;
    if (!hidden || !hidden.length) return list;
    const set = new Set(hidden);
    return list.filter((m) => !set.has(m.id));
};
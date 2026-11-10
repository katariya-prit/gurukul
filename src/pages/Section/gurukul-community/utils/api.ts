/* eslint-disable @typescript-eslint/no-explicit-any */
import { AUTH_TOKEN_STORAGE_KEYS, CHAT_API_BASE } from "../constants";
export { CHAT_API_BASE } from "../constants";
import type { ChatMessage } from "../types";

export const authHeaders = (): Record<string, string> => {
    for (const k of AUTH_TOKEN_STORAGE_KEYS) {
        const t = localStorage.getItem(k);
        if (t) return { Authorization: `Bearer ${t.replace(/^Bearer\s+/i, "")}` };
    }
    return {};
};

export const toMessage = (convKey: string, m: any): ChatMessage => ({
    id: String(m.id ?? m.message_id ?? `${m.created_at}-${m.sender_suid}`),
    client_id: m.client_id ? String(m.client_id) : undefined,
    conv_key: convKey,
    sender_suid: String(m.sender_suid ?? m.sender_id ?? m.suid),
    sender_name: String(m.sender_name ?? m.name ?? ""),
    text: String(m.text ?? m.body ?? m.message_text ?? m.message ?? ""),
    time: String(m.time ?? m.created_at ?? new Date().toISOString()),
    deleted: Boolean(m.deleted),
});

export const lookupUserBySuid = async (suid: string): Promise<{ suid: string; name: string; avatar: string | null; role_code?: string } | null> => {
    if (!CHAT_API_BASE || !suid) return null;
    try {
        const res = await fetch(`${CHAT_API_BASE}/chat/users/lookup/${encodeURIComponent(suid)}`, {
            headers: authHeaders(),
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json.success && json.data ? json.data : null;
    } catch {
        return null;
    }
};

export const fetchContacts = async (): Promise<any[] | null> => {
    if (!CHAT_API_BASE) return null;
    try {
        const res = await fetch(`${CHAT_API_BASE}/chat/contacts`, {
            headers: authHeaders(),
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json.success && Array.isArray(json.data) ? json.data : null;
    } catch {
        return null;
    }
};

export const saveContact = async (userId: string, nickname?: string): Promise<boolean> => {
    if (!CHAT_API_BASE || !userId) return false;
    try {
        const res = await fetch(`${CHAT_API_BASE}/chat/contacts`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify({ user_id: userId, nickname }),
        });
        return res.ok;
    } catch {
        return false;
    }
};

export const fetchConversations = async (): Promise<any[] | null> => {
    if (!CHAT_API_BASE) return null;
    try {
        const res = await fetch(`${CHAT_API_BASE}/chat/conversations`, {
            headers: authHeaders(),
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json.success && Array.isArray(json.data) ? json.data : null;
    } catch {
        return null;
    }
};

export const sendDirectMessage = async (toUserId: string, body: string, clientId: string): Promise<any | null> => {
    if (!CHAT_API_BASE || !toUserId || !body) return null;
    try {
        const res = await fetch(`${CHAT_API_BASE}/chat/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify({ to_user_id: toUserId, body, client_id: clientId }),
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json.success && json.data ? json.data : null;
    } catch {
        return null;
    }
};

export const fetchPeerMessages = async (peerId: string): Promise<ChatMessage[] | null> => {
    if (!CHAT_API_BASE || !peerId) return null;
    try {
        const res = await fetch(`${CHAT_API_BASE}/chat/peer/${encodeURIComponent(peerId)}/messages`, {
            headers: authHeaders(),
        });
        if (!res.ok) return null;
        const json = await res.json();
        const arr = Array.isArray(json) ? json : json?.data;
        return Array.isArray(arr) ? arr.map((m: any) => toMessage("", m)) : null;
    } catch {
        return null;
    }
};

export const fetchRemoteMessages = async (convKey: string): Promise<ChatMessage[] | null> => {
    if (!CHAT_API_BASE) return null;
    try {
        const res = await fetch(`${CHAT_API_BASE}/chat/${encodeURIComponent(convKey)}/messages`, {
            headers: authHeaders(),
        });
        if (!res.ok) return null;
        const json = await res.json();
        const arr = Array.isArray(json) ? json : json?.data;
        return Array.isArray(arr) ? arr.map((m: any) => toMessage(convKey, m)) : null;
    } catch {
        return null;
    }
};

export const postRemoteMessage = async (convKey: string, text: string, clientId?: string): Promise<any | null> => {
    if (!CHAT_API_BASE) return true;
    try {
        const res = await fetch(`${CHAT_API_BASE}/chat/${encodeURIComponent(convKey)}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify({ text, client_id: clientId }),
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json.success ? (json.data ?? json) : null;
    } catch {
        return null;
    }
};

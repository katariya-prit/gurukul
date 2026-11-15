/* eslint-disable @typescript-eslint/no-explicit-any */
import { CHAT_API_BASE } from "../constants";
export { CHAT_API_BASE } from "../constants";
import type { ChatMessage } from "../types";

export type PeerReadMeta = {
    conversation_id: string;
    my_last_read_message_id: string | null;
    peer_last_read_message_id: string | null;
    peer_last_read_at: string | null;
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
    reactions: m.reactions && typeof m.reactions === "object" && !Array.isArray(m.reactions)
        ? (m.reactions as Record<string, string>)
        : undefined,
});

export type ReactionResult = { ok: true; reactions: Record<string, string> } | { ok: false; status: number };

export const setReactionRemote = async (p: {
    convKey: string;
    messageId?: string;
    clientId?: string;
    emoji: string | null;
}): Promise<ReactionResult> => {
    if (!CHAT_API_BASE) return { ok: false, status: 0 };
    try {
        const res = await fetch(`${CHAT_API_BASE}/chat/reactions`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                conv_key: p.convKey,
                ...(p.messageId !== undefined ? { message_id: p.messageId } : {}),
                ...(p.clientId !== undefined ? { client_id: p.clientId } : {}),
                emoji: p.emoji,
            }),
        });
        if (!res.ok) return { ok: false, status: res.status };
        const json: unknown = await res.json();
        if (
            typeof json === "object" &&
            json !== null &&
            "success" in json &&
            json.success === true &&
            "data" in json &&
            typeof json.data === "object" &&
            json.data !== null &&
            "reactions" in json.data &&
            typeof json.data.reactions === "object" &&
            json.data.reactions !== null &&
            !Array.isArray(json.data.reactions)
        ) {
            return { ok: true, reactions: json.data.reactions as Record<string, string> };
        }
        return { ok: false, status: res.status };
    } catch {
        return { ok: false, status: 0 };
    }
};

export const lookupUserBySuid = async (suid: string): Promise<{ suid: string; name: string; avatar: string | null; role_code?: string } | null> => {
    if (!CHAT_API_BASE || !suid) return null;
    try {
        const res = await fetch(`${CHAT_API_BASE}/chat/users/lookup/${encodeURIComponent(suid)}`, {
            credentials: "include",
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
            credentials: "include",
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
            credentials: "include",
            headers: { "Content-Type": "application/json" },
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
            credentials: "include",
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
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to_user_id: toUserId, body, client_id: clientId }),
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json.success && json.data ? json.data : null;
    } catch {
        return null;
    }
};

export const fetchPeerMessagesWithMeta = async (
    peerId: string
): Promise<{ messages: ChatMessage[]; meta: PeerReadMeta | null } | null> => {
    if (!CHAT_API_BASE || !peerId) return null;
    try {
        const res = await fetch(`${CHAT_API_BASE}/chat/peer/${encodeURIComponent(peerId)}/messages`, {
            credentials: "include",
        });
        if (!res.ok) return null;
        const json = await res.json();
        const arr = Array.isArray(json) ? json : json?.data;
        if (!Array.isArray(arr)) return null;
        const meta =
            json?.meta && typeof json.meta === "object" && !Array.isArray(json.meta)
                ? (json.meta as PeerReadMeta)
                : null;
        return { messages: arr.map((m: any) => toMessage("", m)), meta };
    } catch {
        return null;
    }
};

export const fetchPeerMessages = async (peerId: string): Promise<ChatMessage[] | null> => {
    const result = await fetchPeerMessagesWithMeta(peerId);
    return result?.messages ?? null;
};

export const markPeerRead = async (peerId: string, upToMessageId: string): Promise<boolean> => {
    if (!CHAT_API_BASE || !peerId || !/^\d+$/.test(upToMessageId)) return false;
    try {
        const res = await fetch(`${CHAT_API_BASE}/chat/peer/${encodeURIComponent(peerId)}/read`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ up_to_message_id: upToMessageId }),
        });
        if (!res.ok) return false;
        const json = await res.json();
        return json.success === true;
    } catch {
        return false;
    }
};

export const fetchRemoteMessages = async (convKey: string): Promise<ChatMessage[] | null> => {
    if (!CHAT_API_BASE) return null;
    try {
        const res = await fetch(`${CHAT_API_BASE}/chat/${encodeURIComponent(convKey)}/messages`, {
            credentials: "include",
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
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, client_id: clientId }),
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json.success ? (json.data ?? json) : null;
    } catch {
        return null;
    }
};

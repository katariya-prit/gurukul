import axios from "axios";

const chatApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? "",
    withCredentials: true,
});

export interface ChatUser {
    suid: string;
    name: string;
    role_code?: string;
    avatar?: string | null;
}

export interface ChatContact extends ChatUser {
    id: string;
    nickname: string | null;
}

export interface ChatMessage {
    id: string;
    conversation_id: string;
    sender_id: string;
    recipient_id: string;
    body: string;
    client_id?: string;
    created_at: string;
    read_at?: string | null;
    deleted_at?: string | null;
    send_state?: "sending" | "sent" | "read" | "failed";
}

export interface ChatConversation {
    id: string;
    other_user_id: string;
    name: string;
    avatar: string | null;
    nickname: string | null;
    last_message: ChatMessage | null;
    unread_count: number;
    updated_at: string;
    is_blocked: boolean;
}

export interface MessagePage {
    messages: ChatMessage[];
    hasMore: boolean;
    nextCursor: string | null;
}

export interface ChatApiError extends Error {
    status?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function readString(record: Record<string, unknown>, ...keys: string[]): string {
    for (const key of keys) {
        const value = record[key];
        if (typeof value === "string" || typeof value === "number") {
            return String(value);
        }
    }
    return "";
}

function readNullableString(record: Record<string, unknown>, ...keys: string[]): string | null {
    const value = readString(record, ...keys);
    return value || null;
}

function readCount(record: Record<string, unknown>, ...keys: string[]): number {
    for (const key of keys) {
        const parsed = Number(record[key]);
        if (Number.isFinite(parsed)) return Math.max(0, parsed);
    }
    return 0;
}

function unwrap(value: unknown): unknown {
    return isRecord(value) && "data" in value ? value.data : value;
}

function unwrapList(value: unknown, ...keys: string[]): unknown[] {
    const payload = unwrap(value);
    if (Array.isArray(payload)) return payload;
    if (!isRecord(payload)) return [];
    for (const key of keys) {
        if (Array.isArray(payload[key])) return payload[key];
    }
    return [];
}

function normalizeUser(value: unknown): ChatUser | null {
    if (!isRecord(value)) return null;
    const suid = readString(value, "suid", "user_id", "id");
    const name = readString(value, "name", "display_name", "username");
    if (!suid || !name) return null;
    const role = readNullableString(value, "role_code", "roleCode");
    const avatar = readNullableString(value, "avatar", "avatar_url");
    return {
        suid,
        name,
        ...(role ? { role_code: role } : {}),
        avatar,
    };
}

function normalizeMessage(value: unknown): ChatMessage | null {
    if (!isRecord(value)) return null;
    const id = readString(value, "id", "message_id");
    const conversationId = readString(value, "conversation_id", "conversationId", "thread_id");
    const senderId = readString(value, "sender_id", "from_user_id", "senderId");
    const recipientId = readString(value, "recipient_id", "to_user_id", "recipientId");
    const body = readString(value, "body", "message", "content");
    const createdAt = readString(value, "created_at", "createdAt", "sent_at");
    if (!id || !body) return null;
    const clientId = readNullableString(value, "client_id", "clientId");
    return {
        id,
        conversation_id: conversationId,
        sender_id: senderId,
        recipient_id: recipientId,
        body,
        ...(clientId ? { client_id: clientId } : {}),
        created_at: createdAt,
        read_at: readNullableString(value, "read_at", "readAt"),
        deleted_at: readNullableString(value, "deleted_at", "deletedAt"),
    };
}

function normalizeContact(value: unknown): ChatContact | null {
    if (!isRecord(value)) return null;
    const user = normalizeUser(value.user ?? value.contact ?? value);
    if (!user) return null;
    return {
        ...user,
        id: readString(value, "id", "contact_id") || user.suid,
        nickname: readNullableString(value, "nickname", "alias"),
    };
}

function normalizeConversation(value: unknown): ChatConversation | null {
    if (!isRecord(value)) return null;
    const otherUser = normalizeUser(value.other_user ?? value.user ?? value.contact ?? value.participant);
    const id = readString(value, "id", "conversation_id");
    const otherUserId =
        readString(value, "other_user_id", "user_id", "participant_id", "to_user_id") ||
        otherUser?.suid ||
        "";
    if (!id || !otherUserId) return null;
    const lastMessage = normalizeMessage(value.last_message ?? value.lastMessage);
    return {
        id,
        other_user_id: otherUserId,
        name: readString(value, "name", "display_name") || otherUser?.name || `User ${otherUserId}`,
        avatar: readNullableString(value, "avatar", "avatar_url") ?? otherUser?.avatar ?? null,
        nickname: readNullableString(value, "nickname", "contact_nickname"),
        last_message: lastMessage,
        unread_count: readCount(value, "unread_count", "unreadCount"),
        updated_at: readString(value, "updated_at", "last_message_at", "updatedAt"),
        is_blocked: value.is_blocked === true || value.blocked === true || value.can_message === false,
    };
}

function apiError(error: unknown, fallback: string): ChatApiError {
    if (axios.isAxiosError<{ message?: string; error?: string }>(error)) {
        const result = new Error(
            error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                fallback
        ) as ChatApiError;
        result.status = error.response?.status;
        return result;
    }
    if (error instanceof Error) return error as ChatApiError;
    return new Error(fallback) as ChatApiError;
}

async function request<T>(operation: () => Promise<T>, fallback: string): Promise<T> {
    try {
        return await operation();
    } catch (error: unknown) {
        throw apiError(error, fallback);
    }
}

export const chatService = {
    lookupUser: async (suid: string): Promise<ChatUser | null> =>
        request(async () => {
            const response = await chatApi.get(`/chat/users/lookup/${encodeURIComponent(suid)}`);
            return normalizeUser(unwrap(response.data));
        }, "Unable to look up this user"),

    getContacts: async (): Promise<ChatContact[]> =>
        request(async () => {
            const response = await chatApi.get("/chat/contacts");
            return unwrapList(response.data, "contacts").map(normalizeContact).filter(
                (item): item is ChatContact => item !== null
            );
        }, "Unable to load contacts"),

    addContact: async (userId: string, nickname: string | null): Promise<ChatContact> =>
        request(async () => {
            const response = await chatApi.post("/chat/contacts", {
                contact_user_id: userId,
                nickname,
            });
            const contact = normalizeContact(unwrap(response.data));
            if (!contact) throw new Error("The server returned an invalid contact");
            return contact;
        }, "Unable to save contact"),

    updateContact: async (contactId: string, nickname: string | null): Promise<ChatContact> =>
        request(async () => {
            const response = await chatApi.put(`/chat/contacts/${encodeURIComponent(contactId)}`, {
                nickname,
            });
            const contact = normalizeContact(unwrap(response.data));
            if (!contact) throw new Error("The server returned an invalid contact");
            return contact;
        }, "Unable to update contact"),

    deleteContact: async (contactId: string): Promise<void> =>
        request(async () => {
            await chatApi.delete(`/chat/contacts/${encodeURIComponent(contactId)}`);
        }, "Unable to delete contact"),

    getConversations: async (): Promise<ChatConversation[]> =>
        request(async () => {
            const response = await chatApi.get("/chat/conversations");
            return unwrapList(response.data, "conversations").map(normalizeConversation).filter(
                (item): item is ChatConversation => item !== null
            );
        }, "Unable to load conversations"),

    getMessages: async (
        conversationId: string,
        before: string | null,
        limit = 50
    ): Promise<MessagePage> =>
        request(async () => {
            const params = new URLSearchParams({ limit: String(limit) });
            if (before) params.set("before", before);
            const response = await chatApi.get(
                `/chat/conversations/${encodeURIComponent(conversationId)}/messages?${params}`
            );
            const rows = unwrapList(response.data, "messages")
                .map(normalizeMessage)
                .filter((item): item is ChatMessage => item !== null);
            const payload = unwrap(response.data);
            const hasMore =
                isRecord(payload) && typeof payload.has_more === "boolean"
                    ? payload.has_more
                    : rows.length === limit;
            return {
                messages: rows,
                hasMore,
                nextCursor: rows.length > 0 ? rows[0].id : null,
            };
        }, "Unable to load messages"),

    sendMessage: async (
        toUserId: string,
        body: string,
        clientId: string
    ): Promise<ChatMessage | null> =>
        request(async () => {
            const response = await chatApi.post("/chat/messages", {
                to_user_id: toUserId,
                body,
                client_id: clientId,
            });
            const payload = unwrap(response.data);
            if (isRecord(payload) && "message" in payload) {
                return normalizeMessage(payload.message);
            }
            return normalizeMessage(payload);
        }, "Unable to send message"),

    markRead: async (conversationId: string, upToMessageId: string): Promise<void> =>
        request(async () => {
            await chatApi.post(
                `/chat/conversations/${encodeURIComponent(conversationId)}/read`,
                { up_to_message_id: upToMessageId }
            );
        }, "Unable to mark messages as read"),

    deleteMessage: async (messageId: string): Promise<void> =>
        request(async () => {
            await chatApi.delete(`/chat/messages/${encodeURIComponent(messageId)}`);
        }, "Unable to delete message"),

    sendTyping: async (toUserId: string): Promise<void> =>
        request(async () => {
            await chatApi.post("/chat/typing", { to_user_id: toUserId });
        }, "Unable to send typing status"),

    getBlocks: async (): Promise<ChatUser[]> =>
        request(async () => {
            const response = await chatApi.get("/chat/blocks");
            return unwrapList(response.data, "blocks", "users")
                .map((item) => {
                    if (isRecord(item) && "user" in item) return normalizeUser(item.user);
                    return normalizeUser(item);
                })
                .filter((item): item is ChatUser => item !== null);
        }, "Unable to load blocked users"),

    blockUser: async (userId: string): Promise<void> =>
        request(async () => {
            await chatApi.post("/chat/blocks", { blocked_user_id: userId });
        }, "Unable to block this user"),

    unblockUser: async (userId: string): Promise<void> =>
        request(async () => {
            await chatApi.delete(`/chat/blocks/${encodeURIComponent(userId)}`);
        }, "Unable to unblock this user"),
};
import type { ChatMessage, ChatUser, ConvMeta, MediaBuckets, SharedSettings } from "./types";

export const AUTH_USER_STORAGE_KEYS = ["user", "userData", "authUser", "currentUser", "auth", "profile", "loginUser", "userInfo"];
export const AUTH_TOKEN_STORAGE_KEYS = ["token", "accessToken", "access_token", "authToken", "jwt"];
export const CHAT_API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3333") as string;
export const PAGE_SIZE = 80;
export const INVITE_PARAM = "gkjoin";

// Attachment limits (chats are stored in the browser, so files must stay small)
export const MAX_PENDING_FILES = 10;
export const MAX_DOC_BYTES = 1.5 * 1024 * 1024; // documents
export const MAX_IMAGE_SRC_BYTES = 20 * 1024 * 1024; // photo picked from the device (compressed before saving)
export const MAX_IMAGE_DIM = 1280; // longest side of a saved photo
export const MAX_STORED_CHARS = 2_400_000; // safety limit for one stored file (data URL length)

export const MUTE_OPTIONS = [
    { id: "8h", label: "8 hours", ms: 8 * 60 * 60 * 1000 },
    { id: "1w", label: "1 week", ms: 7 * 24 * 60 * 60 * 1000 },
    { id: "always", label: "Always", ms: -1 },
] as const;

export const TTL_OPTIONS = [
    { ms: 0, label: "Off" },
    { ms: 24 * 60 * 60 * 1000, label: "24 hours" },
    { ms: 7 * 24 * 60 * 60 * 1000, label: "7 days" },
    { ms: 90 * 24 * 60 * 60 * 1000, label: "90 days" },
];

export const ttlLabel = (ms: number) => TTL_OPTIONS.find((o) => o.ms === ms)?.label ?? "Off";

export const CHAT_THEME_DEFAULT_KEY = "gurukul_chat_theme_default";

export const EMPTY_MESSAGES: ChatMessage[] = [];

export const DEFAULT_META: ConvMeta = { starred: [], mutedUntil: 0, muteChoice: "", clearedAt: 0, keep: false };

export const DEFAULT_SHARED: SharedSettings = {
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

export const EMPTY_BUCKETS: MediaBuckets = { media: [], docs: [], links: [] };

export const FALLBACK_USER: ChatUser = { suid: "unknown-user", name: "Me", role: undefined, isSuper: false };

export const ID_KEYS = ["suid", "SUID", "user_id", "userId", "uid", "sub", "id"];
export const STRICT_ID_KEYS = ["suid", "SUID", "user_id", "userId", "uid"];
export const NAME_KEYS = ["name", "full_name", "fullName", "username", "userName", "user_name", "displayName", "display_name", "unique_name", "given_name"];
export const ROLE_KEYS = ["role_code", "roleCode", "role", "role_name", "roleName", "user_type", "userType"];

export const PALETTE_LIGHT = ["#dc2626", "#0f766e", "#7c3aed", "#d97706", "#0284c7", "#db2777", "#65a30d"];
export const PALETTE_DARK = ["#f87171", "#2dd4bf", "#a78bfa", "#fbbf24", "#38bdf8", "#f472b6", "#a3e635"];

export const HIDE_SCROLL = "[-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden";

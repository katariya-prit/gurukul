/* eslint-disable @typescript-eslint/no-explicit-any */

export type FileMeta = {
    name: string;
    size: number; // original size in bytes
    mime: string;
};

export type ChatMessage = {
    id: string;
    client_id?: string;
    conv_key: string;
    sender_suid: string;
    sender_name: string;
    text: string; // message text, or caption when a file is attached
    time: string; // ISO
    deleted?: boolean;
    file?: FileMeta; // the file data itself is stored under fileKey(id)
};

export type ChatUser = {
    suid: string;
    name: string;
    avatar?: string;
    role?: string;
    isSuper: boolean;
};

export type DirUser = {
    suid: string;
    name: string;
    avatar?: string;
    role_code?: string;
    isSuper: boolean;
};

export type ConvItem = {
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
export type ConvMeta = {
    starred: string[];
    mutedUntil: number; // 0 = not muted, -1 = always, >0 = timestamp
    muteChoice: string;
    clearedAt: number; // messages older than this are hidden for this user
    keep: boolean; // keep an (empty) DM in the list after "Clear chat"
};

/** Shared (per conversation) settings */
export type SharedSettings = {
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

export type MediaItem = { msg: ChatMessage; convKey: string; chat: string };
export type LinkItem = MediaItem & { url: string; key: string };
export type MediaBuckets = { media: MediaItem[]; docs: MediaItem[]; links: LinkItem[] };

export type FilterTab = "all" | "unread" | "groups";
export type InfoView = "main" | "starred" | "permissions" | "admins" | "addMembers" | "pending" | "privacy" | "media";
export type MediaTab = "media" | "docs" | "links";
export type DialogKind = "mute" | "disappearing" | "encryption" | "clear" | "delete" | null;
export type ChatVars = any; // theme variables coming from chatThemes

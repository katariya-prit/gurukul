/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useTheme } from "../../../components/theme/ThemeContext";
import { DEFAULT_CHAT_THEME_ID } from "../../../components/chat/chatThemes";
import { groupService, type GroupData } from "../../../services/groupService";
import {
    PAGE_SIZE,
    INVITE_PARAM,
    MAX_STORED_CHARS,
    EMPTY_MESSAGES,
    DEFAULT_META,
    DEFAULT_SHARED,
    EMPTY_BUCKETS,
    FALLBACK_USER,
    PALETTE_LIGHT,
    PALETTE_DARK,
    MUTE_OPTIONS,
    ttlLabel,
    CHAT_THEME_DEFAULT_KEY,
    CHAT_API_BASE,
} from "./constants";
import {
    jsonCache,
    writeJson,
    removeKey,
    saveChatThemeValue,
    removeChatThemeValue,
    chatThemeStorageKey,
    resolveStoredChatTheme,
    saveMessage,
    syncRemotePeerMessages,
    fileKey,
    metaKey,
    sharedKey,
    getLastRead,
    markRead,
    getMeta,
    getShared,
    getVisibleMessages,
    purgeExpired,
    dmKey,
    loadFileData,
    generateUUID,
} from "./utils/storage";
import {
    resolveBaseUser,
    fetchAllUsers,
    normalizeUser,
    hashStr,
    isSuperRole,
} from "./utils/userHelpers";
import {
    formatDay,
    downloadText,
    buildExportText,
    safeFileName,
} from "./utils/formatters";
import {
    isImageMime,
    prepareAttachment,
    buildBuckets,
} from "./utils/linksAndMedia";
import {
    fetchRemoteMessages,
    postRemoteMessage,
    sendDirectMessage,
    lookupUserBySuid,
    fetchConversations,
    fetchPeerMessages,
} from "./utils/api";
import { transmitClient } from "../../../lib/transmitClient";
import { ConversationList } from "./core/ConversationList";
import { ChatArea } from "./core/ChatArea";
import { NewChatModal } from "./core/NewChatModal";
import type {
    ChatMessage,
    ChatUser,
    ConvItem,
    ConvMeta,
    DialogKind,
    DirUser,
    FilterTab,
    InfoView,
    MediaBuckets,
    MediaItem,
    MediaTab,
    SharedSettings,
} from "./types";

export default function GurukulCommunity() {
    const { theme } = useTheme();

    const [groups, setGroups] = useState<GroupData[]>([]);
    const [apiUsers, setApiUsers] = useState<any[]>([]);
    const [customPeers, setCustomPeers] = useState<Map<string, DirUser>>(new Map());
    const [serverConvs, setServerConvs] = useState<Map<string, { preview: string; lastTime: string | null; unread: number }>>(new Map());
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
    const [searchParams, setSearchParams] = useSearchParams();

    const bump = useCallback(() => setVersion((v) => v + 1), []);

    /* ------------------------------ API & Data ------------------------------ */
    const fetchGroups = async () => {
        setLoading(true);
        try {
            let list: GroupData[] | null = null;

            // Normal members only see the groups they belong to
            if (!baseMe.isSuper && baseMe.suid !== FALLBACK_USER.suid) {
                const mine = await groupService.getGroupsByMember(Number(baseMe.suid));
                if (mine.success && Array.isArray(mine.data)) {
                    list = mine.data;
                } else {
                    list = [];
                }
            } else {
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

    const syncConversations = useCallback(async () => {
        if (baseMe.role === "STUDENT") return;
        try {
            const list = await fetchConversations();
            if (Array.isArray(list) && list.length > 0) {
                setCustomPeers((prev) => {
                    const next = new Map(prev);
                    list.forEach((item: any) => {
                        const other = item.other_user;
                        if (other && other.suid && !next.has(String(other.suid))) {
                            next.set(String(other.suid), {
                                suid: String(other.suid),
                                name: other.nickname || other.name || `User #${other.suid}`,
                                avatar: other.avatar || null,
                                role_code: other.role_code || "User",
                                isSuper: isSuperRole(other.role_code, other.name),
                            });
                        }
                    });
                    return next;
                });

                setServerConvs((prev) => {
                    const next = new Map(prev);
                    list.forEach((item: any) => {
                        const other = item.other_user;
                        if (other && other.suid) {
                            next.set(String(other.suid), {
                                preview: item.last_message_preview || "No messages yet",
                                lastTime: item.last_message_at || null,
                                unread: Number(item.unread_count || 0),
                            });
                        }
                    });
                    return next;
                });
                setVersion((v) => v + 1);
            }
        } catch (e) {
            console.warn("Failed to sync remote conversations:", e);
        }
    }, [baseMe.suid, baseMe.role]);

    useEffect(() => {
        fetchGroups();
        fetchAllUsers().then(setApiUsers);
        syncConversations();
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
        customPeers.forEach((u) => {
            if (!map.has(u.suid)) map.set(u.suid, u);
        });
        return Array.from(map.values());
    }, [apiUsers, groups, customPeers]);

    const me = useMemo<ChatUser>(() => {
        const match = rawDirectory.find((u) => String(u.suid) === String(baseMe.suid));
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

    const meRef = useRef<ChatUser>(me);
    useEffect(() => {
        meRef.current = me;
    }, [me]);

    const isStudent = useMemo(
        () => me.role === "STUDENT" || baseMe.role === "STUDENT",
        [me.role, baseMe.role]
    );

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

    // Other browser tabs changed chat data -> drop cache & refresh
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

    // Realtime chat subscription via Transmit (WhatsApp style instant messaging)
    useEffect(() => {
        const currentSuid = me.suid;
        if (!currentSuid || currentSuid === FALLBACK_USER.suid) return;

        const channel = `chat/${currentSuid}`;
        console.log(`[Gurukul Community] Subscribing to Transmit channel: ${channel}`);
        const sub = transmitClient.subscription(channel);
        let active = true;

        void sub.create().then(() => {
            if (!active) return;
            console.log(`[Gurukul Community] Active subscription ready on: ${channel}`);
            sub.onMessage((payload: any) => {
                console.log("[CHAT REALTIME RECEIVED]", payload);
                if (!active || !payload) return;
                const { event, message } = payload;
                if (event === "message.created" && message) {
                    const currentMe = meRef.current;
                    const senderSuid = String(message.sender_id);
                    const peerSuid = String(
                        payload.peer_suid ||
                        (senderSuid === currentMe.suid ? (payload.to_suid || payload.to_user_id || "") : senderSuid)
                    ).trim();

                    if (!peerSuid || peerSuid === currentMe.suid) return;

                    const senderName = payload.from_user?.name || (senderSuid === currentMe.suid ? currentMe.name : `User #${senderSuid}`);
                    const senderAvatar = payload.from_user?.avatar || (senderSuid === currentMe.suid ? currentMe.avatar : null);

                    setCustomPeers((prev) => {
                        if (prev.has(peerSuid)) return prev;
                        const next = new Map(prev);
                        next.set(peerSuid, {
                            suid: peerSuid,
                            name: senderSuid === peerSuid ? senderName : `User #${peerSuid}`,
                            avatar: senderSuid === peerSuid ? senderAvatar : null,
                            role_code: "User",
                            isSuper: false,
                        });
                        return next;
                    });

                    setServerConvs((prev) => {
                        const next = new Map(prev);
                        next.set(peerSuid, {
                            preview: message.body || "New message",
                            lastTime: message.created_at || new Date().toISOString(),
                            unread: senderSuid === currentMe.suid ? 0 : 1,
                        });
                        return next;
                    });

                    const k = dmKey(currentMe.suid, peerSuid);
                    const chatMsg: ChatMessage = {
                        id: String(message.id),
                        client_id: message.client_id,
                        conv_key: k,
                        sender_suid: senderSuid,
                        sender_name: senderName,
                        text: message.body || "",
                        time: message.created_at || new Date().toISOString(),
                    };
                    saveMessage(chatMsg, true);
                    setVersion((v) => v + 1);
                } else if (event === "message.deleted" || event === "conversation.read") {
                    setVersion((v) => v + 1);
                }
            });
        }).catch((err) => {
            console.warn("Transmit chat stream notice:", err);
        });

        return () => {
            active = false;
            void sub.delete().catch(() => {});
        };
    }, [me.suid]);

    // When opening a DM chat, sync past messages with this peer from server
    useEffect(() => {
        if (!activePeerId || !me.suid) return;
        void fetchPeerMessages(activePeerId).then((remoteList) => {
            if (Array.isArray(remoteList)) {
                const k = dmKey(me.suid, activePeerId);
                syncRemotePeerMessages(k, remoteList);
                setVersion((v) => v + 1);
            }
        });
    }, [activePeerId, me.suid]);

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
            const serverInfo = kind === "dm" ? serverConvs.get(id) : null;
            if (kind === "dm" && !list.length && !cMeta.keep && !serverInfo) return null; // DMs appear after first message or if on server
            const last = list.length ? list[list.length - 1] : null;
            const lastRead = getLastRead(key);
            let unread = list.filter((m) => m.sender_suid !== me.suid && Date.parse(m.time) > lastRead).length;
            if (unread === 0 && serverInfo?.unread) {
                unread = serverInfo.unread;
            }
            let preview = serverInfo?.preview || "No messages yet";
            let lastTime = serverInfo?.lastTime ? Date.parse(serverInfo.lastTime) : 0;
            if (last) {
                const mine = last.sender_suid === me.suid;
                const body = (last.file ? `${isImageMime(last.file.mime) ? "📷" : "📄"} ${last.text || (isImageMime(last.file.mime) ? "Photo" : last.file.name)}` : last.text);
                if (kind === "group") preview = `${mine ? "You" : last.sender_name}: ${body}`;
                else preview = mine ? `You: ${body}` : body;
                lastTime = Date.parse(last.time);
            }
            return {
                key,
                kind,
                id,
                title,
                avatar,
                isSuper,
                preview,
                lastTime,
                lastMine: !!last && last.sender_suid === me.suid,
                unread,
                muted: (cMeta.mutedUntil === -1 || cMeta.mutedUntil > now),
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
    }, [groups, otherUsers, me.suid, serverConvs, version, now]);

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
        if (!peerId || peerId === me.suid) return;
        if (isStudent) {
            toast.error("Students are only allowed to chat within assigned groups.");
            return;
        }

        if (!directory.some((u) => u.suid === peerId)) {
            setCustomPeers((prev) => {
                if (prev.has(peerId)) return prev;
                const next = new Map(prev);
                next.set(peerId, {
                    suid: peerId,
                    name: `User #${peerId}`,
                    avatar: undefined,
                    role_code: "User",
                    isSuper: false,
                });
                return next;
            });

            void lookupUserBySuid(peerId).then((user) => {
                if (user) {
                    setCustomPeers((prev) => {
                        const next = new Map(prev);
                        next.set(peerId, {
                            suid: String(user.suid),
                            name: user.name,
                            avatar: user.avatar || undefined,
                            role_code: user.role_code || "User",
                            isSuper: isSuperRole(user.role_code),
                        });
                        return next;
                    });
                    setVersion((v) => v + 1);
                }
            }).catch(() => {});
        }

        setActivePeerId(peerId);
        setActiveGroupId(null);
        resetOverlays();
        setNewOpen(false);
        setNewSearch("");
        setVisibleCount(PAGE_SIZE);
    };

    // Deep link from notification: /dashboard/community?peerId=xxx opens that chat directly
    useEffect(() => {
        const peerIdParam = searchParams.get("peerId");
        if (peerIdParam && peerIdParam !== me.suid) {
            if (!isStudent) {
                openDirectChat(peerIdParam);
            }
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.delete("peerId");
                return next;
            }, { replace: true });
        }
    }, [searchParams, me.suid, isStudent, setSearchParams]);

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
            if (activePeerId && isStudent) {
                toast.error("Students are only allowed to chat within assigned groups.");
                return false;
            }
            const key = convKey;
            const clientId = generateUUID();

            /* ---- text only ---- */
            if (!files.length) {
                if (!text) return false;
                const ok = saveMessage({
                    id: clientId,
                    client_id: clientId,
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
                    if (activePeerId) {
                        const sent = await sendDirectMessage(activePeerId, text, clientId);
                        if (!sent) {
                            console.warn("[CHAT] Message saved locally, but server sync failed");
                        } else {
                            console.log("[CHAT] Confirmed by server:", sent);
                            saveMessage({
                                id: String(sent.id),
                                client_id: sent.client_id || clientId,
                                conv_key: key,
                                sender_suid: me.suid,
                                sender_name: me.name,
                                text: sent.body || text,
                                time: sent.created_at || new Date().toISOString(),
                            }, true);
                            setServerConvs((prev) => {
                                const next = new Map(prev);
                                next.set(activePeerId, {
                                    preview: text,
                                    lastTime: sent.created_at || new Date().toISOString(),
                                    unread: 0,
                                });
                                return next;
                            });
                            setVersion((v) => v + 1);
                        }
                    } else {
                        const posted = await postRemoteMessage(key, text);
                        if (!posted) toast.error("Message did not reach the server");
                        else {
                            const list = await fetchRemoteMessages(key);
                            if (list) setRemoteState({ key, list });
                        }
                    }
                }
                return true;
            }

            /* ---- photos / documents ---- */
            let caption = text;
            let sent = 0;
            for (const f of files) {
                try {
                    const prepared = await prepareAttachment(f);
                    if (prepared.data.length > MAX_STORED_CHARS) {
                        toast.error(`"${f.name}" is too large to send`);
                        continue;
                    }
                    const id = generateUUID();
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
        [convKey, canSend, me.suid, me.name, activePeerId]
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

    const openMediaFromChat = useCallback(
        (id: string, customList?: MediaItem[]) => {
            if (!convKey) return;
            const items: MediaItem[] =
                customList ??
                messagesLive.current
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

    const persistChatTheme = (id: string, applyToAllSetting: boolean) => {
        if (!convKey) return;
        if (applyToAllSetting) {
            if (saveChatThemeValue(CHAT_THEME_DEFAULT_KEY, id)) {
                removeChatThemeValue(chatThemeStorageKey(convKey));
            }
        } else {
            saveChatThemeValue(chatThemeStorageKey(convKey), id);
        }
    };

    const candidates = useMemo(() => {
        const have = new Set(activeMembers.map((m) => String(m.suid)));
        const aq = addQuery.trim().toLowerCase();
        return otherUsers.filter(
            (u) => !have.has(u.suid) && (!aq || u.name.toLowerCase().includes(aq) || (u.role_code || "").toLowerCase().includes(aq))
        );
    }, [activeMembers, addQuery, otherUsers]);

    return (
        <div
            className={`flex h-[calc(100vh-9rem)] min-h-130 w-full overflow-hidden rounded-3xl border transition-colors duration-500
            ${theme
                    ? "border-slate-700/80 bg-[#0B1120] text-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
                    : "border-slate-200 bg-white text-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.1)]"
                }`}
        >
            <ChatArea
                dark={theme}
                isStudent={isStudent}
                convKey={convKey}
                activeGroup={activeGroup}
                activePeer={activePeer}
                chatTitle={chatTitle}
                groupsOfUser={groupsOfUser}
                activeMembers={activeMembers}
                themeConversationKey={themeConversationKey}
                chatThemeId={chatThemeId}
                applyThemeToAll={applyThemeToAll}
                now={now}
                meta={meta}
                shared={shared}
                messages={messages}
                rows={rows}
                starredSet={starredSet}
                starredMessages={starredMessages}
                highlightId={highlightId}
                hasEarlier={hasEarlier}
                canSend={canSend}
                adminBlocked={adminBlocked}
                canEditSettings={canEditSettings}
                canAdd={canAdd}
                canInvite={canInvite}
                meAdmin={meAdmin}
                me={me}
                messagesRef={messagesRef}
                infoOpen={infoOpen}
                infoView={infoView}
                dialog={dialog}
                themePickerOpen={themePickerOpen}
                mediaTab={mediaTab}
                mediaScope={mediaScope}
                mediaTotal={mediaTotal}
                buckets={buckets}
                lightbox={lightbox}
                avatarBySuid={avatarBySuid}
                candidates={candidates}
                addQuery={addQuery}
                setAddQuery={setAddQuery}
                addSel={addSel}
                setAddSel={setAddSel}
                directory={directory}
                setInfoOpen={setInfoOpen}
                setInfoView={setInfoView}
                setDialog={setDialog}
                setThemePickerOpen={setThemePickerOpen}
                setMediaTab={setMediaTab}
                setMediaScope={setMediaScope}
                setChatThemeId={setChatThemeId}
                setApplyThemeToAll={setApplyThemeToAll}
                onCloseChat={closeChat}
                onNewMessageOpen={() => {
                    if (isStudent) return;
                    setNewOpen(true);
                }}
                onMessagesScroll={onMessagesScroll}
                onLoadEarlier={loadEarlier}
                onStar={toggleStar}
                onOpenMedia={openMediaFromChat}
                onDownload={downloadAttachment}
                onSend={sendMessage}
                onPersistChatTheme={persistChatTheme}
                onApplyMute={applyMute}
                onApplyTtl={applyTtl}
                onTogglePrivacy={togglePrivacy}
                onExportChat={exportChat}
                onClearChat={clearChat}
                onDeleteChat={deleteChat}
                onSetPermission={setPermission}
                onToggleAdmin={toggleAdmin}
                onConfirmAddMembers={confirmAddMembers}
                onAcceptRequest={(suid) => addMembersToGroup([suid], true)}
                onRejectRequest={rejectRequest}
                copyInviteLink={copyInviteLink}
                openDirectChat={openDirectChat}
                openGroupChat={openGroupChat}
                onJumpToMessage={jumpToMessage}
                onLightboxClose={() => setLightbox(null)}
                onLightboxGo={(d) => setLightbox((l) => (l ? { ...l, index: Math.min(l.items.length - 1, Math.max(0, l.index + d)) } : l))}
            />

            <ConversationList
                dark={theme}
                convKey={convKey}
                me={me}
                isStudent={isStudent}
                directory={directory}
                groups={groups}
                visibleConversations={visibleConversations}
                suggestedPeople={suggestedPeople}
                unreadChats={unreadChats}
                filter={filter}
                setFilter={setFilter}
                search={search}
                setSearch={setSearch}
                loading={loading}
                onOpenGroup={openGroupChat}
                onOpenDirect={openDirectChat}
                onOpenNewMessage={() => {
                    if (isStudent) return;
                    setNewOpen(true);
                }}
            />

            {!isStudent && (
                <NewChatModal
                    open={newOpen}
                    dark={theme}
                    otherUsers={otherUsers}
                    newSearch={newSearch}
                    setNewSearch={setNewSearch}
                    onClose={() => setNewOpen(false)}
                    onSelectUser={(suid) => openDirectChat(suid)}
                />
            )}
        </div>
    );
}

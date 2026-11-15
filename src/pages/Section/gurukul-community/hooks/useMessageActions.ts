/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { GroupData } from "../../../../services/groupService";
import type { ChatMessage, ChatUser, DirUser, SharedSettings } from "../types";
import type { FwdTarget, ReplyRef, Tick } from "../messageTypes";
import {
    dmKey,
    fileKey,
    generateUUID,
    getMeta,
    getShared,
    loadFileData,
    markRead,
    metaKey,
    removeKey,
    saveMessage,
    sharedKey,
    writeJson,
} from "../utils/storage";
import { applyRemoteReactions, EMPTY_READS, getPeerRead, getReads, recordReads, updateMessage } from "../utils/messageStore";
import { MAX_FORWARD, MAX_PINS, previewOf } from "../utils/chatHelpers";
import { setReactionRemote } from "../utils/api";

const reactionPending = new Set<string>();
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isReactionPending = (convKey: string, messageId?: string, clientId?: string): boolean =>
    [messageId, clientId].some((id) => !!id && reactionPending.has(`${convKey}:${id}`));

type Params = {
    convKey: string | null;
    me: ChatUser;
    canSend: boolean;
    shared: SharedSettings;
    meAdmin: boolean;
    isGroup: boolean;
    messages: ChatMessage[];
    groups: GroupData[];
    otherUsers: DirUser[];
    membersOf: (g: GroupData) => any[];
    activeMembers: any[];
    activePeer: DirUser | null;
    version: number;
    bump: () => void;
};

export function useMessageActions(p: Params) {
    const { convKey, me, canSend, shared, isGroup, messages, groups, otherUsers, membersOf, activeMembers, activePeer, version, bump } = p;

    const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
    const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
    const [msgDialog, setMsgDialog] = useState<{ kind: "delete" | "forward"; msg: ChatMessage } | null>(null);
    const [fwdSel, setFwdSel] = useState<string[]>([]);
    const [fwdQuery, setFwdQuery] = useState("");
    const [msgInfoId, setMsgInfoId] = useState<string | null>(null);
    const [pinIdx, setPinIdx] = useState(0);
    const messagesRef = useRef(messages);
    const reactionChainsRef = useRef(new Map<string, Promise<void>>());
    const latestReactionRequestRef = useRef(new Map<string, number>());
    const reactionRequestIdRef = useRef(0);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // new conversation -> close everything
    useEffect(() => {
        const t = window.setTimeout(() => {
            setMenu(null);
            setReplyTarget(null);
            setMsgDialog(null);
            setMsgInfoId(null);
            setFwdSel([]);
            setFwdQuery("");
            setPinIdx(0);
        }, 0);
        return () => window.clearTimeout(t);
    }, [convKey]);

    // Escape closes the menu / dialog / message info first (capture phase => runs before the page's own Escape handler)
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            if (menu) {
                setMenu(null);
                e.stopPropagation();
            } else if (msgDialog) {
                setMsgDialog(null);
                e.stopPropagation();
            } else if (msgInfoId) {
                setMsgInfoId(null);
                e.stopPropagation();
            }
        };
        window.addEventListener("keydown", onKey, true);
        return () => window.removeEventListener("keydown", onKey, true);
    }, [menu, msgDialog, msgInfoId]);

    /* ---- read receipts (ticks) ---- */
    const recipients = useMemo<string[]>(
        () =>
            isGroup
                ? activeMembers.map((m) => String(m.suid)).filter((s) => s !== me.suid)
                : activePeer
                    ? [activePeer.suid]
                    : [],
        [isGroup, activeMembers, activePeer, me.suid]
    );

    const reads = useMemo(() => {
        void version;
        return convKey ? getReads(convKey) : EMPTY_READS;
    }, [convKey, version]);

    const peerRead = useMemo(
        () => (!isGroup && activePeer && convKey ? getPeerRead(convKey) : null),
        [activePeer, convKey, isGroup, version]
    );

    const effectiveReads = useMemo(() => {
        if (isGroup || !activePeer || !peerRead) return reads;
        const next = { ...reads };
        messages.forEach((message) => {
            if (
                message.sender_suid !== activePeer.suid &&
                /^\d+$/.test(message.id) &&
                Number(message.id) <= peerRead.upTo
            ) {
                next[message.id] = { ...(reads[message.id] ?? {}), [activePeer.suid]: peerRead.at };
            }
        });
        return next;
    }, [activePeer, isGroup, messages, peerRead, reads]);

    const tickFor = useCallback(
        (m: ChatMessage): Tick => {
            const r = effectiveReads[m.id];
            return recipients.length > 0 && recipients.every((s) => r?.[s]) ? "read" : "delivered";
        },
        [effectiveReads, recipients]
    );

    // my own "read" receipts for the messages of other people
    useEffect(() => {
        if (!convKey) return;
        if (recordReads(convKey, me.suid, messages)) bump();
    }, [convKey, me.suid, messages, bump]);

    /* ---- pinned ---- */
    const pinnedMessages = useMemo(
        () =>
            (shared.pinned ?? [])
                .map((id) => messages.find((m) => m.id === id && !m.deleted))
                .filter((m): m is ChatMessage => !!m),
        [shared.pinned, messages]
    );
    const pinnedSet = useMemo<Set<string>>(() => new Set(pinnedMessages.map((m) => String(m.id))), [pinnedMessages]);

    const patchShared = (patch: Partial<SharedSettings>) => {
        if (!convKey) return;
        writeJson(sharedKey(convKey), { ...getShared(convKey), ...patch });
        bump();
    };

    /* ---- actions ---- */
    const openMenu = useCallback((id: string, x: number, y: number) => setMenu({ id, x, y }), []);
    const closeMenu = useCallback(() => setMenu((m) => (m ? null : m)), []);

    const buildReplyRef = useCallback((): ReplyRef | undefined => {
        if (!replyTarget) return undefined;
        return {
            id: replyTarget.id,
            suid: replyTarget.sender_suid,
            name: replyTarget.sender_name,
            text: previewOf(replyTarget).slice(0, 160),
        };
    }, [replyTarget]);

    const toggleReaction = useCallback(
        (id: string, emoji: string) => {
            if (!convKey) return;
            if (!canSend) {
                toast.error("You can't react in this chat");
                return;
            }
            const message = messagesRef.current.find((item) => item.id === id);
            if (!message || message.deleted) return;
            const prev = message.reactions?.[me.suid] ?? null;
            const next = prev === emoji ? null : emoji;
            updateMessage(convKey, id, (m) => {
                if (m.deleted) return m;
                const r = { ...(m.reactions || {}) };
                if (next === null) delete r[me.suid];
                else r[me.suid] = next;
                return { ...m, reactions: Object.keys(r).length ? r : undefined };
            });
            bump();

            if (!convKey.startsWith("dm_") || (!message.text && !message.file)) return;
            const messageId = /^\d+$/.test(message.id) ? message.id : undefined;
            const clientId = message.client_id ?? (UUID_REGEX.test(message.id) ? message.id : undefined);
            if (messageId === undefined && clientId === undefined) return;

            const requestKey = `${convKey}:${clientId ?? messageId}`;
            const requestId = ++reactionRequestIdRef.current;
            latestReactionRequestRef.current.set(requestKey, requestId);
            reactionPending.add(requestKey);

            const previousRequest = reactionChainsRef.current.get(requestKey) ?? Promise.resolve();
            let queuedRequest: Promise<void>;
            queuedRequest = previousRequest.then(async () => {
                const result = await setReactionRemote({ convKey, messageId, clientId, emoji: next });
                if (result.ok) {
                    applyRemoteReactions(convKey, { id, clientId }, result.reactions);
                    bump();
                    return;
                }
                if (result.status === 404 || latestReactionRequestRef.current.get(requestKey) !== requestId) return;
                updateMessage(convKey, id, (current) => {
                    const reactions = { ...(current.reactions ?? {}) };
                    if (prev === null) delete reactions[me.suid];
                    else reactions[me.suid] = prev;
                    return { ...current, reactions: Object.keys(reactions).length ? reactions : undefined };
                });
                bump();
                toast.error("Could not send reaction");
            }).finally(() => {
                if (reactionChainsRef.current.get(requestKey) === queuedRequest) {
                    reactionChainsRef.current.delete(requestKey);
                    latestReactionRequestRef.current.delete(requestKey);
                    reactionPending.delete(requestKey);
                }
            });
            reactionChainsRef.current.set(requestKey, queuedRequest);
        },
        [convKey, canSend, me.suid, bump]
    );

    const copyMessage = async (m: ChatMessage) => {
        if (shared.advPrivacy) {
            toast.error("Copying is blocked while Advanced chat privacy is on");
            return;
        }
        if (!m.text) return;
        try {
            await navigator.clipboard.writeText(m.text);
            toast.success("Message copied");
        } catch {
            toast.error("Could not copy the message");
        }
    };

    const togglePin = (m: ChatMessage) => {
        if (!convKey) return;
        const cur = getShared(convKey).pinned ?? [];
        if (cur.includes(m.id)) {
            patchShared({ pinned: cur.filter((x) => x !== m.id) });
            toast.success("Message unpinned");
            return;
        }
        const next = [...cur, m.id].slice(-MAX_PINS);
        patchShared({ pinned: next });
        setPinIdx(next.length - 1);
        toast.success(cur.length >= MAX_PINS ? "Message pinned (the oldest pin was replaced)" : "Message pinned");
    };

    const deleteForMe = (m: ChatMessage) => {
        if (!convKey) return;
        const cur = getMeta(me.suid, convKey);
        writeJson(metaKey(me.suid, convKey), {
            ...cur,
            hiddenIds: Array.from(new Set([...(cur.hiddenIds ?? []), m.id])),
            starred: cur.starred.filter((x) => x !== m.id),
        });
        if (replyTarget?.id === m.id) setReplyTarget(null);
        setMsgDialog(null);
        bump();
        toast.success("Message deleted");
    };

    const deleteForEveryone = (m: ChatMessage) => {
        if (!convKey) return;
        updateMessage(convKey, m.id, (x) => ({
            ...x,
            text: "",
            file: undefined,
            replyTo: undefined,
            forwarded: false,
            reactions: undefined,
            deleted: true,
        }));
        if (m.file) removeKey(fileKey(m.id));
        const pinned = getShared(convKey).pinned ?? [];
        if (pinned.includes(m.id)) patchShared({ pinned: pinned.filter((x) => x !== m.id) });
        if (replyTarget?.id === m.id) setReplyTarget(null);
        setMsgDialog(null);
        bump();
        toast.success("Message deleted for everyone");
    };

    /* ---- forward ---- */
    const forwardTargets = useMemo<FwdTarget[]>(() => {
        void version;
        if (msgDialog?.kind !== "forward") return [];
        const out: FwdTarget[] = [];
        groups.forEach((g) => {
            const key = `group_${g.group_id}`;
            const sh = getShared(key);
            const member = membersOf(g).some((x) => String(x.suid) === me.suid) || me.isSuper;
            const admin = me.isSuper || sh.admins.includes(me.suid);
            let disabled: string | undefined;
            if (!member) disabled = "You are not a member";
            else if (sh.onlyAdminsSend && !admin) disabled = "Only admins can send messages";
            out.push({ key, kind: "group", title: g.group_name, isSuper: false, disabled });
        });
        otherUsers.forEach((u) =>
            out.push({ key: dmKey(me.suid, u.suid), kind: "dm", title: u.name, avatar: u.avatar, isSuper: u.isSuper, sub: u.role_code })
        );
        return out;
    }, [msgDialog, groups, otherUsers, membersOf, me.suid, me.isSuper, version]);

    const toggleFwd = (key: string) => {
        if (fwdSel.includes(key)) setFwdSel(fwdSel.filter((x) => x !== key));
        else if (fwdSel.length >= MAX_FORWARD) toast.error(`You can forward to up to ${MAX_FORWARD} chats at once`);
        else setFwdSel([...fwdSel, key]);
    };

    const forwardMessage = (m: ChatMessage, keys: string[]) => {
        let sent = 0;
        keys.forEach((key) => {
            const id = generateUUID();
            if (m.file) {
                const data = loadFileData(m.id);
                if (!data) {
                    toast.error("This file is no longer available");
                    return;
                }
                if (!writeJson(fileKey(id), data, true)) {
                    toast.error("Could not forward the file. Browser storage is full.");
                    return;
                }
            }
            const ok = saveMessage(
                {
                    id,
                    conv_key: key,
                    sender_suid: me.suid,
                    sender_name: me.name,
                    text: m.text,
                    time: new Date().toISOString(),
                    forwarded: true,
                    ...(m.file ? { file: m.file } : {}),
                },
                true
            );
            if (!ok) {
                if (m.file) removeKey(fileKey(id));
                toast.error("Could not forward the message");
                return;
            }
            markRead(key);
            sent++;
        });
        setMsgDialog(null);
        setFwdSel([]);
        setFwdQuery("");
        bump();
        if (sent) toast.success(`Message forwarded to ${sent} chat${sent === 1 ? "" : "s"}`);
    };

    return {
        menu, setMenu, openMenu, closeMenu,
        replyTarget, setReplyTarget, buildReplyRef,
        msgDialog, setMsgDialog,
        fwdSel, setFwdSel, fwdQuery, setFwdQuery, toggleFwd, forwardTargets, forwardMessage,
        msgInfoId, setMsgInfoId,
        pinIdx, setPinIdx, pinnedMessages, pinnedSet,
        recipients, reads: effectiveReads, tickFor,
        toggleReaction, copyMessage, togglePin, deleteForMe, deleteForEveryone,
    };
}

export type MessageActions = ReturnType<typeof useMessageActions>;
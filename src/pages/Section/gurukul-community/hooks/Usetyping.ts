import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FALLBACK_USER } from "../constants";
import { dmKey } from "../utils/storage";
import { sendTypingRemote } from "../utils/Typingapi";
import type { ChatUser, DirUser } from "../types";

/* -------------------------------------------------------------------------- */
/*  "Typing..." indicator                                                      */
/*  - Composer calls notify() while I type -> tells the other side            */
/*  - receives "typing" events (Transmit + other browser tabs)                 */
/*  - exposes who is typing in the open chat and in every chat-list row        */
/* -------------------------------------------------------------------------- */
const TYPING_TTL = 6000; // hide the indicator if no update arrives for 6s
const RESEND_MS = 2500; // while I keep typing, re-announce at most every 2.5s
const IDLE_STOP_MS = 3000; // I stopped typing for 3s -> announce "stopped"
const CHANNEL_NAME = "gurukul-chat-typing";

export type TypingEntry = { suid: string; name: string; avatar?: string; until: number };
type TypingMap = Record<string, TypingEntry[]>;

type Wire = {
    type: "typing";
    conv_key: string;
    typing: boolean;
    from: { suid: string; name?: string; avatar?: string | null };
    to_suids?: string[];
};

interface Options {
    me: ChatUser;
    convKey: string | null;
    /** suids that should be told that I am typing (peer, or all other group members) */
    recipients: string[];
    directory: DirUser[];
    /** false when I am not allowed to send in this chat */
    enabled: boolean;
}

const firstName = (n: string) => (n || "").trim().split(" ")[0] || n;

export const typingLabel = (isGroup: boolean, list: TypingEntry[]): string => {
    if (!list.length) return "";
    if (!isGroup) return "typing…";
    const a = firstName(list[0].name);
    if (list.length === 1) return `${a} is typing…`;
    if (list.length === 2) return `${a} and ${firstName(list[1].name)} are typing…`;
    return `${a} and ${list.length - 1} others are typing…`;
};

/** true for the realtime (Transmit) events that carry typing info */
export const isTypingEvent = (payload: any): boolean =>
    !!payload && (payload.event === "typing" || payload.event === "typing.started" || payload.event === "typing.stopped");

export function useTyping({ me, convKey, recipients, directory, enabled }: Options) {
    const [map, setMap] = useState<TypingMap>({});

    const meRef = useRef(me);
    const dirRef = useRef(directory);
    const convRef = useRef(convKey);
    const recipientsRef = useRef(recipients);
    const enabledRef = useRef(enabled);
    const channelRef = useRef<BroadcastChannel | null>(null);
    const announcedRef = useRef<string | null>(null);
    const lastSentRef = useRef(0);
    const idleRef = useRef<number | null>(null);

    useEffect(() => {
        meRef.current = me;
        dirRef.current = directory;
        convRef.current = convKey;
        recipientsRef.current = recipients;
        enabledRef.current = enabled;
    }, [me, directory, convKey, recipients, enabled]);

    /* ------------------------------ receiving ------------------------------ */
    const addTyping = useCallback((key: string, entry: TypingEntry) => {
        setMap((prev: TypingMap) => {
            const rest = (prev[key] ?? []).filter((e) => e.suid !== entry.suid);
            return { ...prev, [key]: [...rest, entry] };
        });
    }, []);

    const clearFrom = useCallback((key: string, suid: string) => {
        setMap((prev: TypingMap) => {
            const list = prev[key];
            if (!list || !list.some((e) => e.suid === suid)) return prev;
            const next = { ...prev };
            const left = list.filter((e) => e.suid !== suid);
            if (left.length) next[key] = left;
            else delete next[key];
            return next;
        });
    }, []);

    const receive = useCallback(
        (w: Wire) => {
            const current = meRef.current;
            const from = String(w.from?.suid ?? "");
            if (!from || from === current.suid || !w.conv_key) return;
            if (w.conv_key.startsWith("dm_") && w.conv_key !== dmKey(current.suid, from)) return;
            if (w.to_suids && w.to_suids.length && !w.to_suids.map(String).includes(current.suid)) return;

            if (!w.typing) {
                clearFrom(w.conv_key, from);
                return;
            }
            const known = dirRef.current.find((u) => u.suid === from);
            addTyping(w.conv_key, {
                suid: from,
                name: known?.name || w.from.name || `User #${from}`,
                avatar: (known?.avatar || w.from.avatar || undefined) as string | undefined,
                until: Date.now() + TYPING_TTL,
            });
        },
        [addTyping, clearFrom]
    );

    /** Call this with the payload of a Transmit "typing" event */
    const handleRealtime = useCallback(
        (payload: any) => {
            if (!isTypingEvent(payload)) return;
            const fromSuid = payload.from_user?.suid ?? payload.from_suid ?? payload.peer_suid;
            if (fromSuid === undefined || fromSuid === null) return;
            const key = payload.conv_key || dmKey(meRef.current.suid, String(fromSuid));
            receive({
                type: "typing",
                conv_key: String(key),
                typing: payload.event !== "typing.stopped" && payload.typing !== false,
                from: { suid: String(fromSuid), name: payload.from_user?.name, avatar: payload.from_user?.avatar },
                to_suids: payload.to_suids,
            });
        },
        [receive]
    );

    // same-browser tabs (also makes it easy to test with two tabs)
    useEffect(() => {
        if (typeof BroadcastChannel === "undefined") return;
        const ch = new BroadcastChannel(CHANNEL_NAME);
        channelRef.current = ch;
        ch.onmessage = (e: MessageEvent<Wire>) => {
            if (e.data && e.data.type === "typing") receive(e.data);
        };
        return () => {
            ch.close();
            channelRef.current = null;
        };
    }, [receive]);

    // drop entries that did not get refreshed in time
    const hasAny = Object.keys(map).length > 0;
    useEffect(() => {
        if (!hasAny) return;
        const id = window.setInterval(() => {
            const t = Date.now();
            setMap((prev: TypingMap) => {
                let changed = false;
                const next: TypingMap = {};
                for (const [k, list] of Object.entries(prev) as [string, TypingEntry[]][]) {
                    const alive = list.filter((e) => e.until > t);
                    if (alive.length !== list.length) changed = true;
                    if (alive.length) next[k] = alive;
                }
                return changed ? next : prev;
            });
        }, 1000);
        return () => window.clearInterval(id);
    }, [hasAny]);

    /* ------------------------------ sending ------------------------------ */
    const emit = useCallback((key: string, typing: boolean) => {
        const current = meRef.current;
        const to = recipientsRef.current;
        if (!to.length || current.suid === FALLBACK_USER.suid) return;
        const wire: Wire = {
            type: "typing",
            conv_key: key,
            typing,
            from: { suid: current.suid, name: current.name, avatar: current.avatar ?? null },
            to_suids: to,
        };
        try {
            channelRef.current?.postMessage(wire);
        } catch {
            /* ignore */
        }
        void sendTypingRemote({ convKey: key, toSuids: to, typing });
    }, []);

    /** I stopped typing (or just sent the message) */
    const stop = useCallback(() => {
        if (idleRef.current !== null) {
            window.clearTimeout(idleRef.current);
            idleRef.current = null;
        }
        const key = announcedRef.current;
        if (key) {
            announcedRef.current = null;
            emit(key, false);
        }
        lastSentRef.current = 0;
    }, [emit]);

    /** I am typing right now */
    const notify = useCallback(() => {
        const key = convRef.current;
        if (!key || !enabledRef.current) return;
        const t = Date.now();
        if (announcedRef.current !== key) {
            if (announcedRef.current) emit(announcedRef.current, false);
            announcedRef.current = key;
            lastSentRef.current = 0;
        }
        if (t - lastSentRef.current > RESEND_MS) {
            lastSentRef.current = t;
            emit(key, true);
        }
        if (idleRef.current !== null) window.clearTimeout(idleRef.current);
        idleRef.current = window.setTimeout(stop, IDLE_STOP_MS);
    }, [emit, stop]);

    // switching chat / leaving the page => say "stopped" for the old chat
    useEffect(() => {
        return () => stop();
    }, [convKey, stop]);

    /* ------------------------------ output ------------------------------ */
    const typingNow = useMemo(() => (convKey ? map[convKey] ?? [] : []), [map, convKey]);

    const labels = useMemo(() => {
        const out: Record<string, string> = {};
        for (const [k, list] of Object.entries(map) as [string, TypingEntry[]][]) {
            if (list.length) out[k] = typingLabel(k.startsWith("group_"), list);
        }
        return out;
    }, [map]);

    return { typingNow, labels, handleRealtime, clearFrom, notify, stop };
}
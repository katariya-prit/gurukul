import { useCallback, useEffect, useRef } from "react";
import type { ChatMessage } from "../types";
import { markPeerRead } from "../utils/api";

type Params = {
    convKey: string | null;
    peerId: string | null;
    meSuid: string;
    messages: ChatMessage[];
    enabled: boolean;
    onMarked: () => void;
};

export function useReadReceipts({ convKey, peerId, meSuid, messages, enabled, onMarked }: Params): void {
    const latestIncoming = messages.reduce((latest, message) => {
        if (message.sender_suid === meSuid || message.deleted || !/^\d+$/.test(message.id)) return latest;
        const id = Number(message.id);
        return Number.isFinite(id) ? Math.max(latest, id) : latest;
    }, 0);

    const latestIncomingRef = useRef(latestIncoming);
    latestIncomingRef.current = latestIncoming;

    const stateRef = useRef({ convKey, peerId, enabled, onMarked });
    stateRef.current = { convKey, peerId, enabled, onMarked };

    const lastSentRef = useRef(new Map<string, number>());
    const retryAfterRef = useRef(new Map<string, number>());
    const inFlightRef = useRef(new Set<string>());
    const timerRef = useRef<number | null>(null);
    const previousConvKeyRef = useRef(convKey);
    const mountedRef = useRef(true);
    const scheduleRef = useRef<() => void>(() => undefined);
    const runRef = useRef<() => Promise<void>>(async () => undefined);

    const schedule = useCallback(() => {
        if (timerRef.current !== null) window.clearTimeout(timerRef.current);
        timerRef.current = null;
        const current = stateRef.current;
        if (!current.enabled || !current.convKey || !current.peerId || document.visibilityState !== "visible") return;
        const key = current.convKey;
        const latest = latestIncomingRef.current;
        if (latest <= (lastSentRef.current.get(key) ?? 0) || inFlightRef.current.has(key)) return;
        const retryAfter = retryAfterRef.current.get(key) ?? 0;
        const wait = Math.max(250, retryAfter - Date.now());
        timerRef.current = window.setTimeout(() => {
            timerRef.current = null;
            void runRef.current();
        }, wait);
    }, []);

    scheduleRef.current = schedule;

    runRef.current = async () => {
        const current = stateRef.current;
        const key = current.convKey;
        const peer = current.peerId;
        const upTo = latestIncomingRef.current;
        if (
            !mountedRef.current ||
            !current.enabled ||
            !key ||
            !peer ||
            document.visibilityState !== "visible" ||
            upTo <= (lastSentRef.current.get(key) ?? 0) ||
            inFlightRef.current.has(key)
        ) {
            return;
        }

        inFlightRef.current.add(key);
        const marked = await markPeerRead(peer, String(upTo));
        inFlightRef.current.delete(key);
        if (!mountedRef.current) return;

        if (marked) {
            lastSentRef.current.set(key, Math.max(upTo, lastSentRef.current.get(key) ?? 0));
            retryAfterRef.current.delete(key);
            current.onMarked();
        } else {
            retryAfterRef.current.set(key, Date.now() + 5000);
        }

        if (latestIncomingRef.current > upTo) scheduleRef.current();
    };

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            if (timerRef.current !== null) window.clearTimeout(timerRef.current);
        };
    }, []);

    useEffect(() => {
        if (previousConvKeyRef.current !== convKey) {
            lastSentRef.current.clear();
            retryAfterRef.current.clear();
            previousConvKeyRef.current = convKey;
        }
        schedule();
        return () => {
            if (timerRef.current !== null) window.clearTimeout(timerRef.current);
            timerRef.current = null;
        };
    }, [convKey, enabled, latestIncoming, peerId, schedule]);

    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.visibilityState === "visible") schedule();
        };
        const onFocus = () => schedule();
        document.addEventListener("visibilitychange", onVisibilityChange);
        window.addEventListener("focus", onFocus);
        return () => {
            document.removeEventListener("visibilitychange", onVisibilityChange);
            window.removeEventListener("focus", onFocus);
        };
    }, [convKey, schedule]);
}

import { useLayoutEffect, useRef } from "react";
import type { ChatMessage, SharedSettings } from "../types";
import type { ChatVars, MsgRow, Tick } from "../messageTypes";
import type { TypingEntry } from "../hooks/Usetyping";
import { IoShieldCheckmarkOutline, IoTimerOutline } from "react-icons/io5";
import { LogoTile } from "../ui/LogoTile";
import { MessageRow } from "./MessageRow";
import { TypingBubble } from "./Typingoverlay";
import { HIDE_SCROLL } from "../utils/chatHelpers";
import { ttlLabel } from "../constants";

type Props = {
    dark: boolean;
    cv: ChatVars;
    shared: SharedSettings;
    title: string;
    messagesCount: number;
    rows: MsgRow[];
    starredSet: Set<string>;
    pinnedSet: Set<string>;
    highlightId: string | null;
    hasEarlier: boolean;
    typingEntries?: TypingEntry[];
    isGroup: boolean;
    meSuid: string;
    tickFor: (m: ChatMessage) => Tick;
    messagesRef: React.RefObject<any>;
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    onLoadEarlier: () => void;
    onMenu: (id: string, x: number, y: number) => void;
    closeMenu: () => void;
    onReact: (id: string, emoji: string) => void;
    onJump: (id: string) => void;
    onOpenMedia: (id: string) => void;
    onDownload: (m: ChatMessage) => void;
};

export function ChatMessagesArea(p: Props) {
    const { dark, cv, shared } = p;
    const chip = { background: cv.chip.background, color: cv.chip.color, borderColor: cv.chip.border };
    const typingActive = (p.typingEntries?.length ?? 0) > 0;
    const typingRowRef = useRef<HTMLDivElement>(null);
    const previousTypingActiveRef = useRef(false);
    const typingRowHeightRef = useRef(0);

    useLayoutEffect(() => {
        const container = p.messagesRef.current;
        const wasTyping = previousTypingActiveRef.current;
        previousTypingActiveRef.current = typingActive;

        const row = typingRowRef.current;
        const rowHeight = row
            ? row.getBoundingClientRect().height + Number.parseFloat(window.getComputedStyle(row).marginTop || "0")
            : typingRowHeightRef.current;
        if (typingActive && row) typingRowHeightRef.current = rowHeight;
        if (!container || wasTyping === typingActive) return;

        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        const previousDistanceFromBottom = typingActive
            ? distanceFromBottom - rowHeight
            : distanceFromBottom + rowHeight;

        if (previousDistanceFromBottom <= 160) {
            container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
        }
    }, [p.messagesRef, p.typingEntries?.length, typingActive]);

    return (
        <div
            ref={p.messagesRef}
            onScroll={(e) => {
                p.onScroll(e);
                p.closeMenu();
            }}
            onCopy={shared.advPrivacy ? (e) => e.preventDefault() : undefined}
            onCut={shared.advPrivacy ? (e) => e.preventDefault() : undefined}
            className={`flex-1 min-h-0 overflow-y-auto px-4 md:px-8 py-6 space-y-3 ${shared.advPrivacy ? "select-none" : ""} ${HIDE_SCROLL}`}
            style={cv.wallpaper}
        >
            {(shared.ttl > 0 || shared.advPrivacy) && (
                <div className="flex flex-wrap justify-center gap-2">
                    {shared.ttl > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold shadow-sm" style={chip}>
                            <IoTimerOutline /> Disappearing messages · {ttlLabel(shared.ttl)}
                        </span>
                    )}
                    {shared.advPrivacy && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold shadow-sm" style={chip}>
                            <IoShieldCheckmarkOutline /> Advanced chat privacy is on
                        </span>
                    )}
                </div>
            )}

            {p.hasEarlier && (
                <div className="flex justify-center">
                    <button onClick={p.onLoadEarlier} className="rounded-full border px-4 py-1.5 text-xs font-semibold shadow-sm" style={chip}>
                        Load earlier messages
                    </button>
                </div>
            )}

            {p.messagesCount === 0 && (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                    <LogoTile dark={dark} size={72} />
                    <p className={`text-lg font-bold tracking-tight ${dark ? "text-slate-200" : "text-slate-800"}`}>{p.title}</p>
                    <p className={`max-w-xs text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                        There are no messages yet. Send a message first and start the conversation.
                    </p>
                </div>
            )}

            {p.rows.map((r) => (
                <MessageRow
                    key={r.m.id}
                    m={r.m}
                    day={r.day}
                    mine={r.mine}
                    sameSender={r.sameSender}
                    showName={r.showName}
                    nameColor={r.nameColor}
                    avatar={r.avatar}
                    dark={dark}
                    cv={cv}
                    starred={p.starredSet.has(r.m.id)}
                    pinned={p.pinnedSet.has(r.m.id)}
                    highlight={p.highlightId === r.m.id}
                    privacy={shared.advPrivacy}
                    tick={r.mine ? p.tickFor(r.m) : undefined}
                    meSuid={p.meSuid}
                    onMenu={p.onMenu}
                    onReact={p.onReact}
                    onJump={p.onJump}
                    onOpenMedia={p.onOpenMedia}
                    onDownload={p.onDownload}
                />
            ))}

            {typingActive && (
                <div ref={typingRowRef} className="mt-3 min-w-0">
                    <TypingBubble dark={dark} cv={cv} entries={p.typingEntries ?? []} isGroup={p.isGroup} />
                </div>
            )}
        </div>
    );
}

export default ChatMessagesArea;
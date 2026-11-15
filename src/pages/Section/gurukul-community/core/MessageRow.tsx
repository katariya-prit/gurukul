import { memo, useEffect, useMemo, useRef } from "react";
import {
    IoArrowRedoOutline,
    IoBanOutline,
    IoCheckmark,
    IoCheckmarkDone,
    IoChevronDown,
    IoDocumentTextOutline,
    IoDownloadOutline,
    IoLockClosedOutline,
    IoPin,
    IoStar,
} from "react-icons/io5";
import type { ChatMessage } from "../types";
import type { ChatVars, Tick } from "../messageTypes";
import { PersonAvatar } from "../ui/PersonAvatar";
import { loadFileData } from "../utils/storage";
import { isImageMime } from "../utils/linksAndMedia";
import { fileExt, formatBytes, formatTime, renderText } from "../utils/chatHelpers";

type Props = {
    m: ChatMessage;
    day: string | null;
    mine: boolean;
    sameSender: boolean;
    showName: boolean;
    nameColor: string;
    avatar?: string | null;
    dark: boolean;
    cv: ChatVars;
    starred: boolean;
    pinned: boolean;
    highlight: boolean;
    privacy: boolean;
    tick?: Tick;
    meSuid: string;
    onMenu: (id: string, x: number, y: number) => void;
    onReact: (id: string, emoji: string) => void;
    onJump: (id: string) => void;
    onOpenMedia: (id: string) => void;
    onDownload: (m: ChatMessage) => void;
};

export const MessageRow = memo(function MessageRow({
    m, day, mine, sameSender, showName, nameColor, avatar, dark, cv, starred, pinned, highlight, privacy, tick, meSuid,
    onMenu, onReact, onJump, onOpenMedia, onDownload,
}: Props) {
    const fileData = useMemo(() => (m.file && !m.deleted ? loadFileData(m.id) : null), [m.id, m.file, m.deleted]);
    const isImg = !!m.file && isImageMime(m.file.mime);
    const pressTimer = useRef<number | null>(null);

    const clearPress = () => {
        if (pressTimer.current !== null) {
            window.clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
    };
    useEffect(() => clearPress, []);

    // 👍 x2  ❤️ x1 ...
    const reactionList = useMemo(() => {
        const entries = Object.entries(m.reactions || {});
        if (!entries.length) return [];
        const map = new Map<string, { emoji: string; count: number; mine: boolean }>();
        entries.forEach(([suid, emoji]) => {
            const cur = map.get(emoji) || { emoji, count: 0, mine: false };
            cur.count += 1;
            if (suid === meSuid) cur.mine = true;
            map.set(emoji, cur);
        });
        return Array.from(map.values());
    }, [m.reactions, meSuid]);

    const ring = highlight ? `0 0 0 3px ${cv.accent}99` : undefined;
    const bubbleStyle = mine
        ? { background: cv.mine.background, color: cv.mine.color, boxShadow: ring ?? cv.mine.shadow }
        : { background: cv.theirs.background, color: cv.theirs.color, border: cv.theirs.border, boxShadow: ring ?? cv.theirs.shadow };

    const quoteColor = mine ? cv.mine.color : cv.accent;
    const timeColor = mine ? cv.mine.timeColor : cv.theirs.timeColor;

    return (
        <div data-mid={m.id}>
            {day && (
                <div className="my-4 flex justify-center">
                    <span
                        className="rounded-full border px-3.5 py-1 text-[10px] font-semibold uppercase tracking-wider shadow-sm"
                        style={{ background: cv.chip.background, color: cv.chip.color, borderColor: cv.chip.border }}
                    >
                        {day}
                    </span>
                </div>
            )}
            <div className={`group/row flex items-end gap-2 ${mine ? "justify-end" : "justify-start"} ${sameSender ? "mt-1" : "mt-3"}`}>
                {!mine && (
                    <div className="w-8 shrink-0">{!sameSender && <PersonAvatar dark={dark} name={m.sender_name} avatar={avatar} size={32} />}</div>
                )}
                <div className={`flex min-w-0 max-w-[80%] flex-col md:max-w-[68%] ${mine ? "items-end" : "items-start"}`}>
                    <div
                        className={`group/bubble relative max-w-full rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-md ${
                            mine ? "rounded-br-sm" : "rounded-bl-sm"
                        } ${privacy ? "select-none" : ""}`}
                        style={{ ...bubbleStyle, WebkitTouchCallout: "none" } as React.CSSProperties}
                        onContextMenu={(e) => {
                            if ((e.target as HTMLElement).closest("a")) return;
                            e.preventDefault();
                            onMenu(m.id, e.clientX, e.clientY);
                        }}
                        onTouchStart={(e) => {
                            const t = e.touches[0];
                            if (!t) return;
                            const x = t.clientX;
                            const y = t.clientY;
                            clearPress();
                            pressTimer.current = window.setTimeout(() => {
                                pressTimer.current = null;
                                onMenu(m.id, x, y);
                            }, 450);
                        }}
                        onTouchMove={clearPress}
                        onTouchEnd={clearPress}
                        onTouchCancel={clearPress}
                    >
                        {/* Chevron (opens the same menu as right click / long press) */}
                        <button
                            type="button"
                            aria-label="Message options"
                            title="Message options"
                            onClick={(e) => {
                                const r = e.currentTarget.getBoundingClientRect();
                                onMenu(m.id, r.right, r.bottom);
                            }}
                            className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full text-base opacity-0 shadow transition-opacity focus-visible:opacity-100 group-hover/bubble:opacity-100"
                            style={{ background: mine ? cv.mine.background : cv.theirs.background, color: mine ? cv.mine.color : cv.theirs.color }}
                        >
                            <IoChevronDown />
                        </button>

                        {showName && (
                            <p className="mb-1 text-[11px] font-bold tracking-wide" style={{ color: nameColor }}>
                                {m.sender_name}
                            </p>
                        )}

                        {m.deleted ? (
                            <p className="flex items-center gap-1.5 pr-5 italic opacity-75">
                                <IoBanOutline className="shrink-0" />
                                {mine ? "You deleted this message" : "This message was deleted"}
                            </p>
                        ) : (
                            <>
                                {m.forwarded && (
                                    <p className="mb-1 flex items-center gap-1 text-[11px] italic opacity-75">
                                        <IoArrowRedoOutline /> Forwarded
                                    </p>
                                )}

                                {m.replyTo && (
                                    <button
                                        type="button"
                                        onClick={() => onJump(m.replyTo!.id)}
                                        className="mb-1.5 block w-full min-w-40 rounded-lg border-l-4 px-2.5 py-1.5 text-left"
                                        style={{ borderColor: cv.accent, background: "rgba(127,127,127,.18)" }}
                                    >
                                        <span className="block truncate text-[11px] font-bold" style={{ color: quoteColor }}>
                                            {m.replyTo.suid === meSuid ? "You" : m.replyTo.name}
                                        </span>
                                        <span className="line-clamp-2 block text-xs opacity-85 wrap-break-word">{m.replyTo.text}</span>
                                    </button>
                                )}

                                {m.file && isImg && (
                                    <button
                                        type="button"
                                        onClick={() => fileData && onOpenMedia(m.id)}
                                        disabled={!fileData}
                                        aria-label={`Open photo ${m.file.name}`}
                                        className="mb-1 block w-full overflow-hidden rounded-xl"
                                    >
                                        {fileData ? (
                                            <img
                                                src={fileData}
                                                alt={m.file.name}
                                                draggable={false}
                                                onContextMenu={privacy ? (e) => e.preventDefault() : undefined}
                                                className="max-h-72 w-full min-w-44 rounded-xl object-cover"
                                            />
                                        ) : (
                                            <span className="flex h-28 min-w-44 items-center justify-center rounded-xl bg-black/10 text-xs font-medium opacity-80">
                                                Photo unavailable
                                            </span>
                                        )}
                                    </button>
                                )}

                                {m.file && !isImg && (
                                    <div className="mb-1 flex min-w-52 items-center gap-3 rounded-xl p-2.5" style={{ background: "rgba(127,127,127,.18)" }}>
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/15 text-xl">
                                            <IoDocumentTextOutline />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-semibold">{m.file.name}</span>
                                            <span className="block text-[11px] opacity-75">
                                                {fileExt(m.file.name)} · {formatBytes(m.file.size)}
                                            </span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => onDownload(m)}
                                            aria-label={privacy ? "Download blocked" : `Download ${m.file.name}`}
                                            title={privacy ? "Blocked by Advanced chat privacy" : "Download"}
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/15 text-lg hover:bg-black/25"
                                        >
                                            {privacy ? <IoLockClosedOutline /> : <IoDownloadOutline />}
                                        </button>
                                    </div>
                                )}

                                {m.text && <p className="whitespace-pre-wrap wrap-break-word">{renderText(m.text)}</p>}
                            </>
                        )}

                        <p className="mt-1 flex items-center justify-end gap-1 text-[10px] font-medium" style={{ color: timeColor }}>
                            {pinned && <IoPin className="text-[10px]" />}
                            {starred && <IoStar className="text-[10px] text-amber-400" />}
                            {formatTime(m.time)}
                            {mine && !m.deleted && tick && (
                                <span
                                    aria-label={tick === "read" ? "Read" : tick === "delivered" ? "Delivered" : "Sent"}
                                    className="flex items-center"
                                    style={{ color: tick === "read" ? "#53bdeb" : undefined }}
                                >
                                    {tick === "sent" ? <IoCheckmark className="text-xs" /> : <IoCheckmarkDone className="text-sm" />}
                                </span>
                            )}
                        </p>
                    </div>

                    {reactionList.length > 0 && (
                        <div className="relative z-1 -mt-2 flex flex-wrap gap-1 px-2">
                            {reactionList.map((r) => (
                                <button
                                    key={r.emoji}
                                    type="button"
                                    onClick={() => onReact(m.id, r.emoji)}
                                    title={r.mine ? "Tap to remove your reaction" : `${r.count} reaction${r.count === 1 ? "" : "s"}`}
                                    className="flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs shadow-sm"
                                    style={{
                                        background: dark ? "#1e293b" : "#ffffff",
                                        color: dark ? "#e2e8f0" : "#334155",
                                        borderColor: r.mine ? cv.accent : dark ? "#334155" : "#e2e8f0",
                                    }}
                                >
                                    <span className="text-sm leading-none">{r.emoji}</span>
                                    {r.count > 1 && <span className="text-[11px] font-semibold">{r.count}</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default MessageRow;
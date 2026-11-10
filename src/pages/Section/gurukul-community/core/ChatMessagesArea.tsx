import React from "react";
import {
    IoTimerOutline,
    IoShieldCheckmarkOutline,
    IoLockClosedOutline,
} from "react-icons/io5";
import { LogoTile } from "../ui/LogoTile";
import { MessageRow } from "./MessageRow";
import { Composer } from "./Composer";
import { ttlLabel, HIDE_SCROLL } from "../constants";
import type { ChatMessage, ChatVars, SharedSettings } from "../types";

export type ChatMessagesAreaProps = {
    dark: boolean;
    cv: ChatVars;
    title: string;
    convKey: string;
    messages: ChatMessage[];
    rows: {
        m: ChatMessage;
        day: string | null;
        mine: boolean;
        sameSender: boolean;
        showName: boolean;
        nameColor: string;
        avatar?: string;
    }[];
    starredSet: Set<string>;
    highlightId: string | null;
    shared: SharedSettings;
    hasEarlier: boolean;
    canSend: boolean;
    adminBlocked: boolean;
    meName: string;
    messagesRef: React.RefObject<HTMLDivElement | null>;
    onMessagesScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    onLoadEarlier: () => void;
    onStar: (id: string) => void;
    onOpenMedia: (id: string) => void;
    onDownload: (m: ChatMessage) => void;
    onSend: (text: string, files: File[]) => Promise<boolean>;
};

export function ChatMessagesArea({
    dark,
    cv,
    title,
    convKey,
    messages,
    rows,
    starredSet,
    highlightId,
    shared,
    hasEarlier,
    canSend,
    adminBlocked,
    meName,
    messagesRef,
    onMessagesScroll,
    onLoadEarlier,
    onStar,
    onOpenMedia,
    onDownload,
    onSend,
}: ChatMessagesAreaProps) {
    const subText = dark ? "text-slate-400" : "text-slate-500";

    return (
        <>
            {/* Messages */}
            <div
                ref={messagesRef}
                onScroll={onMessagesScroll}
                onCopy={shared.advPrivacy ? (e) => e.preventDefault() : undefined}
                onCut={shared.advPrivacy ? (e) => e.preventDefault() : undefined}
                className={`flex-1 min-h-0 overflow-y-auto px-4 md:px-8 py-6 space-y-3 ${
                    shared.advPrivacy ? "select-none" : ""
                } ${HIDE_SCROLL}`}
                style={cv.wallpaper}
            >
                {(shared.ttl > 0 || shared.advPrivacy) && (
                    <div className="flex flex-wrap justify-center gap-2">
                        {shared.ttl > 0 && (
                            <span
                                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold shadow-sm"
                                style={{
                                    background: cv.chip.background,
                                    color: cv.chip.color,
                                    borderColor: cv.chip.border,
                                }}
                            >
                                <IoTimerOutline /> Disappearing messages · {ttlLabel(shared.ttl)}
                            </span>
                        )}
                        {shared.advPrivacy && (
                            <span
                                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold shadow-sm"
                                style={{
                                    background: cv.chip.background,
                                    color: cv.chip.color,
                                    borderColor: cv.chip.border,
                                }}
                            >
                                <IoShieldCheckmarkOutline /> Advanced chat privacy is on
                            </span>
                        )}
                    </div>
                )}

                {hasEarlier && (
                    <div className="flex justify-center">
                        <button
                            onClick={onLoadEarlier}
                            className="rounded-full border px-4 py-1.5 text-xs font-semibold shadow-sm"
                            style={{
                                background: cv.chip.background,
                                color: cv.chip.color,
                                borderColor: cv.chip.border,
                            }}
                        >
                            Load earlier messages
                        </button>
                    </div>
                )}

                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                        <LogoTile dark={dark} size={72} />
                        <p className={`text-lg font-bold tracking-tight ${dark ? "text-slate-200" : "text-slate-800"}`}>
                            {title}
                        </p>
                        <p className={`text-xs max-w-xs ${subText}`}>
                            There are no messages yet. Send a message first and start the conversation.
                        </p>
                    </div>
                )}

                {rows.map((r) => (
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
                        starred={starredSet.has(r.m.id)}
                        highlight={highlightId === r.m.id}
                        privacy={shared.advPrivacy}
                        onStar={onStar}
                        onOpenMedia={onOpenMedia}
                        onDownload={onDownload}
                    />
                ))}
            </div>

            {/* Footer / Input */}
            <footer
                className={`shrink-0 px-3 md:px-5 py-3 border-t ${
                    dark ? "bg-[#0E1626] border-slate-700/80" : "bg-white border-slate-200"
                }`}
                style={{ backgroundImage: `linear-gradient(${cv.headerTint}, ${cv.headerTint})` }}
            >
                {canSend ? (
                    <Composer key={convKey} dark={dark} cv={cv} meName={meName} onSend={onSend} />
                ) : (
                    <div className={`flex items-center justify-center gap-2 py-3 text-xs font-medium ${subText}`}>
                        <IoLockClosedOutline className="text-base" />
                        {adminBlocked ? "Only admins can send messages" : "You are not a member of this group"}
                    </div>
                )}
            </footer>
        </>
    );
}

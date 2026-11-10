import { memo, useMemo } from "react";
import {
    IoStar,
    IoStarOutline,
    IoDocumentTextOutline,
    IoLockClosedOutline,
    IoDownloadOutline,
} from "react-icons/io5";
import { PersonAvatar } from "../ui/PersonAvatar";
import { loadFileData } from "../utils/storage";
import { formatTime, formatBytes, fileExt } from "../utils/formatters";
import { isImageMime, renderText } from "../utils/linksAndMedia";
import type { ChatMessage, ChatVars } from "../types";

export type MessageRowProps = {
    m: ChatMessage;
    day: string | null;
    mine: boolean;
    sameSender: boolean;
    showName: boolean;
    nameColor: string;
    avatar?: string;
    dark: boolean;
    cv: ChatVars;
    starred: boolean;
    highlight: boolean;
    privacy: boolean;
    onStar: (id: string) => void;
    onOpenMedia: (id: string) => void;
    onDownload: (m: ChatMessage) => void;
};

export const MessageRow = memo(function MessageRow({
    m,
    day,
    mine,
    sameSender,
    showName,
    nameColor,
    avatar,
    dark,
    cv,
    starred,
    highlight,
    privacy,
    onStar,
    onOpenMedia,
    onDownload,
}: MessageRowProps) {
    const fileData = useMemo(() => (m.file ? loadFileData(m.id) : null), [m.id, m.file]);
    const isImg = !!m.file && isImageMime(m.file.mime);

    const starBtn = (
        <button
            type="button"
            onClick={() => onStar(m.id)}
            aria-label={starred ? "Remove star" : "Star message"}
            title={starred ? "Remove star" : "Star message"}
            className={`flex h-7 w-7 shrink-0 items-center justify-center self-center rounded-full text-sm opacity-0 transition-opacity focus-visible:opacity-100 group-hover/row:opacity-100 ${
                dark ? "text-slate-300 hover:bg-slate-700/70" : "text-slate-600 hover:bg-slate-200/70"
            }`}
        >
            {starred ? <IoStar className="text-amber-400" /> : <IoStarOutline />}
        </button>
    );

    const bubbleStyle = mine
        ? {
              background: cv.mine.background,
              color: cv.mine.color,
              boxShadow: highlight ? `0 0 0 3px ${cv.accent}99` : cv.mine.shadow,
          }
        : {
              background: cv.theirs.background,
              color: cv.theirs.color,
              border: cv.theirs.border,
              boxShadow: highlight ? `0 0 0 3px ${cv.accent}99` : cv.theirs.shadow,
          };

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
                    <div className="w-8 shrink-0">
                        {!sameSender && <PersonAvatar dark={dark} name={m.sender_name} avatar={avatar} size={32} />}
                    </div>
                )}
                {mine && starBtn}
                <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-md md:max-w-[68%] ${
                        mine ? "rounded-br-sm" : "rounded-bl-sm"
                    } ${privacy ? "select-none" : ""}`}
                    style={bubbleStyle}
                >
                    {showName && (
                        <p className="mb-1 text-[11px] font-bold tracking-wide" style={{ color: nameColor }}>
                            {m.sender_name}
                        </p>
                    )}

                    {/* Photo */}
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

                    {/* Document */}
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
                    <p
                        className="mt-1 flex items-center justify-end gap-1 text-[10px] font-medium"
                        style={{ color: mine ? cv.mine.timeColor : cv.theirs.timeColor }}
                    >
                        {starred && <IoStar className="text-[10px] text-amber-400" />}
                        {formatTime(m.time)}
                    </p>
                </div>
                {!mine && starBtn}
            </div>
        </div>
    );
});

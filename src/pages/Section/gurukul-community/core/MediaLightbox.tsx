import {
    IoClose,
    IoChevronBack,
    IoChevronForward,
    IoDownloadOutline,
    IoLockClosedOutline,
} from "react-icons/io5";
import { loadFileData, getShared } from "../utils/storage";
import { formatDay, formatTime } from "../utils/formatters";
import type { ChatMessage, ChatUser, MediaItem } from "../types";

export type MediaLightboxProps = {
    lightbox: { items: MediaItem[]; index: number } | null;
    me: ChatUser;
    mediaScope: "chat" | "all";
    onClose: () => void;
    onGo: (delta: number) => void;
    onDownload: (m: ChatMessage) => void;
};

export function MediaLightbox({
    lightbox,
    me,
    mediaScope,
    onClose,
    onGo,
    onDownload,
}: MediaLightboxProps) {
    if (!lightbox) return null;
    const item = lightbox.items[lightbox.index];
    if (!item) return null;

    const data = loadFileData(item.msg.id);
    const priv = getShared(item.convKey).advPrivacy;
    const navBtn =
        "absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/25 disabled:opacity-30";

    return (
        <div
            className="absolute inset-0 z-50 flex flex-col bg-black/95 text-white"
            role="dialog"
            aria-modal="true"
            aria-label="Photo viewer"
        >
            <div className="flex shrink-0 items-center gap-3 px-3 py-3 md:px-5">
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/15"
                >
                    <IoClose className="text-2xl" />
                </button>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                        {item.msg.sender_suid === me.suid ? "You" : item.msg.sender_name}
                    </p>
                    <p className="truncate text-[11px] text-white/70">
                        {formatDay(item.msg.time)} · {formatTime(item.msg.time)}
                        {mediaScope === "all" && item.chat ? ` · ${item.chat}` : ""}
                    </p>
                </div>
                <span className="text-xs text-white/70">
                    {lightbox.index + 1} / {lightbox.items.length}
                </span>
                {priv ? (
                    <span
                        title="Download blocked by Advanced chat privacy"
                        className="flex h-10 w-10 items-center justify-center text-xl text-white/70"
                    >
                        <IoLockClosedOutline />
                    </span>
                ) : (
                    <button
                        onClick={() => onDownload(item.msg)}
                        aria-label="Download"
                        title="Download"
                        className="flex h-10 w-10 items-center justify-center rounded-full text-xl hover:bg-white/15"
                    >
                        <IoDownloadOutline />
                    </button>
                )}
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4">
                <button
                    className={`${navBtn} left-3`}
                    onClick={() => onGo(-1)}
                    disabled={lightbox.index === 0}
                    aria-label="Previous photo"
                >
                    <IoChevronBack />
                </button>
                {data ? (
                    <img
                        src={data}
                        alt={item.msg.file?.name || "Photo"}
                        draggable={false}
                        onContextMenu={priv ? (e) => e.preventDefault() : undefined}
                        className={`max-h-full max-w-full rounded-lg object-contain ${priv ? "select-none" : ""}`}
                    />
                ) : (
                    <p className="text-sm text-white/70">This photo is no longer available</p>
                )}
                <button
                    className={`${navBtn} right-3`}
                    onClick={() => onGo(1)}
                    disabled={lightbox.index >= lightbox.items.length - 1}
                    aria-label="Next photo"
                >
                    <IoChevronForward />
                </button>
            </div>
            {item.msg.text && (
                <p className="shrink-0 px-6 pb-4 text-center text-sm text-white/90 wrap-break-word">
                    {item.msg.text}
                </p>
            )}
        </div>
    );
}

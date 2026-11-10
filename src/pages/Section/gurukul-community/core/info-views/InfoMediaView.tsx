import React from "react";
import {
    IoImagesOutline,
    IoDocumentTextOutline,
    IoLinkOutline,
    IoGlobeOutline,
    IoOpenOutline,
    IoDownloadOutline,
    IoLockClosedOutline,
} from "react-icons/io5";
import { loadFileData, getShared } from "../../utils/storage";
import { formatBytes, formatDay, fileExt } from "../../utils/formatters";
import { groupByMonth, hrefOf, hostOf } from "../../utils/linksAndMedia";
import type { ChatMessage, ChatVars, MediaBuckets, MediaItem, MediaTab } from "../../types";

export type InfoMediaViewProps = {
    dark: boolean;
    cv: ChatVars;
    surface: string;
    subText: string;
    mediaTab: MediaTab;
    setMediaTab: (t: MediaTab) => void;
    mediaScope: "chat" | "all";
    setMediaScope: (fn: (s: "chat" | "all") => "chat" | "all") => void;
    buckets: MediaBuckets;
    now: number;
    onOpenMedia: (id: string, customList?: MediaItem[]) => void;
    onDownload: (m: ChatMessage) => void;
};

export function InfoMediaView({
    dark,
    cv,
    surface,
    subText,
    mediaTab,
    setMediaTab,
    mediaScope,
    setMediaScope,
    buckets,
    now,
    onOpenMedia,
    onDownload,
}: InfoMediaViewProps) {
    const heading = (label: string) => (
        <p className={`px-6 pt-5 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] ${subText}`}>{label}</p>
    );

    const empty = (icon: React.ReactNode, text: string) => (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className={`text-4xl ${subText}`}>{icon}</span>
            <p className={`mt-2 text-xs font-medium ${subText}`}>{text}</p>
        </div>
    );

    const chatLabel = (it: MediaItem) => (mediaScope === "all" && it.chat ? ` · ${it.chat}` : "");

    const mediaTabs: { id: MediaTab; label: string; count: number }[] = [
        { id: "media", label: "Media", count: buckets.media.length },
        { id: "docs", label: "Docs", count: buckets.docs.length },
        { id: "links", label: "Links", count: buckets.links.length },
    ];

    return (
        <div className={`${surface} flex min-h-full flex-col`}>
            {/* Media tabs */}
            <div className={`flex border-b px-2 ${dark ? "border-slate-700/80" : "border-slate-200"}`}>
                {mediaTabs.map((t) => {
                    const on = mediaTab === t.id;
                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setMediaTab(t.id)}
                            className={`flex-1 border-b-2 py-3 text-xs font-semibold transition-colors ${
                                on
                                    ? dark ? "text-white" : "text-slate-900"
                                    : subText
                            }`}
                            style={{ borderColor: on ? cv.accent : "transparent" }}
                        >
                            {t.label}
                            {t.count > 0 && <span className="ml-1 opacity-75">({t.count})</span>}
                        </button>
                    );
                })}
            </div>

            <div className="flex-1 pb-4">
                {mediaTab === "media" &&
                    (buckets.media.length === 0
                        ? empty(<IoImagesOutline className="mx-auto" />, "No media")
                        : groupByMonth(buckets.media, now).map(([label, list]) => (
                            <div key={label}>
                                {heading(label)}
                                <div className="grid grid-cols-3 gap-1 px-3">
                                    {list.map((it) => {
                                        const data = loadFileData(it.msg.id);
                                        const priv = getShared(it.convKey).advPrivacy;
                                        return (
                                            <button
                                                key={`${it.convKey}-${it.msg.id}`}
                                                type="button"
                                                onClick={() => onOpenMedia(it.msg.id, buckets.media)}
                                                className="group relative aspect-square overflow-hidden rounded-md bg-black/10"
                                            >
                                                {data ? (
                                                    <img
                                                        src={data}
                                                        alt=""
                                                        draggable={false}
                                                        onContextMenu={priv ? (e) => e.preventDefault() : undefined}
                                                        className={`h-full w-full object-cover transition-transform group-hover:scale-105 ${
                                                            priv ? "select-none" : ""
                                                        }`}
                                                    />
                                                ) : (
                                                    <span className={`flex h-full w-full items-center justify-center text-[10px] ${subText}`}>
                                                        Unavailable
                                                    </span>
                                                )}
                                                {mediaScope === "all" && it.chat && (
                                                    <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-[9px] text-white">
                                                        {it.chat}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )))}

                {mediaTab === "docs" &&
                    (buckets.docs.length === 0
                        ? empty(<IoDocumentTextOutline className="mx-auto" />, "No documents")
                        : groupByMonth(buckets.docs, now).map(([label, list]) => (
                            <div key={label}>
                                {heading(label)}
                                <div className="space-y-1 px-3">
                                    {list.map((it) => {
                                        const priv = getShared(it.convKey).advPrivacy;
                                        return (
                                            <button
                                                key={`${it.convKey}-${it.msg.id}`}
                                                type="button"
                                                onClick={() => onDownload(it.msg)}
                                                title={priv ? "Blocked by Advanced chat privacy" : "Download"}
                                                className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left transition-colors ${
                                                    dark ? "hover:bg-slate-800" : "hover:bg-slate-50"
                                                }`}
                                            >
                                                <span
                                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl text-white"
                                                    style={{ background: cv.accentGradient }}
                                                >
                                                    <IoDocumentTextOutline />
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className={`block truncate text-sm font-semibold ${dark ? "text-slate-100" : "text-slate-800"}`}>
                                                        {it.msg.file?.name}
                                                    </span>
                                                    <span className={`block truncate text-xs ${subText}`}>
                                                        {fileExt(it.msg.file?.name || "")} · {formatBytes(it.msg.file?.size || 0)} · {formatDay(it.msg.time)}
                                                        {chatLabel(it)}
                                                    </span>
                                                </span>
                                                <span className={`shrink-0 text-lg ${subText}`}>
                                                    {priv ? <IoLockClosedOutline /> : <IoDownloadOutline />}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )))}

                {mediaTab === "links" &&
                    (buckets.links.length === 0
                        ? empty(<IoLinkOutline className="mx-auto" />, "No links")
                        : groupByMonth(buckets.links, now).map(([label, list]) => (
                            <div key={label}>
                                {heading(label)}
                                <div className="space-y-1 px-3">
                                    {list.map((it) => (
                                        <a
                                            key={it.key}
                                            href={hrefOf(it.url)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left transition-colors ${
                                                dark ? "hover:bg-slate-800" : "hover:bg-slate-50"
                                            }`}
                                        >
                                            <span
                                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
                                                    dark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"
                                                }`}
                                            >
                                                <IoGlobeOutline />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className={`block truncate text-sm font-semibold ${dark ? "text-slate-100" : "text-slate-800"}`}>
                                                    {hostOf(it.url)}
                                                </span>
                                                <span className="block truncate text-xs" style={{ color: cv.accent }}>
                                                    {it.url}
                                                </span>
                                                <span className={`block truncate text-[11px] ${subText}`}>
                                                    {it.msg.sender_suid === it.convKey ? "You" : it.msg.sender_name} · {formatDay(it.msg.time)}
                                                    {chatLabel(it)}
                                                </span>
                                            </span>
                                            <IoOpenOutline className={`shrink-0 text-base ${subText}`} />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )))}
            </div>

            <div className={`sticky bottom-0 border-t px-4 py-3 text-center ${dark ? "border-slate-700/80 bg-[#0E1626]" : "border-slate-200 bg-white"}`}>
                <button
                    type="button"
                    onClick={() => setMediaScope((s) => (s === "chat" ? "all" : "chat"))}
                    className="inline-flex items-center gap-2 text-sm font-semibold"
                    style={{ color: cv.accent }}
                >
                    <IoImagesOutline className="text-lg" />
                    {mediaScope === "chat" ? "View media from all chats" : "View media from this chat"}
                </button>
            </div>
        </div>
    );
}

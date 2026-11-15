import { IoDocumentTextOutline, IoDownloadOutline, IoGlobeOutline, IoImagesOutline, IoLinkOutline, IoLockClosedOutline, IoOpenOutline } from "react-icons/io5";
import type { MediaTab } from "../../types";
import { getShared, loadFileData } from "../../utils/storage";
import { formatDay } from "../../utils/formatters";
import { fileExt, formatBytes, groupByMonth, hostOf, hrefOf } from "../../utils/chatHelpers";
import type { InfoCtx } from "./infoTypes";

export function InfoMedia({ c }: { c: InfoCtx }) {
    const { dark, cv, surface, subText, buckets, mediaTab, mediaScope, now, me } = c;
    const rowHover = dark ? "hover:bg-slate-800" : "hover:bg-slate-50";
    const nameColor = dark ? "text-slate-100" : "text-slate-800";

    const tabs: { id: MediaTab; label: string; count: number }[] = [
        { id: "media", label: "Media", count: buckets.media.length },
        { id: "docs", label: "Docs", count: buckets.docs.length },
        { id: "links", label: "Links", count: buckets.links.length },
    ];

    const heading = (label: string) => <p className={`px-4 pt-5 pb-2 text-[11px] font-bold uppercase tracking-wider ${subText}`}>{label}</p>;

    const empty = (icon: React.ReactNode, text: string) => (
        <div className="flex flex-col items-center px-8 py-16 text-center">
            <span className={`text-5xl ${dark ? "text-slate-600" : "text-slate-300"}`}>{icon}</span>
            <p className={`mt-3 text-sm font-semibold ${dark ? "text-slate-300" : "text-slate-700"}`}>{text}</p>
            <p className={`mt-1 text-xs ${subText}`}>{mediaScope === "all" ? "Nothing shared in any of your chats yet." : "Nothing has been shared in this chat yet."}</p>
        </div>
    );

    const where = (chat: string) => (mediaScope === "all" && chat ? ` · ${chat}` : "");

    return (
        <div className={`${surface} flex min-h-full flex-col`}>
            <div role="tablist" className={`sticky top-0 z-10 flex border-b ${dark ? "border-slate-700/80 bg-[#0E1626]" : "border-slate-200 bg-white"}`}>
                {tabs.map((t) => {
                    const on = mediaTab === t.id;
                    return (
                        <button
                            key={t.id}
                            role="tab"
                            aria-selected={on}
                            onClick={() => c.setMediaTab(t.id)}
                            className={`relative flex-1 py-3 text-sm font-semibold transition-colors ${on ? (dark ? "text-white" : "text-slate-900") : subText}`}
                        >
                            {t.label}
                            {t.count > 0 && <span className="ml-1.5 text-[11px] opacity-70">{t.count}</span>}
                            {on && <span className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: cv.accent }} />}
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
                                <div className="grid grid-cols-3 gap-1.5 px-3">
                                    {list.map((it) => {
                                        const data = loadFileData(it.msg.id);
                                        const priv = getShared(it.convKey).advPrivacy;
                                        return (
                                            <button
                                                key={`${it.convKey}-${it.msg.id}`}
                                                type="button"
                                                onClick={() => c.onOpenMedia(it.msg.id, buckets.media)}
                                                aria-label={`Open ${it.msg.file?.name || "photo"}`}
                                                className={`relative aspect-square overflow-hidden rounded-lg border ${dark ? "border-slate-700/70 bg-slate-900" : "border-slate-200 bg-slate-100"}`}
                                            >
                                                {data ? (
                                                    <img
                                                        src={data}
                                                        alt=""
                                                        loading="lazy"
                                                        draggable={false}
                                                        onContextMenu={priv ? (e) => e.preventDefault() : undefined}
                                                        className="h-full w-full object-cover transition-transform hover:scale-105"
                                                    />
                                                ) : (
                                                    <span className={`flex h-full items-center justify-center text-[10px] ${subText}`}>Unavailable</span>
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
                                                onClick={() => c.onDownload(it.msg)}
                                                title={priv ? "Blocked by Advanced chat privacy" : "Download"}
                                                className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left transition-colors ${rowHover}`}
                                            >
                                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl text-white" style={{ background: cv.accentGradient }}>
                                                    <IoDocumentTextOutline />
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className={`block truncate text-sm font-semibold ${nameColor}`}>{it.msg.file?.name}</span>
                                                    <span className={`block truncate text-xs ${subText}`}>
                                                        {fileExt(it.msg.file?.name || "")} · {formatBytes(it.msg.file?.size || 0)} · {formatDay(it.msg.time)}
                                                        {where(it.chat)}
                                                    </span>
                                                </span>
                                                <span className={`shrink-0 text-lg ${subText}`}>{priv ? <IoLockClosedOutline /> : <IoDownloadOutline />}</span>
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
                                            className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left transition-colors ${rowHover}`}
                                        >
                                            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${dark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                                                <IoGlobeOutline />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className={`block truncate text-sm font-semibold ${nameColor}`}>{hostOf(it.url)}</span>
                                                <span className="block truncate text-xs" style={{ color: cv.accent }}>{it.url}</span>
                                                <span className={`block truncate text-[11px] ${subText}`}>
                                                    {it.msg.sender_suid === me.suid ? "You" : it.msg.sender_name} · {formatDay(it.msg.time)}
                                                    {where(it.chat)}
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
                    onClick={() => c.setMediaScope(mediaScope === "chat" ? "all" : "chat")}
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

export default InfoMedia;
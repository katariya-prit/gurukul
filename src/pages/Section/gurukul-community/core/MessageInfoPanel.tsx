import { IoArrowRedoOutline, IoCheckmarkDone, IoClose, IoDocumentTextOutline } from "react-icons/io5";
import type { ChatMessage, ChatUser, DirUser } from "../types";
import type { ChatVars } from "../messageTypes";
import type { MessageActions } from "../hooks/useMessageActions";
import { PersonAvatar } from "../ui/PersonAvatar";
import { loadFileData } from "../utils/storage";
import { formatDay } from "../utils/formatters";
import { isImageMime } from "../utils/linksAndMedia";
import { HIDE_SCROLL, formatTime, renderText } from "../utils/chatHelpers";

type Props = {
    dark: boolean;
    cv: ChatVars;
    actions: MessageActions;
    messages: ChatMessage[];
    me: ChatUser;
    isGroup: boolean;
    members: any[];
    activePeer: DirUser | null;
    directory: DirUser[];
};

/** WhatsApp style "Message info": who read / received my message. */
export function MessageInfoPanel({ dark, cv, actions, messages, me, isGroup, members, activePeer, directory }: Props) {
    const { msgInfoId, setMsgInfoId, reads, recipients } = actions;
    if (!msgInfoId) return null;
    const m = messages.find((x) => x.id === msgInfoId);
    if (!m) return null;

    const subText = dark ? "text-slate-400" : "text-slate-500";
    const r = reads[m.id] || {};
    const fmt = (v: number | string) => {
        const iso = typeof v === "number" ? new Date(v).toISOString() : v;
        return `${formatDay(iso)} at ${formatTime(iso)}`;
    };
    const person = (suid: string) => {
        const mm = members.find((x) => String(x.suid) === suid);
        const d = directory.find((x) => x.suid === suid);
        return { name: mm?.name || d?.name || `User ${suid}`, avatar: mm?.avatar ?? d?.avatar };
    };

    const img = !!m.file && isImageMime(m.file.mime);
    const data = m.file && img ? loadFileData(m.id) : null;
    const allRead = recipients.length > 0 && recipients.every((s) => r[s]);
    const readBy = recipients.filter((s) => r[s]).sort((a, b) => r[b] - r[a]);
    const notRead = recipients.filter((s) => !r[s]);
    const blue = { color: "#53bdeb" };

    const statusRow = (key: string, read: boolean, label: string, time?: string) => (
        <div key={key} className="flex items-start gap-5 px-6 py-4">
            <IoCheckmarkDone className={`mt-1 shrink-0 text-xl ${read ? "" : subText}`} style={read ? blue : undefined} />
            <div className="min-w-0">
                <p className="text-base font-medium">{label}</p>
                <p className={`text-sm ${subText}`}>{time ?? "—"}</p>
            </div>
        </div>
    );

    const sectionHead = (read: boolean, label: string, count: number) => (
        <div className="flex items-center gap-4 px-6 pt-5 pb-2">
            <IoCheckmarkDone className={`shrink-0 text-xl ${read ? "" : subText}`} style={read ? blue : undefined} />
            <p className="text-sm font-semibold">
                {label} <span className={`font-normal ${subText}`}>· {count}</span>
            </p>
        </div>
    );

    const personRow = (suid: string, time: string) => {
        const p = person(suid);
        return (
            <div key={suid} className="flex items-center gap-3.5 px-6 py-2.5">
                <PersonAvatar dark={dark} name={p.name} avatar={p.avatar} size={40} />
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{p.name}</span>
                    <span className={`block truncate text-xs ${subText}`}>{time}</span>
                </span>
            </div>
        );
    };

    return (
        <div
            className={`absolute inset-0 z-30 flex flex-col ${dark ? "bg-[#0B1120] text-slate-100" : "bg-[#F8FAFC] text-slate-900"}`}
            style={{ animation: "gkInfoIn .22s cubic-bezier(.2,.8,.2,1)" }}
        >
            <div className="h-0.5 shrink-0" style={{ backgroundImage: `linear-gradient(to right, transparent, ${cv.accent}, transparent)` }} />
            <div className={`flex shrink-0 items-center gap-3 border-b px-3 py-3 md:px-5 ${dark ? "border-slate-700/80 bg-[#0E1626]" : "border-slate-200 bg-white"}`}>
                <button
                    onClick={() => setMsgInfoId(null)}
                    aria-label="Close"
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${dark ? "text-slate-200 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"}`}
                >
                    <IoClose className="text-xl" />
                </button>
                <h3 className="text-base font-bold tracking-tight">Message info</h3>
            </div>

            <div className={`min-h-0 flex-1 overflow-y-auto ${HIDE_SCROLL}`}>
                <div className="px-4 py-6 md:px-8" style={cv.wallpaper}>
                    <div className="flex justify-end">
                        <div
                            className="max-w-[85%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed shadow-md md:max-w-[68%]"
                            style={{ background: cv.mine.background, color: cv.mine.color, boxShadow: cv.mine.shadow }}
                        >
                            {m.forwarded && (
                                <p className="mb-1 flex items-center gap-1 text-[11px] italic opacity-75">
                                    <IoArrowRedoOutline /> Forwarded
                                </p>
                            )}
                            {m.replyTo && (
                                <div className="mb-1.5 rounded-lg border-l-4 px-2.5 py-1.5" style={{ borderColor: cv.accent, background: "rgba(127,127,127,.18)" }}>
                                    <span className="block truncate text-[11px] font-bold">{m.replyTo.suid === me.suid ? "You" : m.replyTo.name}</span>
                                    <span className="line-clamp-2 block text-xs opacity-85 wrap-break-word">{m.replyTo.text}</span>
                                </div>
                            )}
                            {m.file && img && data && <img src={data} alt={m.file.name} draggable={false} className="mb-1 max-h-48 rounded-xl object-cover" />}
                            {m.file && !img && (
                                <div className="mb-1 flex items-center gap-2.5 rounded-xl p-2.5" style={{ background: "rgba(127,127,127,.18)" }}>
                                    <IoDocumentTextOutline className="text-xl" />
                                    <span className="min-w-0 truncate text-sm font-semibold">{m.file.name}</span>
                                </div>
                            )}
                            {m.text && <p className="whitespace-pre-wrap wrap-break-word">{renderText(m.text)}</p>}
                            <p className="mt-1 flex items-center justify-end gap-1 text-[10px] font-medium" style={{ color: cv.mine.timeColor }}>
                                {formatTime(m.time)}
                                <IoCheckmarkDone className="text-sm" style={{ color: allRead ? "#53bdeb" : undefined }} />
                            </p>
                        </div>
                    </div>
                </div>

                {!isGroup && (
                    <div className="pt-6">
                        {statusRow("read", !!(activePeer && r[activePeer.suid]), "Read", activePeer && r[activePeer.suid] ? fmt(r[activePeer.suid]) : undefined)}
                        {statusRow("delivered", false, "Delivered", fmt(m.time))}
                    </div>
                )}

                {isGroup && (
                    <div className="pb-6">
                        {sectionHead(true, "Read by", readBy.length)}
                        {readBy.length === 0 && <p className={`px-6 py-2 text-xs ${subText}`}>No one has read this message yet</p>}
                        {readBy.map((s) => personRow(s, fmt(r[s])))}
                        {sectionHead(false, "Delivered to", notRead.length)}
                        {notRead.length === 0 && <p className={`px-6 py-2 text-xs ${subText}`}>Everyone has read this message</p>}
                        {notRead.map((s) => personRow(s, fmt(m.time)))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MessageInfoPanel;
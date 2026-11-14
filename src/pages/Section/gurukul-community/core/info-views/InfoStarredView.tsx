import { IoStar, IoStarOutline } from "react-icons/io5";
import { formatDay } from "../../utils/formatters";
import { formatTime, previewOf } from "../../utils/chatHelpers";
import type { InfoCtx } from "./infoTypes";

export function InfoStarred({ c }: { c: InfoCtx }) {
    const { dark, cv, subText, starredMessages, me } = c;

    if (starredMessages.length === 0) {
        return (
            <div className="flex flex-col items-center px-8 py-16 text-center">
                <IoStarOutline className={`text-5xl ${dark ? "text-slate-600" : "text-slate-300"}`} />
                <p className={`mt-3 text-sm font-semibold ${dark ? "text-slate-300" : "text-slate-700"}`}>No starred messages</p>
                <p className={`mt-1 text-xs ${subText}`}>Right-click (or long-press) a message and choose Star to save it here.</p>
            </div>
        );
    }

    return (
        <div className="py-3">
            {starredMessages.map((m) => (
                <div key={m.id} className={`mx-3 mb-2 flex items-start gap-3 rounded-xl border p-3 ${dark ? "border-slate-700/70 bg-[#0E1626]" : "border-slate-200 bg-white"}`}>
                    <button type="button" onClick={() => c.onJumpToMessage(m.id)} className="min-w-0 flex-1 text-left" title="Go to message">
                        <span className="flex items-center justify-between gap-2">
                            <span className="truncate text-xs font-bold" style={{ color: cv.accent }}>
                                {m.sender_suid === me.suid ? "You" : m.sender_name}
                            </span>
                            <span className={`shrink-0 text-[10px] font-medium ${subText}`}>
                                {formatDay(m.time)} · {formatTime(m.time)}
                            </span>
                        </span>
                        <span className={`mt-1 line-clamp-4 block whitespace-pre-wrap wrap-break-word text-sm ${dark ? "text-slate-200" : "text-slate-700"}`}>{previewOf(m)}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => c.onStar(m.id)}
                        aria-label="Remove star"
                        title="Remove star"
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${dark ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
                    >
                        <IoStar className="text-amber-400" />
                    </button>
                </div>
            ))}
        </div>
    );
}

export default InfoStarred;
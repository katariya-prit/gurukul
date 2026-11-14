import { IoClose, IoPin } from "react-icons/io5";
import type { ChatVars } from "../messageTypes";
import type { MessageActions } from "../hooks/useMessageActions";
import { previewOf } from "../utils/chatHelpers";

type Props = {
    dark: boolean;
    cv: ChatVars;
    actions: MessageActions;
    meSuid: string;
    canSend: boolean;
    onJump: (id: string) => void;
};

export function PinnedBanner({ dark, cv, actions, meSuid, canSend, onJump }: Props) {
    const { pinnedMessages, pinIdx, setPinIdx, togglePin } = actions;
    if (!pinnedMessages.length) return null;
    const idx = pinIdx % pinnedMessages.length;
    const pin = pinnedMessages[idx];

    return (
        <div className={`flex shrink-0 items-center gap-2 border-b px-3 py-2 md:px-5 ${dark ? "border-slate-700/80 bg-[#0E1626]" : "border-slate-200 bg-white"}`}>
            <button
                type="button"
                onClick={() => {
                    onJump(pin.id);
                    if (pinnedMessages.length > 1) setPinIdx((i) => (i + 1) % pinnedMessages.length);
                }}
                title="Go to pinned message"
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
                <IoPin className="shrink-0 text-lg" style={{ color: cv.accent }} />
                <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-bold" style={{ color: cv.accent }}>
                        Pinned message{pinnedMessages.length > 1 ? ` · ${idx + 1}/${pinnedMessages.length}` : ""}
                    </span>
                    <span className={`block truncate text-xs ${dark ? "text-slate-300" : "text-slate-600"}`}>
                        {pin.sender_suid === meSuid ? "You" : pin.sender_name}: {previewOf(pin)}
                    </span>
                </span>
            </button>
            {canSend && (
                <button
                    type="button"
                    onClick={() => togglePin(pin)}
                    aria-label="Unpin message"
                    title="Unpin"
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${dark ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"}`}
                >
                    <IoClose className="text-lg" />
                </button>
            )}
        </div>
    );
}

export default PinnedBanner;
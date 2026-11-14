import { IoSearchOutline, IoSend } from "react-icons/io5";
import type { ChatUser } from "../types";
import type { ChatVars } from "../messageTypes";
import type { MessageActions } from "../hooks/useMessageActions";
import { DialogShell } from "../ui/DialogShell";
import { CheckBox } from "../ui/CheckBox";
import { GroupAvatar } from "../ui/GroupAvatar";
import { PersonAvatar } from "../ui/PersonAvatar";
import { HIDE_SCROLL } from "../utils/chatHelpers";

type Props = {
    dark: boolean;
    cv: ChatVars;
    actions: MessageActions;
    me: ChatUser;
    isGroup: boolean;
    meAdmin: boolean;
};

/** "Delete message?" and "Forward message to" dialogs. */
export function MessageDialogs({ dark, cv, actions, me, isGroup, meAdmin }: Props) {
    const { msgDialog, setMsgDialog, fwdSel, fwdQuery, setFwdQuery, toggleFwd, forwardTargets, deleteForMe, deleteForEveryone, forwardMessage } = actions;
    if (!msgDialog) return null;

    const m = msgDialog.msg;
    const subText = dark ? "text-slate-400" : "text-slate-500";

    if (msgDialog.kind === "delete") {
        const everyone = !m.deleted && (m.sender_suid === me.suid || (isGroup && meAdmin));
        const btn = `rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition-colors ${dark ? "hover:bg-slate-800" : "hover:bg-slate-100"}`;
        return (
            <DialogShell dark={dark} title="Delete message?" onClose={() => setMsgDialog(null)}>
                <div className="flex flex-col gap-1 px-3 pb-4 pt-1">
                    {everyone && (
                        <button onClick={() => deleteForEveryone(m)} className={btn} style={{ color: cv.accent }}>
                            Delete for everyone
                        </button>
                    )}
                    <button onClick={() => deleteForMe(m)} className={btn} style={{ color: cv.accent }}>
                        Delete for me
                    </button>
                    <button onClick={() => setMsgDialog(null)} className={btn} style={{ color: cv.accent }}>
                        Cancel
                    </button>
                </div>
            </DialogShell>
        );
    }

    const fq = fwdQuery.trim().toLowerCase();
    const list = forwardTargets.filter((t) => !fq || t.title.toLowerCase().includes(fq));

    return (
        <DialogShell dark={dark} title="Forward message to" onClose={() => setMsgDialog(null)}>
            <div className="px-4 pb-2">
                <div className={`flex items-center gap-2.5 rounded-full px-4 py-2 ${dark ? "bg-slate-800/80" : "bg-slate-100"}`}>
                    <IoSearchOutline className={subText} />
                    <input
                        autoFocus
                        value={fwdQuery}
                        onChange={(e) => setFwdQuery(e.target.value)}
                        placeholder="Search chats..."
                        className={`w-full bg-transparent text-sm outline-none ${dark ? "text-slate-100 placeholder:text-slate-500" : "text-slate-800 placeholder:text-slate-500"}`}
                    />
                </div>
            </div>
            <div className={`max-h-[44vh] overflow-y-auto px-2 ${HIDE_SCROLL}`}>
                {list.map((t) => {
                    const sel = fwdSel.includes(t.key);
                    return (
                        <button
                            key={t.key}
                            type="button"
                            role="checkbox"
                            aria-checked={sel}
                            disabled={!!t.disabled}
                            onClick={() => toggleFwd(t.key)}
                            className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                dark ? "enabled:hover:bg-slate-800" : "enabled:hover:bg-slate-50"
                            }`}
                        >
                            {t.kind === "group" ? (
                                <GroupAvatar dark={dark} name={t.title} size={44} />
                            ) : (
                                <PersonAvatar dark={dark} name={t.title} avatar={t.avatar} size={44} superBadge={t.isSuper} />
                            )}
                            <span className="min-w-0 flex-1">
                                <span className={`block truncate text-sm font-semibold ${dark ? "text-slate-100" : "text-slate-800"}`}>{t.title}</span>
                                <span className={`block truncate text-xs ${subText}`}>{t.disabled || (t.kind === "group" ? "Group" : t.sub || "Direct message")}</span>
                            </span>
                            {!t.disabled && <CheckBox checked={sel} dark={dark} accent={cv.accent} />}
                        </button>
                    );
                })}
                {list.length === 0 && <p className={`py-10 text-center text-xs ${subText}`}>No chats found</p>}
            </div>
            <div className={`border-t px-4 py-3 ${dark ? "border-slate-700/80" : "border-slate-200"}`}>
                <button
                    onClick={() => forwardMessage(m, fwdSel)}
                    disabled={!fwdSel.length}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white shadow-lg transition-all active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ background: cv.accentGradient }}
                >
                    <IoSend />
                    {fwdSel.length ? `Forward to ${fwdSel.length} chat${fwdSel.length === 1 ? "" : "s"}` : "Select chats"}
                </button>
            </div>
        </DialogShell>
    );
}

export default MessageDialogs;
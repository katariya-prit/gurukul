import { IoLockClosedOutline } from "react-icons/io5";
import type { ConvMeta, DialogKind, SharedSettings } from "../types";
import type { ChatVars } from "../messageTypes";
import { DialogShell } from "../ui/DialogShell";
import { RadioRow } from "../ui/RadioRow";
import { MUTE_OPTIONS } from "../constants";
import { TTL_CHOICES } from "../utils/chatHelpers";

type Props = {
    dark: boolean;
    cv: ChatVars;
    dialog: DialogKind;
    setDialog: (d: DialogKind) => void;
    isGroup: boolean;
    title: string;
    meta: ConvMeta;
    shared: SharedSettings;
    mutedNow: boolean;
    onApplyMute: (choice: any) => void;
    onApplyTtl: (ms: number) => void;
    onClearChat: () => void;
    onDeleteChat: () => void;
};

/** Mute, disappearing messages, encryption, clear chat, delete chat. */
export function ChatDialogs(p: Props) {
    const { dark, cv, dialog, setDialog, isGroup, title, meta, shared, mutedNow } = p;
    const subText = dark ? "text-slate-400" : "text-slate-500";
    const close = () => setDialog(null);

    switch (dialog) {
        case "mute":
            return (
                <DialogShell dark={dark} title="Mute notifications" onClose={close}>
                    <p className={`px-5 pb-2 text-xs leading-relaxed ${subText}`}>
                        You won't see notifications for new messages in this chat. Muted chats show a bell icon in your chats list.
                    </p>
                    <div role="radiogroup" className="pb-2">
                        {MUTE_OPTIONS.map((o) => (
                            <RadioRow key={o.id} dark={dark} accent={cv.accent} label={o.label} selected={mutedNow && meta.muteChoice === o.id} onClick={() => p.onApplyMute(o.id)} />
                        ))}
                    </div>
                    {mutedNow && (
                        <div className={`border-t px-5 py-3 ${dark ? "border-slate-700/80" : "border-slate-200"}`}>
                            <button onClick={() => p.onApplyMute("off")} className="text-sm font-semibold" style={{ color: cv.accent }}>
                                Unmute notifications
                            </button>
                        </div>
                    )}
                </DialogShell>
            );

        case "disappearing":
            return (
                <DialogShell dark={dark} title="Disappearing messages" onClose={close}>
                    <p className={`px-5 pb-2 text-xs leading-relaxed ${subText}`}>
                        New messages in this chat will disappear after the selected time. Messages sent earlier are not affected.
                    </p>
                    <div role="radiogroup" className="pb-3">
                        {TTL_CHOICES.map((o) => (
                            <RadioRow key={o.ms} dark={dark} accent={cv.accent} label={o.label} selected={shared.ttl === o.ms} onClick={() => p.onApplyTtl(o.ms)} />
                        ))}
                    </div>
                </DialogShell>
            );

        case "encryption":
            return (
                <DialogShell dark={dark} title="Encryption & privacy" onClose={close}>
                    <div className="px-5 pb-2">
                        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full text-white" style={{ background: cv.accentGradient }}>
                            <IoLockClosedOutline className="text-2xl" />
                        </span>
                        <p className={`text-sm leading-relaxed ${dark ? "text-slate-200" : "text-slate-700"}`}>
                            {isGroup
                                ? "Messages in this group are visible only to the group's members and Super Admins."
                                : "Messages in this chat are visible only to you and this contact."}
                        </p>
                        <p className={`mt-2 text-xs leading-relaxed ${subText}`}>
                            Turn on Advanced chat privacy to block exporting, downloading and copying messages.
                        </p>
                    </div>
                    <div className="px-5 pb-4 pt-2">
                        <button onClick={close} className="w-full rounded-xl py-2.5 text-sm font-semibold text-white" style={{ background: cv.accentGradient }}>
                            Got it
                        </button>
                    </div>
                </DialogShell>
            );

        case "clear":
        case "delete": {
            const isDelete = dialog === "delete";
            return (
                <DialogShell dark={dark} title={isDelete ? "Delete this chat?" : "Clear this chat?"} onClose={close}>
                    <p className={`px-5 pb-4 text-sm leading-relaxed ${dark ? "text-slate-300" : "text-slate-600"}`}>
                        {isDelete
                            ? `This chat with ${title} and all its messages will be removed from your chats list. This can't be undone.`
                            : "All messages in this chat will be removed from your view. This can't be undone."}
                    </p>
                    <div className="flex justify-end gap-2 px-5 pb-4">
                        <button
                            onClick={close}
                            className={`rounded-xl border px-4 py-2 text-sm font-semibold ${dark ? "border-slate-700 text-slate-200 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-100"}`}
                        >
                            Cancel
                        </button>
                        <button onClick={isDelete ? p.onDeleteChat : p.onClearChat} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                            {isDelete ? "Delete chat" : "Clear chat"}
                        </button>
                    </div>
                </DialogShell>
            );
        }

        default:
            return null;
    }
}

export default ChatDialogs;
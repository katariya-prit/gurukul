import { IoLockClosedOutline } from "react-icons/io5";
import { DialogShell } from "../ui/DialogShell";
import { RadioRow } from "../ui/RadioRow";
import { MUTE_OPTIONS, TTL_OPTIONS } from "../constants";
import type { ChatVars, ConvMeta, DialogKind, SharedSettings } from "../types";

export type ChatDialogsProps = {
    dialog: DialogKind;
    dark: boolean;
    cv: ChatVars;
    isGroup: boolean;
    mutedNow: boolean;
    meta: ConvMeta;
    shared: SharedSettings;
    onClose: () => void;
    onApplyMute: (choice: "off" | (typeof MUTE_OPTIONS)[number]["id"]) => void;
    onApplyTtl: (ms: number) => void;
    onClearChat: () => void;
    onDeleteChat: () => void;
};

export function ChatDialogs({
    dialog,
    dark,
    cv,
    isGroup,
    mutedNow,
    meta,
    shared,
    onClose,
    onApplyMute,
    onApplyTtl,
    onClearChat,
    onDeleteChat,
}: ChatDialogsProps) {
    if (!dialog) return null;

    const subText = dark ? "text-slate-400" : "text-slate-500";

    switch (dialog) {
        case "mute":
            return (
                <DialogShell dark={dark} title="Mute notifications" onClose={onClose}>
                    <p className={`px-5 pb-2 text-xs leading-relaxed ${subText}`}>
                        You won't see notifications for new messages in this chat. Muted chats show a bell icon in your chats list.
                    </p>
                    <div role="radiogroup" className="pb-2">
                        {MUTE_OPTIONS.map((o) => (
                            <RadioRow
                                key={o.id}
                                dark={dark}
                                accent={cv.accent}
                                label={o.label}
                                selected={mutedNow && meta.muteChoice === o.id}
                                onClick={() => onApplyMute(o.id)}
                            />
                        ))}
                    </div>
                    {mutedNow && (
                        <div className={`border-t px-5 py-3 ${dark ? "border-slate-700/80" : "border-slate-200"}`}>
                            <button
                                onClick={() => onApplyMute("off")}
                                className="text-sm font-semibold"
                                style={{ color: cv.accent }}
                            >
                                Unmute notifications
                            </button>
                        </div>
                    )}
                </DialogShell>
            );

        case "disappearing":
            return (
                <DialogShell dark={dark} title="Disappearing messages" onClose={onClose}>
                    <p className={`px-5 pb-2 text-xs leading-relaxed ${subText}`}>
                        New messages in this chat will disappear after the selected time. Messages sent earlier are not affected.
                    </p>
                    <div role="radiogroup" className="pb-3">
                        {TTL_OPTIONS.map((o) => (
                            <RadioRow
                                key={o.ms}
                                dark={dark}
                                accent={cv.accent}
                                label={o.label}
                                selected={shared.ttl === o.ms}
                                onClick={() => onApplyTtl(o.ms)}
                            />
                        ))}
                    </div>
                </DialogShell>
            );

        case "encryption":
            return (
                <DialogShell dark={dark} title="Encryption & privacy" onClose={onClose}>
                    <div className="px-5 pb-2">
                        <span
                            className="mb-3 flex h-12 w-12 items-center justify-center rounded-full text-white"
                            style={{ background: cv.accentGradient }}
                        >
                            <IoLockClosedOutline className="text-2xl" />
                        </span>
                        <p className={`text-sm leading-relaxed ${dark ? "text-slate-200" : "text-slate-700"}`}>
                            {isGroup
                                ? "Messages in this group are visible only to the group's members and Super Admins."
                                : "Messages in this chat are visible only to you and this contact."}
                        </p>
                        <p className={`mt-2 text-xs leading-relaxed ${subText}`}>
                            Chats are currently saved on this device. Turn on Advanced chat privacy to block exporting, downloading and copying messages.
                        </p>
                    </div>
                    <div className="px-5 pb-4 pt-2">
                        <button
                            onClick={onClose}
                            className="w-full rounded-xl py-2.5 text-sm font-semibold text-white shadow-md"
                            style={{ background: cv.accentGradient }}
                        >
                            Done
                        </button>
                    </div>
                </DialogShell>
            );

        case "clear":
        case "delete": {
            const isDelete = dialog === "delete";
            return (
                <DialogShell dark={dark} title={isDelete ? "Delete chat?" : "Clear chat?"} onClose={onClose}>
                    <p className={`px-5 pb-5 text-sm leading-relaxed ${subText}`}>
                        {isDelete
                            ? `${isGroup ? "This group" : "This chat"} and all its messages will be removed from your chats list. This can't be undone.`
                            : "All messages in this chat will be removed from your view. This can't be undone."}
                    </p>
                    <div className="flex justify-end gap-2 px-5 pb-4">
                        <button
                            onClick={onClose}
                            className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
                                dark ? "border-slate-700 text-slate-200 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={isDelete ? onDeleteChat : onClearChat}
                            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                        >
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

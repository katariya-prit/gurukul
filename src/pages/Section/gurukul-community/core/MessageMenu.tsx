import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    IoAdd,
    IoArrowRedoOutline,
    IoArrowUndoOutline,
    IoCopyOutline,
    IoHappyOutline,
    IoInformationCircleOutline,
    IoPin,
    IoPinOutline,
    IoStar,
    IoStarOutline,
    IoTrashOutline,
} from "react-icons/io5";
import type { ChatMessage } from "../types";
import type { ChatVars, MenuItem } from "../messageTypes";
import type { MessageActions } from "../hooks/useMessageActions";
import { MORE_EMOJIS, QUICK_EMOJIS } from "../utils/chatHelpers";

type MenuProps = {
    x: number;
    y: number;
    dark: boolean;
    canReact: boolean;
    myEmoji?: string;
    items: MenuItem[];
    onReact: (emoji: string) => void;
    onClose: () => void;
};

function MessageMenu({ x, y, dark, canReact, myEmoji, items, onReact, onClose }: MenuProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [more, setMore] = useState(false);
    const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

    // Keep the menu fully inside the screen (flip left / up when there is no room)
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        let left = x > vw / 2 ? x - w : x;
        left = Math.max(8, Math.min(left, vw - w - 8));
        let top = y + 6;
        if (top + h > vh - 8) top = y - h - 6;
        top = Math.max(8, Math.min(top, vh - h - 8));
        setPos({ left, top });
    }, [x, y, more]);

    const card = dark ? "border-slate-700 bg-[#111B28] text-slate-100" : "border-slate-200 bg-white text-slate-800";
    const sel = (e: string) => (myEmoji === e ? (dark ? "bg-slate-700" : "bg-slate-200") : "");

    return createPortal(
        <>
            <div
                className="fixed inset-0 z-70"
                onClick={onClose}
                onContextMenu={(e) => {
                    e.preventDefault();
                    onClose();
                }}
            />
            <div
                ref={ref}
                role="menu"
                aria-label="Message options"
                className="fixed z-71 flex w-60 flex-col gap-2"
                style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? "visible" : "hidden", animation: "gkDialogIn .14s ease-out" }}
            >
                {canReact && !more && (
                    <div className={`flex items-center justify-between rounded-full border px-2 py-1.5 shadow-2xl ${card}`}>
                        {QUICK_EMOJIS.map((e) => (
                            <button
                                key={e}
                                type="button"
                                onClick={() => onReact(e)}
                                aria-label={`React ${e}`}
                                className={`flex h-9 w-9 items-center justify-center rounded-full text-xl transition-transform hover:scale-125 ${sel(e)}`}
                            >
                                {e}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setMore(true)}
                            aria-label="More reactions"
                            className={`flex h-9 w-9 items-center justify-center rounded-full text-lg ${dark ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}
                        >
                            <IoAdd />
                        </button>
                    </div>
                )}

                {more ? (
                    <div className={`rounded-2xl border p-2 shadow-2xl ${card}`}>
                        <div className="grid grid-cols-6 gap-0.5">
                            {MORE_EMOJIS.map((e) => (
                                <button
                                    key={e}
                                    type="button"
                                    onClick={() => onReact(e)}
                                    aria-label={`React ${e}`}
                                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-xl transition-transform hover:scale-125 ${sel(e)}`}
                                >
                                    {e}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className={`overflow-hidden rounded-2xl border py-1.5 shadow-2xl ${card}`}>
                        {items.map((it) => (
                            <div key={it.key}>
                                {it.separatorBefore && <div className={`mx-3 my-1 border-t ${dark ? "border-slate-700" : "border-slate-200"}`} />}
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                        if (it.key === "react") setMore(true);
                                        else {
                                            onClose();
                                            it.onClick();
                                        }
                                    }}
                                    className={`flex w-full items-center gap-4 px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                                        it.danger ? (dark ? "text-rose-400" : "text-red-600") : ""
                                    } ${dark ? "hover:bg-slate-800" : "hover:bg-slate-50"}`}
                                >
                                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center text-xl ${it.danger ? "" : dark ? "text-slate-300" : "text-slate-600"}`}>
                                        {it.icon}
                                    </span>
                                    {it.label}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>,
        document.body
    );
}

/** Builds the menu items for the selected message. */
export function MessageMenuHost({
    dark,
    actions,
    messages,
    starredSet,
    canSend,
    meSuid,
    onStar,
}: {
    dark: boolean;
    cv: ChatVars;
    actions: MessageActions;
    messages: ChatMessage[];
    starredSet: Set<string>;
    canSend: boolean;
    meSuid: string;
    onStar: (id: string) => void;
}) {
    const { menu, setMenu, setReplyTarget, setMsgInfoId, setMsgDialog, setFwdSel, setFwdQuery, pinnedSet, toggleReaction, copyMessage, togglePin } = actions;
    if (!menu) return null;
    const m = messages.find((x) => x.id === menu.id);
    if (!m) return null;

    const isStarred = starredSet.has(m.id);
    const isPinned = pinnedSet.has(m.id);
    const items: MenuItem[] = [];

    if (!m.deleted) {
        if (m.sender_suid === meSuid) items.push({ key: "info", label: "Message info", icon: <IoInformationCircleOutline />, onClick: () => setMsgInfoId(m.id) });
        if (canSend) items.push({ key: "reply", label: "Reply", icon: <IoArrowUndoOutline />, onClick: () => setReplyTarget(m) });
        if (m.text) items.push({ key: "copy", label: "Copy", icon: <IoCopyOutline />, onClick: () => void copyMessage(m) });
        if (canSend) items.push({ key: "react", label: "React", icon: <IoHappyOutline />, onClick: () => undefined });
        items.push({
            key: "forward",
            label: "Forward",
            icon: <IoArrowRedoOutline />,
            onClick: () => {
                setFwdSel([]);
                setFwdQuery("");
                setMsgDialog({ kind: "forward", msg: m });
            },
        });
        if (canSend) items.push({ key: "pin", label: isPinned ? "Unpin" : "Pin", icon: isPinned ? <IoPin /> : <IoPinOutline />, onClick: () => togglePin(m) });
        items.push({
            key: "star",
            label: isStarred ? "Unstar" : "Star",
            icon: isStarred ? <IoStar className="text-amber-400" /> : <IoStarOutline />,
            onClick: () => onStar(m.id),
        });
    }
    items.push({ key: "delete", label: "Delete", icon: <IoTrashOutline />, separatorBefore: !m.deleted, onClick: () => setMsgDialog({ kind: "delete", msg: m }) });

    return (
        <MessageMenu
            x={menu.x}
            y={menu.y}
            dark={dark}
            canReact={canSend && !m.deleted}
            myEmoji={m.reactions?.[meSuid]}
            items={items}
            onReact={(emoji) => {
                toggleReaction(m.id, emoji);
                setMenu(null);
            }}
            onClose={() => setMenu(null)}
        />
    );
}

export default MessageMenuHost;
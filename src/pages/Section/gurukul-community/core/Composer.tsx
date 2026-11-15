import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { IoAttachOutline, IoClose, IoDocumentTextOutline, IoImageOutline, IoSend } from "react-icons/io5";
import type { ChatMessage } from "../types";
import type { ChatVars } from "../messageTypes";
import { isImageMime } from "../utils/linksAndMedia";
import { HIDE_SCROLL, MAX_DOC_BYTES, MAX_IMAGE_SRC_BYTES, MAX_PENDING_FILES, formatBytes, previewOf } from "../utils/chatHelpers";

type Props = {
    dark: boolean;
    cv: ChatVars;
    meName: string;
    meSuid: string;
    reply: ChatMessage | null;
    onCancelReply: () => void;
    onSend: (text: string, files: File[]) => Promise<boolean>;
    onTyping?: () => void;
    onTypingStop?: () => void;
};

export const Composer = memo(function Composer({ dark, cv, meName, meSuid, reply, onCancelReply, onSend, onTyping, onTypingStop }: Props) {
    const [draft, setDraft] = useState("");
    const [pending, setPending] = useState<File[]>([]);
    const [busy, setBusy] = useState(false);
    const busyRef = useRef(false);
    const ref = useRef<HTMLTextAreaElement>(null);
    const imgInputRef = useRef<HTMLInputElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);

    const previews = useMemo(() => pending.map((f) => (isImageMime(f.type) ? URL.createObjectURL(f) : null)), [pending]);
    useEffect(() => () => previews.forEach((u) => u && URL.revokeObjectURL(u)), [previews]);

    useEffect(() => {
        if (window.matchMedia?.("(pointer: fine)").matches) ref.current?.focus({ preventScroll: true });
    }, []);

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
    }, [draft]);

    // Replying to a message -> jump straight into the text box
    const replyId = reply?.id;
    useEffect(() => {
        if (replyId) ref.current?.focus({ preventScroll: true });
    }, [replyId]);

    const addFiles = (files: File[]) => {
        if (!files.length) return;
        const room = MAX_PENDING_FILES - pending.length;
        if (room <= 0) {
            toast.error(`You can attach up to ${MAX_PENDING_FILES} files at once`);
            return;
        }
        const ok: File[] = [];
        for (const f of files) {
            if (ok.length >= room) {
                toast.error(`You can attach up to ${MAX_PENDING_FILES} files at once`);
                break;
            }
            if (isImageMime(f.type)) {
                if (f.size > MAX_IMAGE_SRC_BYTES) {
                    toast.error(`"${f.name}" is too large (max ${formatBytes(MAX_IMAGE_SRC_BYTES)})`);
                    continue;
                }
            } else if (f.size > MAX_DOC_BYTES) {
                toast.error(`"${f.name}" is too large (max ${formatBytes(MAX_DOC_BYTES)} per document)`);
                continue;
            }
            ok.push(f);
        }
        if (ok.length) setPending((p) => [...p, ...ok]);
    };

    const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
        addFiles(Array.from(e.target.files ?? []));
        e.target.value = "";
    };

    const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const files = Array.from(e.clipboardData?.files ?? []);
        if (files.length) {
            e.preventDefault();
            addFiles(files);
        }
    };

    const canSubmit = (!!draft.trim() || pending.length > 0) && !busy;

    const submit = async () => {
        const text = draft.trim();
        if ((!text && !pending.length) || busyRef.current) return;
        busyRef.current = true;
        setBusy(true);
        let ok = false;
        try {
            ok = await onSend(text, pending);
        } finally {
            busyRef.current = false;
            setBusy(false);
        }
        if (ok) {
            setDraft("");
            setPending([]);
        }
        ref.current?.focus({ preventScroll: true });
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            void submit();
        }
    };

    const iconBtn = `flex h-12 w-11 shrink-0 items-center justify-center rounded-2xl text-xl transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        dark ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"
    }`;

    return (
        <>
            <div className="mb-2 flex items-center gap-2">
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${dark ? "text-slate-400" : "text-slate-500"}`}>Sending as</span>
                <span
                    className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{ background: cv.chip.background, color: cv.chip.color, borderColor: cv.chip.border }}
                >
                    {meName}
                </span>
            </div>

            {reply && (
                <div className={`mb-2 flex items-stretch gap-3 rounded-xl border-l-4 px-3 py-2 ${dark ? "bg-slate-900" : "bg-slate-100"}`} style={{ borderColor: cv.accent }}>
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold" style={{ color: cv.accent }}>
                            Replying to {reply.sender_suid === meSuid ? "yourself" : reply.sender_name}
                        </span>
                        <span className={`line-clamp-2 block text-xs wrap-break-word ${dark ? "text-slate-300" : "text-slate-600"}`}>{previewOf(reply)}</span>
                    </span>
                    <button
                        type="button"
                        onClick={onCancelReply}
                        aria-label="Cancel reply"
                        className={`flex h-7 w-7 shrink-0 items-center justify-center self-center rounded-full ${dark ? "hover:bg-slate-800" : "hover:bg-slate-200"}`}
                    >
                        <IoClose className="text-lg" />
                    </button>
                </div>
            )}

            {pending.length > 0 && (
                <div className={`mb-2 flex gap-2 overflow-x-auto pb-1 ${HIDE_SCROLL}`}>
                    {pending.map((f, i) => (
                        <div
                            key={`${f.name}-${f.size}-${i}`}
                            className={`relative flex h-16 shrink-0 items-center overflow-hidden rounded-xl border ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-slate-50"}`}
                        >
                            {previews[i] ? (
                                <img src={previews[i]!} alt={f.name} className="h-16 w-16 object-cover" />
                            ) : (
                                <span className="flex items-center gap-2 px-3">
                                    <IoDocumentTextOutline className={`text-2xl ${dark ? "text-slate-300" : "text-slate-600"}`} />
                                    <span className="max-w-32">
                                        <span className={`block truncate text-xs font-semibold ${dark ? "text-slate-100" : "text-slate-800"}`}>{f.name}</span>
                                        <span className={`block text-[10px] ${dark ? "text-slate-400" : "text-slate-500"}`}>{formatBytes(f.size)}</span>
                                    </span>
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={() => setPending((p) => p.filter((_, idx) => idx !== i))}
                                aria-label={`Remove ${f.name}`}
                                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/65 text-xs text-white hover:bg-black/80"
                            >
                                <IoClose />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-end gap-2">
                <input ref={imgInputRef} type="file" accept="image/*" multiple hidden onChange={onPick} />
                <input ref={docInputRef} type="file" multiple hidden onChange={onPick} />
                <button type="button" className={iconBtn} onClick={() => imgInputRef.current?.click()} disabled={busy} aria-label="Attach photo" title="Photo">
                    <IoImageOutline />
                </button>
                <button type="button" className={iconBtn} onClick={() => docInputRef.current?.click()} disabled={busy} aria-label="Attach document" title="Document">
                    <IoAttachOutline />
                </button>
                <textarea
                    ref={ref}
                    rows={1}
                    value={draft}
                    onChange={(e) => {
                        const value = e.target.value;
                        setDraft(value);
                        if (value.trim()) onTyping?.();
                        else onTypingStop?.();
                    }}
                    onBlur={onTypingStop}
                    onKeyDown={onKeyDown}
                    onPaste={onPaste}
                    placeholder={pending.length ? "Add a caption..." : "Type a message..."}
                    className={`chat-themed-input max-h-32 flex-1 resize-none rounded-2xl border px-4 py-3 text-sm shadow-inner outline-none transition-colors ${HIDE_SCROLL}
                    ${dark
                            ? "border-slate-700 bg-slate-900/90 text-slate-100 placeholder:text-slate-500"
                            : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
                        }`}
                />
                <button
                    onClick={() => void submit()}
                    disabled={!canSubmit}
                    className="group flex h-12 items-center gap-2 rounded-2xl px-5 text-sm font-semibold text-white shadow-lg transition-all duration-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ background: cv.accentGradient, boxShadow: cv.mine.shadow }}
                >
                    <IoSend className="text-base transition-transform duration-300 group-hover:translate-x-0.5" />
                    <span className="hidden sm:inline">{busy ? "Sending..." : "Send"}</span>
                </button>
            </div>
        </>
    );
});

export default Composer;
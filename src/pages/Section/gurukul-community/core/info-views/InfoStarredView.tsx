import { IoStar, IoStarOutline, IoImageOutline, IoDocumentTextOutline } from "react-icons/io5";
import { PersonAvatar } from "../../ui/PersonAvatar";
import { formatDay, formatTime } from "../../utils/formatters";
import { isImageMime } from "../../utils/linksAndMedia";
import type { ChatMessage, ChatUser } from "../../types";

export type InfoStarredViewProps = {
    dark: boolean;
    surface: string;
    subText: string;
    me: ChatUser;
    avatarBySuid: Map<string, string | undefined>;
    starredMessages: ChatMessage[];
    onJumpToMessage: (id: string) => void;
    onToggleStar: (id: string) => void;
};

export function InfoStarredView({
    dark,
    surface,
    subText,
    me,
    avatarBySuid,
    starredMessages,
    onJumpToMessage,
    onToggleStar,
}: InfoStarredViewProps) {
    return (
        <div className={`${surface} min-h-full py-3`}>
            {starredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <IoStarOutline className={`text-4xl ${subText}`} />
                    <p className={`mt-3 text-sm font-semibold ${dark ? "text-slate-200" : "text-slate-800"}`}>
                        No starred messages
                    </p>
                    <p className={`mt-1 max-w-xs text-xs ${subText}`}>
                        Hover any message and click the star to keep it here for quick access.
                    </p>
                </div>
            ) : (
                <div className="space-y-1 px-3">
                    {starredMessages.map((m) => {
                        const isMine = m.sender_suid === me.suid;
                        const isImg = m.file && isImageMime(m.file.mime);
                        return (
                            <div
                                key={m.id}
                                onClick={() => onJumpToMessage(m.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === "Enter" && onJumpToMessage(m.id)}
                                className={`group flex w-full cursor-pointer items-start gap-3.5 rounded-2xl p-3 text-left transition-colors ${
                                    dark ? "hover:bg-slate-800/70" : "hover:bg-slate-50"
                                }`}
                            >
                                <PersonAvatar
                                    dark={dark}
                                    name={m.sender_name}
                                    avatar={avatarBySuid.get(m.sender_suid)}
                                    size={40}
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`truncate text-xs font-bold ${dark ? "text-slate-200" : "text-slate-800"}`}>
                                            {isMine ? "You" : m.sender_name}
                                        </span>
                                        <span className={`shrink-0 text-[10px] ${subText}`}>
                                            {formatDay(m.time)} · {formatTime(m.time)}
                                        </span>
                                    </div>
                                    {m.file && (
                                        <p className="mt-1 flex items-center gap-1.5 text-xs opacity-80">
                                            {isImg ? <IoImageOutline /> : <IoDocumentTextOutline />}
                                            <span className="truncate">{m.file.name}</span>
                                        </p>
                                    )}
                                    {m.text && (
                                        <p className={`mt-1 line-clamp-3 text-xs leading-relaxed ${dark ? "text-slate-300" : "text-slate-700"}`}>
                                            {m.text}
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleStar(m.id);
                                    }}
                                    aria-label="Remove star"
                                    title="Remove star"
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-amber-400 hover:bg-black/10"
                                >
                                    <IoStar />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

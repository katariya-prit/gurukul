import { IoArrowBack } from "react-icons/io5";
import { GroupAvatar } from "../ui/GroupAvatar";
import { PersonAvatar } from "../ui/PersonAvatar";
import type { ChatVars, DirUser } from "../types";

export type ChatHeaderProps = {
    dark: boolean;
    cv: ChatVars;
    isGroup: boolean;
    title: string;
    subtitle: string;
    activePeer: DirUser | null;
    onBack: () => void;
    onOpenInfo: () => void;
};

export function ChatHeader({
    dark,
    cv,
    isGroup,
    title,
    subtitle,
    activePeer,
    onBack,
    onOpenInfo,
}: ChatHeaderProps) {
    const subText = dark ? "text-slate-400" : "text-slate-500";

    return (
        <>
            <div
                className="h-0.5 shrink-0"
                style={{ backgroundImage: `linear-gradient(to right, transparent, ${cv.accent}, transparent)` }}
            />
            <header
                className={`shrink-0 px-3 md:px-5 py-3 flex items-center gap-3 border-b
                ${dark ? "bg-[#0E1626] border-slate-700/80" : "bg-white border-slate-200"}`}
                style={{ backgroundImage: `linear-gradient(${cv.headerTint}, ${cv.headerTint})` }}
            >
                <button
                    onClick={onBack}
                    aria-label="Back to chats"
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full md:hidden ${
                        dark ? "text-slate-200 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"
                    }`}
                >
                    <IoArrowBack className="text-xl" />
                </button>

                {/* Group name / avatar (click => info, like WhatsApp). Hover animates only the avatar. */}
                <button
                    type="button"
                    onClick={onOpenInfo}
                    title={isGroup ? "Group info" : "Contact info"}
                    aria-label={isGroup ? "Open group info" : "Open contact info"}
                    className="gk-hd-btn flex min-w-0 flex-1 items-center gap-3 bg-transparent py-1 text-left outline-none"
                >
                    <span className="gk-hd-avatar inline-flex shrink-0">
                        {isGroup ? (
                            <GroupAvatar dark={dark} name={title} size={44} />
                        ) : (
                            <PersonAvatar dark={dark} name={title} avatar={activePeer?.avatar} size={44} superBadge={activePeer?.isSuper} online />
                        )}
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className={`block truncate text-base font-bold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>
                            {title}
                        </span>
                        <span className={`block truncate text-[11px] font-medium ${subText}`}>{subtitle}</span>
                    </span>
                </button>
            </header>
        </>
    );
}

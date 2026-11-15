import { typingLabel, type TypingEntry } from "../hooks/Usetyping";
import type { ChatVars } from "../messageTypes";
import { PersonAvatar } from "../ui/PersonAvatar";

type Props = {
    dark: boolean;
    cv: ChatVars;
    entries: TypingEntry[];
    isGroup: boolean;
};

const initials = (name: string) => {
    const p = (name || "?").trim().split(/\s+/);
    return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[1][0]).toUpperCase();
};

export function TypingBubble({ dark, cv, entries, isGroup }: Props) {
    if (entries.length === 0) return null;

    const label = typingLabel(isGroup, entries);
    const bubbleStyle = {
        background: cv.theirs.background,
        color: cv.theirs.color,
        border: cv.theirs.border,
        boxShadow: cv.theirs.shadow,
    };

    return (
        <div role="status" aria-live="polite">
            <style>{`
                @keyframes gkTypingDot {
                    0%, 60%, 100% { transform: translateY(0); opacity: .35; }
                    30% { transform: translateY(-4px); opacity: 1; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .gk-typing-dot { animation: none !important; opacity: .7 !important; }
                }
            `}</style>
            <div className="flex items-end justify-start gap-2">
                <div className="relative h-8 w-8 shrink-0">
                    {isGroup ? (
                        entries.slice(0, 3).map((entry, index) => (
                            <span
                                key={entry.suid}
                                title={entry.name}
                                className={`absolute top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border-2 text-[8px] font-bold ${
                                    dark ? "border-[#0B1120] bg-slate-800 text-blue-300" : "border-white bg-red-50 text-red-700"
                                }`}
                                style={{ left: `${index * 6}px`, zIndex: entries.length - index }}
                            >
                                {entry.avatar ? <img src={entry.avatar} alt="" className="h-full w-full object-cover" /> : initials(entry.name)}
                            </span>
                        ))
                    ) : (
                        <PersonAvatar dark={dark} name={entries[0].name} avatar={entries[0].avatar} size={32} />
                    )}
                </div>
                <div className="flex min-w-0 max-w-[80%] flex-col items-start md:max-w-[68%]">
                    {isGroup && (
                        <p className="mb-1 truncate text-[11px] font-bold tracking-wide" style={{ color: cv.accent }}>
                            {label}
                        </p>
                    )}
                    <div className="max-w-full rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm leading-relaxed shadow-md" style={bubbleStyle}>
                        <span className="flex items-center gap-1" aria-hidden="true">
                            {[0, 1, 2].map((index) => (
                                <span
                                    key={index}
                                    className="gk-typing-dot h-1.5 w-1.5 rounded-full bg-current"
                                    style={{ animation: `gkTypingDot 1.2s ${index * 0.18}s infinite ease-in-out` }}
                                />
                            ))}
                        </span>
                        {!isGroup && <span className="sr-only">{label}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}

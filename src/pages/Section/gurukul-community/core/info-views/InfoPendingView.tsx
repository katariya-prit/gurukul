import { PersonAvatar } from "../../ui/PersonAvatar";
import type { ChatVars, DirUser, SharedSettings } from "../../types";

export type InfoPendingViewProps = {
    dark: boolean;
    cv: ChatVars;
    surface: string;
    subText: string;
    shared: SharedSettings;
    directory: DirUser[];
    onAcceptRequest: (suid: string) => void;
    onRejectRequest: (suid: string) => void;
};

export function InfoPendingView({
    dark,
    cv,
    surface,
    subText,
    shared,
    directory,
    onAcceptRequest,
    onRejectRequest,
}: InfoPendingViewProps) {
    return (
        <div className={`${surface} min-h-full py-3`}>
            <p className={`px-6 pb-2 text-xs leading-relaxed ${subText}`}>
                People who used the invite link to join this group. An admin must approve them before they can see messages.
            </p>
            <div className="px-3 space-y-1">
                {shared.pending.map((id) => {
                    const u = directory.find((d) => d.suid === id);
                    const name = u?.name || `User ${id}`;
                    return (
                        <div
                            key={id}
                            className={`flex items-center gap-3.5 rounded-xl p-3 ${
                                dark ? "bg-slate-800/50" : "bg-slate-50"
                            }`}
                        >
                            <PersonAvatar dark={dark} name={name} avatar={u?.avatar} size={44} />
                            <div className="min-w-0 flex-1">
                                <span className={`block truncate text-sm font-semibold ${dark ? "text-slate-100" : "text-slate-800"}`}>
                                    {name}
                                </span>
                                <span className={`block truncate text-xs ${subText}`}>{u?.role_code || id}</span>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <button
                                    onClick={() => onRejectRequest(id)}
                                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                                        dark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"
                                    }`}
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => onAcceptRequest(id)}
                                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-md"
                                    style={{ background: cv.accentGradient }}
                                >
                                    Approve
                                </button>
                            </div>
                        </div>
                    );
                })}
                {shared.pending.length === 0 && (
                    <p className={`py-12 text-center text-xs ${subText}`}>No pending requests</p>
                )}
            </div>
        </div>
    );
}

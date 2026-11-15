import { toast } from "sonner";
import { PersonAvatar } from "../../ui/PersonAvatar";
import type { InfoCtx } from "./infoTypes";

export function InfoPending({ c }: { c: InfoCtx }) {
    const { dark, cv, surface, subText, shared, directory } = c;

    if (shared.pending.length === 0) {
        return (
            <div className={`${surface} min-h-full py-3`}>
                <p className={`px-8 py-16 text-center text-sm ${subText}`}>No pending requests</p>
            </div>
        );
    }

    return (
        <div className={`${surface} min-h-full py-3`}>
            <div className="space-y-1 px-3">
                {shared.pending.map((id) => {
                    const u = directory.find((d) => d.suid === id);
                    const name = u?.name || `User ${id}`;
                    return (
                        <div key={id} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                            <PersonAvatar dark={dark} name={name} avatar={u?.avatar} size={44} />
                            <span className="min-w-0 flex-1">
                                <span className={`block truncate text-sm font-semibold ${dark ? "text-slate-100" : "text-slate-800"}`}>{name}</span>
                                <span className={`block truncate text-xs ${subText}`}>Wants to join via invite link</span>
                            </span>
                            <button
                                onClick={() => c.onRejectRequest(id)}
                                aria-label={`Reject ${name}`}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${dark ? "border-slate-700 text-slate-200 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-100"}`}
                            >
                                Reject
                            </button>
                            <button
                                onClick={() => {
                                    c.onAcceptRequest(id);
                                    toast.success(`${name} added`);
                                }}
                                aria-label={`Approve ${name}`}
                                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                                style={{ background: cv.accentGradient }}
                            >
                                Approve
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default InfoPending;
import { IoSearchOutline } from "react-icons/io5";
import { PersonAvatar } from "../../ui/PersonAvatar";
import { CheckBox } from "../../ui/CheckBox";
import type { ChatVars, DirUser, SharedSettings } from "../../types";

export type InfoAddMembersViewProps = {
    dark: boolean;
    cv: ChatVars;
    surface: string;
    subText: string;
    shared: SharedSettings;
    addQuery: string;
    setAddQuery: (q: string) => void;
    addSel: string[];
    setAddSel: (fn: (cur: string[]) => string[]) => void;
    candidates: DirUser[];
    onConfirmAddMembers: () => void;
};

export function InfoAddMembersView({
    dark,
    cv,
    surface,
    subText,
    shared,
    addQuery,
    setAddQuery,
    addSel,
    setAddSel,
    candidates,
    onConfirmAddMembers,
}: InfoAddMembersViewProps) {
    const aq = addQuery.trim().toLowerCase();

    return (
        <div className={`${surface} flex min-h-full flex-col`}>
            <div className="px-4 pt-3 pb-2">
                <div
                    className={`flex items-center gap-2.5 rounded-full px-4 py-2.5 ${
                        dark ? "bg-slate-800/80" : "bg-slate-100"
                    }`}
                >
                    <IoSearchOutline className={subText} />
                    <input
                        autoFocus
                        value={addQuery}
                        onChange={(e) => setAddQuery(e.target.value)}
                        placeholder="Search people..."
                        className={`w-full bg-transparent text-sm outline-none ${
                            dark ? "text-slate-100 placeholder:text-slate-500" : "text-slate-800 placeholder:text-slate-500"
                        }`}
                    />
                </div>
                {!shared.sendHistory && (
                    <p className={`mt-2 px-1 text-xs ${subText}`}>New members will not see earlier messages.</p>
                )}
            </div>

            <div className="flex-1 px-3 pb-2 space-y-0.5">
                {candidates.map((u) => {
                    const sel = addSel.includes(u.suid);
                    return (
                        <button
                            key={u.suid}
                            type="button"
                            role="checkbox"
                            aria-checked={sel}
                            onClick={() =>
                                setAddSel((cur) =>
                                    cur.includes(u.suid) ? cur.filter((x) => x !== u.suid) : [...cur, u.suid]
                                )
                            }
                            className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left transition-colors ${
                                dark ? "hover:bg-slate-800" : "hover:bg-slate-50"
                            }`}
                        >
                            <PersonAvatar dark={dark} name={u.name} avatar={u.avatar} size={44} superBadge={u.isSuper} />
                            <span className="min-w-0 flex-1">
                                <span className={`block truncate text-sm font-semibold ${dark ? "text-slate-100" : "text-slate-800"}`}>
                                    {u.name}
                                </span>
                                {u.role_code && <span className={`block truncate text-xs ${subText}`}>{u.role_code}</span>}
                            </span>
                            <CheckBox checked={sel} dark={dark} accent={cv.accent} />
                        </button>
                    );
                })}
                {candidates.length === 0 && (
                    <p className={`py-12 text-center text-xs ${subText}`}>
                        {aq ? "No people found" : "Everyone is already in this group"}
                    </p>
                )}
            </div>

            <div className={`sticky bottom-0 border-t px-4 py-3 ${dark ? "border-slate-700/80 bg-[#0E1626]" : "border-slate-200 bg-white"}`}>
                <button
                    disabled={!addSel.length}
                    onClick={onConfirmAddMembers}
                    className="w-full rounded-xl py-2.5 text-sm font-semibold text-white shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ background: cv.accentGradient }}
                >
                    Add {addSel.length > 0 ? `${addSel.length} member${addSel.length === 1 ? "" : "s"}` : "members"}
                </button>
            </div>
        </div>
    );
}

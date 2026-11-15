import { IoSearchOutline } from "react-icons/io5";
import { CheckBox } from "../../ui/CheckBox";
import { PersonAvatar } from "../../ui/PersonAvatar";
import type { InfoCtx } from "./infoTypes";

export function InfoAddMembers({ c }: { c: InfoCtx }) {
    const { dark, cv, surface, subText, shared, candidates, addQuery, addSel } = c;

    return (
        <div className={`${surface} flex min-h-full flex-col`}>
            <div className="px-4 pt-3 pb-2">
                <div className={`flex items-center gap-2.5 rounded-full px-4 py-2.5 ${dark ? "bg-slate-800/80" : "bg-slate-100"}`}>
                    <IoSearchOutline className={subText} />
                    <input
                        autoFocus
                        value={addQuery}
                        onChange={(e) => c.setAddQuery(e.target.value)}
                        placeholder="Search people..."
                        className={`w-full bg-transparent text-sm outline-none ${dark ? "text-slate-100 placeholder:text-slate-500" : "text-slate-800 placeholder:text-slate-500"}`}
                    />
                </div>
                {!shared.sendHistory && <p className={`mt-2 px-1 text-xs ${subText}`}>New members will not see earlier messages.</p>}
            </div>

            <div className="flex-1 space-y-0.5 px-3 pb-2">
                {candidates.map((u) => {
                    const sel = addSel.includes(u.suid);
                    return (
                        <button
                            key={u.suid}
                            type="button"
                            role="checkbox"
                            aria-checked={sel}
                            onClick={() => c.setAddSel((cur) => (cur.includes(u.suid) ? cur.filter((x) => x !== u.suid) : [...cur, u.suid]))}
                            className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left transition-colors ${dark ? "hover:bg-slate-800" : "hover:bg-slate-50"}`}
                        >
                            <PersonAvatar dark={dark} name={u.name} avatar={u.avatar} size={44} superBadge={u.isSuper} />
                            <span className="min-w-0 flex-1">
                                <span className={`block truncate text-sm font-semibold ${dark ? "text-slate-100" : "text-slate-800"}`}>{u.name}</span>
                                {u.role_code && <span className={`block truncate text-xs ${subText}`}>{u.role_code}</span>}
                            </span>
                            <CheckBox checked={sel} dark={dark} accent={cv.accent} />
                        </button>
                    );
                })}
                {candidates.length === 0 && (
                    <p className={`py-12 text-center text-xs ${subText}`}>{addQuery.trim() ? "No people found" : "Everyone is already in this group"}</p>
                )}
            </div>

            <div className={`sticky bottom-0 border-t px-4 py-3 ${dark ? "border-slate-700/80 bg-[#0E1626]" : "border-slate-200 bg-white"}`}>
                <button
                    onClick={c.onConfirmAddMembers}
                    disabled={!addSel.length}
                    className="w-full rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition-all active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ background: cv.accentGradient }}
                >
                    {addSel.length ? `Add ${addSel.length} member${addSel.length === 1 ? "" : "s"}` : "Select people to add"}
                </button>
            </div>
        </div>
    );
}

export default InfoAddMembers;
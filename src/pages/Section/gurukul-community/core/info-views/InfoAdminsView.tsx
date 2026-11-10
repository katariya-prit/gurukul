/* eslint-disable @typescript-eslint/no-explicit-any */
import { PersonAvatar } from "../../ui/PersonAvatar";
import { Switch } from "../../ui/Switch";
import { isSuperRole } from "../../utils/userHelpers";
import type { ChatUser, ChatVars, SharedSettings } from "../../types";

export type InfoAdminsViewProps = {
    dark: boolean;
    cv: ChatVars;
    surface: string;
    subText: string;
    me: ChatUser;
    meAdmin: boolean;
    members: any[];
    shared: SharedSettings;
    onToggleAdmin: (suid: string) => void;
};

export function InfoAdminsView({
    dark,
    cv,
    surface,
    subText,
    me,
    meAdmin,
    members,
    shared,
    onToggleAdmin,
}: InfoAdminsViewProps) {
    return (
        <div className={`${surface} min-h-full py-3`}>
            <p className={`px-6 pb-2 text-xs leading-relaxed ${subText}`}>
                {meAdmin
                    ? "Admins can change group permissions, approve new members and always send messages. Super Admins are always admins."
                    : "Only admins can edit group admins."}
            </p>
            <div className="px-3 space-y-0.5">
                {members.map((m) => {
                    const superAdmin = isSuperRole(m.role_code, m.name);
                    const isAdm = superAdmin || shared.admins.includes(String(m.suid));
                    const locked = superAdmin || !meAdmin;
                    return (
                        <button
                            key={m.suid}
                            type="button"
                            role="switch"
                            aria-checked={isAdm}
                            disabled={locked}
                            onClick={() => onToggleAdmin(String(m.suid))}
                            className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed ${
                                dark ? "enabled:hover:bg-slate-800" : "enabled:hover:bg-slate-50"
                            }`}
                        >
                            <PersonAvatar dark={dark} name={m.name} avatar={m.avatar} size={44} />
                            <span className="min-w-0 flex-1">
                                <span className={`block truncate text-sm font-semibold ${dark ? "text-slate-100" : "text-slate-800"}`}>
                                    {m.name} {String(m.suid) === me.suid && <span className="font-normal opacity-60">(You)</span>}
                                </span>
                                <span className={`block truncate text-xs ${subText}`}>
                                    {superAdmin ? "Super Admin" : m.role_code || "Member"}
                                </span>
                            </span>
                            <span className={locked ? "opacity-60" : ""}>
                                <Switch on={isAdm} dark={dark} accent={cv.accent} />
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

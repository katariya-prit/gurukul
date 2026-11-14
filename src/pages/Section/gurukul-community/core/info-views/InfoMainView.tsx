import {
    IoChevronForward, IoColorPaletteOutline, IoDownloadOutline, IoImagesOutline, IoLinkOutline, IoLockClosedOutline,
    IoNotificationsOffOutline, IoNotificationsOutline, IoPeopleOutline, IoPersonAddOutline, IoRemoveCircleOutline,
    IoSettingsOutline, IoShieldCheckmarkOutline, IoStarOutline, IoTimeOutline, IoTimerOutline, IoTrashOutline,
} from "react-icons/io5";
import { GroupAvatar } from "../../ui/GroupAvatar";
import { PersonAvatar } from "../../ui/PersonAvatar";
import { SettingRow } from "../../ui/SettingRow";
import { ttlLabel } from "../../constants";
import { muteLabel } from "../../utils/chatHelpers";
import type { InfoCtx } from "./infoTypes";

export function InfoMain({ c }: { c: InfoCtx }) {
    const { dark, cv, surface, subText, isGroup, title, activeGroup, activePeer, peerGroups, members, me, shared, meta } = c;
    const rowHover = dark ? "hover:bg-slate-800" : "hover:bg-slate-50";

    const actionRow = (key: string, icon: React.ReactNode, label: string, onClick: () => void, trailing?: React.ReactNode) => (
        <button
            key={key}
            type="button"
            onClick={onClick}
            className={`chat-sidebar-row flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left transition-colors ${rowHover}`}
        >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl text-white shadow-md" style={{ background: cv.accentGradient }}>
                {icon}
            </span>
            <span className={`min-w-0 flex-1 text-sm font-semibold ${dark ? "text-slate-100" : "text-slate-800"}`}>{label}</span>
            {trailing}
        </button>
    );

    return (
        <>
            {/* Hero */}
            <div className={`flex flex-col items-center px-6 pt-8 pb-6 text-center ${surface}`}>
                {isGroup ? (
                    <GroupAvatar dark={dark} name={title} size={112} />
                ) : (
                    <PersonAvatar dark={dark} name={title} avatar={activePeer?.avatar} size={112} superBadge={activePeer?.isSuper} />
                )}
                <h4 className="mt-4 text-xl font-bold tracking-tight">{title}</h4>
                <p className={`mt-1 text-sm font-medium ${subText}`}>
                    {isGroup ? `Group · ${members.length} member${members.length === 1 ? "" : "s"}` : activePeer?.role_code || "Community member"}
                </p>
                {!isGroup && activePeer?.role_code && (
                    <span
                        className="mt-3 rounded-full border px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                        style={{ borderColor: cv.accent, color: cv.chip.color, backgroundColor: `${cv.accent}18` }}
                    >
                        {activePeer.role_code}
                    </span>
                )}
            </div>

            {/* Description */}
            {isGroup && activeGroup?.description && (
                <div className={`mt-2 px-6 py-4 ${surface}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${subText}`}>Description</p>
                    <p className={`mt-1.5 whitespace-pre-wrap text-sm leading-relaxed ${dark ? "text-slate-200" : "text-slate-700"}`}>{activeGroup.description}</p>
                </div>
            )}

            {/* Settings */}
            <div className={`mt-2 px-2 py-2 ${surface}`}>
                <SettingRow
                    dark={dark}
                    icon={<IoImagesOutline />}
                    title="Media, links and docs"
                    onClick={() => {
                        c.setMediaTab("media");
                        c.setMediaScope("chat");
                        c.setInfoView("media");
                    }}
                    trailing={
                        <span className={`flex items-center gap-1 text-xs ${subText}`}>
                            {c.mediaTotal > 0 && c.mediaTotal}
                            <IoChevronForward />
                        </span>
                    }
                />
                <SettingRow
                    dark={dark}
                    icon={<IoStarOutline />}
                    title="Starred messages"
                    onClick={() => c.setInfoView("starred")}
                    trailing={
                        <span className={`flex items-center gap-1 text-xs ${subText}`}>
                            {c.starredMessages.length > 0 && c.starredMessages.length}
                            <IoChevronForward />
                        </span>
                    }
                />
                <SettingRow
                    dark={dark}
                    icon={c.mutedNow ? <IoNotificationsOffOutline /> : <IoNotificationsOutline />}
                    title="Notification settings"
                    subtitle={c.mutedNow ? muteLabel(meta.mutedUntil) : undefined}
                    onClick={() => c.setDialog("mute")}
                />
                <SettingRow dark={dark} icon={<IoColorPaletteOutline />} title="Chat theme" onClick={() => c.setThemePickerOpen(true)} />
                <SettingRow
                    dark={dark}
                    icon={<IoLockClosedOutline />}
                    title="Encryption"
                    subtitle={
                        isGroup
                            ? "Only group members can see these messages. Click to learn more."
                            : "Only you and this contact can see these messages. Click to learn more."
                    }
                    onClick={() => c.setDialog("encryption")}
                />
                <SettingRow
                    dark={dark}
                    icon={<IoTimerOutline />}
                    title="Disappearing messages"
                    subtitle={c.canEditSettings ? ttlLabel(shared.ttl) : `${ttlLabel(shared.ttl)} · Only admins can change this`}
                    disabled={!c.canEditSettings}
                    onClick={() => c.setDialog("disappearing")}
                />
                <SettingRow
                    dark={dark}
                    icon={<IoShieldCheckmarkOutline />}
                    title="Advanced chat privacy"
                    subtitle={shared.advPrivacy ? "On" : "Off"}
                    onClick={() => c.setInfoView("privacy")}
                    trailing={<IoChevronForward className={subText} />}
                />
                {isGroup && (
                    <SettingRow
                        dark={dark}
                        icon={<IoSettingsOutline />}
                        title="Group permissions"
                        onClick={() => c.setInfoView("permissions")}
                        trailing={<IoChevronForward className={subText} />}
                    />
                )}
            </div>

            {/* Members / groups in common */}
            <div className={`mt-2 pb-4 ${surface}`}>
                <p className={`flex items-center gap-2 px-6 pt-4 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] ${subText}`}>
                    <IoPeopleOutline className="text-sm" />
                    {isGroup
                        ? `${members.length} Member${members.length === 1 ? "" : "s"}`
                        : `Member of ${peerGroups.length} group${peerGroups.length === 1 ? "" : "s"}`}
                </p>

                <div className="space-y-0.5 px-3">
                    {isGroup && c.canAdd &&
                        actionRow("add", <IoPersonAddOutline />, "Add members", () => {
                            c.setAddSel([]);
                            c.setAddQuery("");
                            c.setInfoView("addMembers");
                        })}
                    {isGroup && c.canInvite && actionRow("invite", <IoLinkOutline />, "Invite via link", c.copyInviteLink)}
                    {isGroup && c.meAdmin && shared.pending.length > 0 &&
                        actionRow(
                            "pending",
                            <IoTimeOutline />,
                            "Pending requests",
                            () => c.setInfoView("pending"),
                            <span className="flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold text-white" style={{ background: cv.accent }}>
                                {shared.pending.length}
                            </span>
                        )}

                    {isGroup
                        ? members.map((m) => {
                            const self = String(m.suid) === me.suid;
                            return (
                                <button
                                    key={m.suid}
                                    disabled={self}
                                    onClick={() => c.openDirectChat(String(m.suid))}
                                    title={self ? "You" : `Message ${m.name}`}
                                    className={`chat-sidebar-row flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left transition-colors ${self ? "cursor-default" : rowHover}`}
                                >
                                    <PersonAvatar dark={dark} name={m.name} avatar={m.avatar} size={44} />
                                    <span className="min-w-0 flex-1">
                                        <span className={`block truncate text-sm font-semibold ${dark ? "text-slate-100" : "text-slate-800"}`}>
                                            {m.name} {self && <span className="font-normal opacity-60">(You)</span>}
                                        </span>
                                        {m.role_code && <span className={`block truncate text-xs ${subText}`}>{m.role_code}</span>}
                                    </span>
                                    {c.isAdminMember(m) && (
                                        <span
                                            className="shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold"
                                            style={{ borderColor: cv.accent, color: cv.chip.color, backgroundColor: `${cv.accent}18` }}
                                        >
                                            Group admin
                                        </span>
                                    )}
                                </button>
                            );
                        })
                        : peerGroups.length === 0 ? (
                            <p className={`py-6 text-center text-xs ${subText}`}>Not in any group</p>
                        ) : (
                            peerGroups.map((g) => (
                                <button
                                    key={g.group_id}
                                    onClick={() => c.openGroupChat(g.group_id)}
                                    className={`chat-sidebar-row flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left transition-colors ${rowHover}`}
                                >
                                    <GroupAvatar dark={dark} name={g.group_name} size={44} />
                                    <span className={`min-w-0 flex-1 truncate text-sm font-semibold ${dark ? "text-slate-100" : "text-slate-800"}`}>{g.group_name}</span>
                                </button>
                            ))
                        )}
                </div>
            </div>

            {/* Contact actions: Export / Clear / Delete */}
            {!isGroup && (
                <div className={`mt-2 mb-4 px-2 py-2 ${surface}`}>
                    <SettingRow
                        dark={dark}
                        icon={<IoDownloadOutline />}
                        title="Export chat"
                        subtitle={shared.advPrivacy ? "Disabled by Advanced chat privacy" : undefined}
                        onClick={c.onExportChat}
                    />
                    <SettingRow dark={dark} tone="danger" icon={<IoRemoveCircleOutline />} title="Clear chat" onClick={() => c.setDialog("clear")} />
                    <SettingRow dark={dark} tone="danger" icon={<IoTrashOutline />} title="Delete chat" onClick={() => c.setDialog("delete")} />
                </div>
            )}
        </>
    );
}

export default InfoMain;
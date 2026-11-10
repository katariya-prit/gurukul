/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
    IoImagesOutline,
    IoStarOutline,
    IoNotificationsOutline,
    IoNotificationsOffOutline,
    IoColorPaletteOutline,
    IoLockClosedOutline,
    IoTimerOutline,
    IoShieldCheckmarkOutline,
    IoSettingsOutline,
    IoPeopleOutline,
    IoPersonAddOutline,
    IoLinkOutline,
    IoTimeOutline,
    IoDownloadOutline,
    IoRemoveCircleOutline,
    IoTrashOutline,
    IoChevronForward,
} from "react-icons/io5";
import { GroupAvatar } from "../../ui/GroupAvatar";
import { PersonAvatar } from "../../ui/PersonAvatar";
import { SettingRow } from "../../ui/SettingRow";
import { muteLabel } from "../../utils/formatters";
import { ttlLabel } from "../../constants";
import type { ChatMessage, ChatUser, ChatVars, ConvMeta, DirUser, InfoView, SharedSettings } from "../../types";
import type { GroupData } from "../../../../../services/groupService";

export type InfoMainViewProps = {
    dark: boolean;
    cv: ChatVars;
    surface: string;
    subText: string;
    isGroup: boolean;
    title: string;
    activeGroup: GroupData | null;
    activePeer: DirUser | null;
    me: ChatUser;
    members: any[];
    peerGroups: GroupData[];
    mediaTotal: number;
    starredMessages: ChatMessage[];
    mutedNow: boolean;
    meta: ConvMeta;
    shared: SharedSettings;
    canEditSettings: boolean;
    canAdd: boolean;
    canInvite: boolean;
    meAdmin: boolean;
    isAdminMember: (m: any) => boolean;
    setInfoView: (v: InfoView) => void;
    setMediaTab: (t: "media" | "docs" | "links") => void;
    setMediaScope: (s: "chat" | "all") => void;
    setDialog: (d: any) => void;
    setThemePickerOpen: (o: boolean) => void;
    setAddSel: React.Dispatch<React.SetStateAction<string[]>> | ((fn: any) => void);
    setAddQuery: (q: string) => void;
    copyInviteLink: () => void;
    openDirectChat: (suid: string) => void;
    openGroupChat: (groupId: number) => void;
    onExportChat: () => void;
};

export function InfoMainView({
    dark,
    cv,
    surface,
    subText,
    isGroup,
    title,
    activeGroup,
    activePeer,
    me,
    members,
    peerGroups,
    mediaTotal,
    starredMessages,
    mutedNow,
    meta,
    shared,
    canEditSettings,
    canAdd,
    canInvite,
    meAdmin,
    isAdminMember,
    setInfoView,
    setMediaTab,
    setMediaScope,
    setDialog,
    setThemePickerOpen,
    setAddSel,
    setAddQuery,
    copyInviteLink,
    openDirectChat,
    openGroupChat,
    onExportChat,
}: InfoMainViewProps) {
    const actionRow = (
        key: string,
        icon: React.ReactNode,
        label: string,
        onClick: () => void,
        trailing?: React.ReactNode
    ) => (
        <button
            key={key}
            type="button"
            onClick={onClick}
            className={`chat-sidebar-row flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left transition-colors ${
                dark ? "hover:bg-slate-800" : "hover:bg-slate-50"
            }`}
        >
            <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl text-white shadow-md"
                style={{ background: cv.accentGradient }}
            >
                {icon}
            </span>
            <span className={`min-w-0 flex-1 text-sm font-semibold ${dark ? "text-slate-100" : "text-slate-800"}`}>
                {label}
            </span>
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
                    {isGroup
                        ? `Group · ${members.length} member${members.length === 1 ? "" : "s"}`
                        : activePeer?.role_code || "Community member"}
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
                    <p className={`mt-1.5 text-sm leading-relaxed whitespace-pre-wrap ${dark ? "text-slate-200" : "text-slate-700"}`}>
                        {activeGroup.description}
                    </p>
                </div>
            )}

            {/* Settings */}
            <div className={`mt-2 px-2 py-2 ${surface}`}>
                <SettingRow
                    dark={dark}
                    icon={<IoImagesOutline />}
                    title="Media, links and docs"
                    onClick={() => {
                        setMediaTab("media");
                        setMediaScope("chat");
                        setInfoView("media");
                    }}
                    trailing={
                        <span className={`flex items-center gap-1 text-xs ${subText}`}>
                            {mediaTotal > 0 && mediaTotal}
                            <IoChevronForward />
                        </span>
                    }
                />
                <SettingRow
                    dark={dark}
                    icon={<IoStarOutline />}
                    title="Starred messages"
                    onClick={() => setInfoView("starred")}
                    trailing={
                        <span className={`flex items-center gap-1 text-xs ${subText}`}>
                            {starredMessages.length > 0 && starredMessages.length}
                            <IoChevronForward />
                        </span>
                    }
                />
                <SettingRow
                    dark={dark}
                    icon={mutedNow ? <IoNotificationsOffOutline /> : <IoNotificationsOutline />}
                    title="Notification settings"
                    subtitle={mutedNow ? muteLabel(meta.mutedUntil) : undefined}
                    onClick={() => setDialog("mute")}
                />
                <SettingRow
                    dark={dark}
                    icon={<IoColorPaletteOutline />}
                    title="Chat theme"
                    onClick={() => setThemePickerOpen(true)}
                />
                <SettingRow
                    dark={dark}
                    icon={<IoLockClosedOutline />}
                    title="Encryption"
                    subtitle={
                        isGroup
                            ? "Only group members can see these messages. Click to learn more."
                            : "Only you and this contact can see these messages. Click to learn more."
                    }
                    onClick={() => setDialog("encryption")}
                />
                <SettingRow
                    dark={dark}
                    icon={<IoTimerOutline />}
                    title="Disappearing messages"
                    subtitle={canEditSettings ? ttlLabel(shared.ttl) : `${ttlLabel(shared.ttl)} · Only admins can change this`}
                    disabled={!canEditSettings}
                    onClick={() => setDialog("disappearing")}
                />
                <SettingRow
                    dark={dark}
                    icon={<IoShieldCheckmarkOutline />}
                    title="Advanced chat privacy"
                    subtitle={shared.advPrivacy ? "On" : "Off"}
                    onClick={() => setInfoView("privacy")}
                    trailing={<IoChevronForward className={subText} />}
                />
                {isGroup && (
                    <SettingRow
                        dark={dark}
                        icon={<IoSettingsOutline />}
                        title="Group permissions"
                        onClick={() => setInfoView("permissions")}
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

                <div className="px-3 space-y-0.5">
                    {isGroup && canAdd &&
                        actionRow("add", <IoPersonAddOutline />, "Add members", () => {
                            setAddSel([]);
                            setAddQuery("");
                            setInfoView("addMembers");
                        })}
                    {isGroup && canInvite && actionRow("invite", <IoLinkOutline />, "Invite via link", copyInviteLink)}
                    {isGroup && meAdmin && shared.pending.length > 0 &&
                        actionRow(
                            "pending",
                            <IoTimeOutline />,
                            "Pending requests",
                            () => setInfoView("pending"),
                            <span
                                className="flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold text-white"
                                style={{ background: cv.accent }}
                            >
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
                                    onClick={() => openDirectChat(String(m.suid))}
                                    title={self ? "You" : `Message ${m.name}`}
                                    className={`chat-sidebar-row w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-left transition-colors
                                    ${self ? "cursor-default" : dark ? "hover:bg-slate-800" : "hover:bg-slate-50"}`}
                                >
                                    <PersonAvatar dark={dark} name={m.name} avatar={m.avatar} size={44} />
                                    <span className="min-w-0 flex-1">
                                        <span className={`block truncate text-sm font-semibold ${dark ? "text-slate-100" : "text-slate-800"}`}>
                                            {m.name} {self && <span className="font-normal opacity-60">(You)</span>}
                                        </span>
                                        {m.role_code && <span className={`block truncate text-xs ${subText}`}>{m.role_code}</span>}
                                    </span>
                                    {isAdminMember(m) && (
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
                                    onClick={() => openGroupChat(g.group_id)}
                                    className={`chat-sidebar-row w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-left transition-colors ${
                                        dark ? "hover:bg-slate-800" : "hover:bg-slate-50"
                                    }`}
                                >
                                    <GroupAvatar dark={dark} name={g.group_name} size={44} />
                                    <span className={`min-w-0 flex-1 truncate text-sm font-semibold ${dark ? "text-slate-100" : "text-slate-800"}`}>
                                        {g.group_name}
                                    </span>
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
                        onClick={onExportChat}
                    />
                    <SettingRow
                        dark={dark}
                        tone="danger"
                        icon={<IoRemoveCircleOutline />}
                        title="Clear chat"
                        onClick={() => setDialog("clear")}
                    />
                    <SettingRow
                        dark={dark}
                        tone="danger"
                        icon={<IoTrashOutline />}
                        title="Delete chat"
                        onClick={() => setDialog("delete")}
                    />
                </div>
            )}
        </>
    );
}

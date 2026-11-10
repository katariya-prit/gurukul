import React from "react";
import {
    IoCreateOutline,
    IoChatboxOutline,
    IoPersonAddOutline,
    IoLinkOutline,
    IoTimeOutline,
    IoShieldCheckmarkOutline,
    IoPeopleOutline,
    IoChevronForward,
} from "react-icons/io5";
import { SettingRow } from "../../ui/SettingRow";
import { Switch } from "../../ui/Switch";
import type { ChatVars, SharedSettings } from "../../types";

export type InfoPermissionsViewProps = {
    dark: boolean;
    cv: ChatVars;
    surface: string;
    subText: string;
    meAdmin: boolean;
    shared: SharedSettings;
    adminMembersCount: number;
    adminMembersNames: string;
    onSetPermission: (patch: Partial<SharedSettings>) => void;
    onGoToAdmins: () => void;
};

export function InfoPermissionsView({
    dark,
    cv,
    surface,
    subText,
    meAdmin,
    shared,
    adminMembersCount,
    adminMembersNames,
    onSetPermission,
    onGoToAdmins,
}: InfoPermissionsViewProps) {
    const sectionLabel = (text: string) => (
        <p className={`px-6 pt-5 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] ${subText}`}>{text}</p>
    );

    const permRow = (
        icon: React.ReactNode,
        titleText: string,
        subtitleText: string | undefined,
        value: boolean,
        onToggle: () => void
    ) => (
        <SettingRow
            dark={dark}
            icon={icon}
            title={titleText}
            subtitle={subtitleText}
            disabled={!meAdmin}
            onClick={onToggle}
            trailing={<Switch on={value} dark={dark} accent={cv.accent} />}
        />
    );

    return (
        <div className={`${surface} min-h-full pb-6`}>
            {sectionLabel("Members can:")}
            <div className="px-2">
                {permRow(
                    <IoCreateOutline />,
                    "Edit group settings",
                    "This includes the disappearing message timer and Advanced chat privacy. When turned off, only admins can change them.",
                    shared.membersEditSettings,
                    () => onSetPermission({ membersEditSettings: !shared.membersEditSettings })
                )}
                {permRow(
                    <IoChatboxOutline />,
                    "Send new messages",
                    shared.onlyAdminsSend ? "Only admins can send messages" : undefined,
                    !shared.onlyAdminsSend,
                    () => onSetPermission({ onlyAdminsSend: !shared.onlyAdminsSend })
                )}
                {permRow(
                    <IoPersonAddOutline />,
                    "Add other members",
                    undefined,
                    shared.membersAdd,
                    () => onSetPermission({ membersAdd: !shared.membersAdd })
                )}
                {permRow(
                    <IoLinkOutline />,
                    "Invite via link",
                    undefined,
                    shared.membersInvite,
                    () => onSetPermission({ membersInvite: !shared.membersInvite })
                )}
                {permRow(
                    <IoTimeOutline />,
                    "Send message history",
                    "Past messages can be sent to new members.",
                    shared.sendHistory,
                    () => onSetPermission({ sendHistory: !shared.sendHistory })
                )}
            </div>

            {sectionLabel("Admins can:")}
            <div className="px-2">
                {permRow(
                    <IoShieldCheckmarkOutline />,
                    "Approve new members",
                    "When turned on, admins must approve anyone who wants to join this group using the invite link.",
                    shared.approveNew,
                    () => onSetPermission({ approveNew: !shared.approveNew })
                )}
            </div>

            {sectionLabel("Group admins")}
            <div className="px-2">
                <SettingRow
                    dark={dark}
                    icon={<IoPeopleOutline />}
                    title="Edit group admins"
                    subtitle={adminMembersCount ? adminMembersNames : "No admins"}
                    onClick={onGoToAdmins}
                    trailing={<IoChevronForward className={subText} />}
                />
            </div>

            {!meAdmin && (
                <p
                    className={`mx-6 mt-4 rounded-xl border px-4 py-3 text-xs leading-relaxed ${
                        dark ? "border-slate-700/70 text-slate-400" : "border-slate-200 text-slate-500"
                    }`}
                >
                    Only admins can change these permissions.
                </p>
            )}
        </div>
    );
}

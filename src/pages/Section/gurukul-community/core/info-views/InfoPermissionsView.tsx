import { IoChatboxOutline, IoChevronForward, IoCreateOutline, IoLinkOutline, IoPeopleOutline, IoPersonAddOutline, IoShieldCheckmarkOutline, IoTimeOutline } from "react-icons/io5";
import { SettingRow } from "../../ui/SettingRow";
import { Switch } from "../../ui/Switch";
import type { InfoCtx } from "./infoTypes";

export function InfoPermissions({ c }: { c: InfoCtx }) {
    const { dark, cv, surface, subText, shared, meAdmin, adminMembers } = c;

    const label = (text: string) => <p className={`px-6 pt-5 pb-1 text-xs font-semibold ${subText}`}>{text}</p>;

    const row = (icon: React.ReactNode, title: string, subtitle: string | undefined, on: boolean, patch: () => any) => (
        <SettingRow
            dark={dark}
            icon={icon}
            title={title}
            subtitle={subtitle}
            switchOn={on}
            disabled={!meAdmin}
            onClick={() => c.onSetPermission(patch())}
            trailing={<Switch on={on} dark={dark} accent={cv.accent} />}
        />
    );

    return (
        <div className={`${surface} min-h-full pb-6`}>
            {label("Members can:")}
            <div className="px-2">
                {row(
                    <IoCreateOutline />,
                    "Edit group settings",
                    "This includes the disappearing message timer and Advanced chat privacy. When turned off, only admins can change them.",
                    shared.membersEditSettings,
                    () => ({ membersEditSettings: !shared.membersEditSettings })
                )}
                {row(<IoChatboxOutline />, "Send new messages", shared.onlyAdminsSend ? "Only admins can send messages" : undefined, !shared.onlyAdminsSend, () => ({
                    onlyAdminsSend: !shared.onlyAdminsSend,
                }))}
                {row(<IoPersonAddOutline />, "Add other members", undefined, shared.membersAdd, () => ({ membersAdd: !shared.membersAdd }))}
                {row(<IoLinkOutline />, "Invite via link", undefined, shared.membersInvite, () => ({ membersInvite: !shared.membersInvite }))}
                {row(<IoTimeOutline />, "Send message history", "Past messages can be sent to new members.", shared.sendHistory, () => ({
                    sendHistory: !shared.sendHistory,
                }))}
            </div>

            {label("Admins can:")}
            <div className="px-2">
                {row(
                    <IoShieldCheckmarkOutline />,
                    "Approve new members",
                    "When turned on, admins must approve anyone who wants to join this group using the invite link.",
                    shared.approveNew,
                    () => ({ approveNew: !shared.approveNew })
                )}
            </div>

            {label("Group admins")}
            <div className="px-2">
                <SettingRow
                    dark={dark}
                    icon={<IoPeopleOutline />}
                    title="Edit group admins"
                    subtitle={adminMembers.length ? adminMembers.map((m) => m.name).join(", ") : "No admins"}
                    onClick={() => c.setInfoView("admins")}
                    trailing={<IoChevronForward className={subText} />}
                />
            </div>

            {!meAdmin && (
                <p className={`mx-6 mt-4 rounded-xl border px-4 py-3 text-xs leading-relaxed ${dark ? "border-slate-700/70 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                    Only admins can change these permissions.
                </p>
            )}
        </div>
    );
}

export default InfoPermissions;
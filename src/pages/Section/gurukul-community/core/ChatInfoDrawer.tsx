/* eslint-disable @typescript-eslint/no-explicit-any */
import { IoClose, IoArrowBack } from "react-icons/io5";
import { HIDE_SCROLL } from "../constants";
import { InfoMainView } from "./info-views/InfoMainView";
import { InfoMediaView } from "./info-views/InfoMediaView";
import { InfoPrivacyView } from "./info-views/InfoPrivacyView";
import { InfoStarredView } from "./info-views/InfoStarredView";
import { InfoPermissionsView } from "./info-views/InfoPermissionsView";
import { InfoAdminsView } from "./info-views/InfoAdminsView";
import { InfoAddMembersView } from "./info-views/InfoAddMembersView";
import { InfoPendingView } from "./info-views/InfoPendingView";
import type {
    ChatMessage,
    ChatUser,
    ChatVars,
    ConvMeta,
    DirUser,
    InfoView,
    MediaBuckets,
    MediaItem,
    MediaTab,
    SharedSettings,
} from "../types";
import type { GroupData } from "../../../../services/groupService";

export type ChatInfoDrawerProps = {
    infoOpen: boolean;
    infoView: InfoView;
    setInfoView: (v: InfoView) => void;
    setInfoOpen: (o: boolean) => void;
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
    setMediaTab: (t: MediaTab) => void;
    setMediaScope: (fn: any) => void;
    mediaTab: MediaTab;
    mediaScope: "chat" | "all";
    buckets: MediaBuckets;
    now: number;
    avatarBySuid: Map<string, string | undefined>;
    candidates: DirUser[];
    addQuery: string;
    setAddQuery: (q: string) => void;
    addSel: string[];
    setAddSel: (fn: (cur: string[]) => string[]) => void;
    directory: DirUser[];
    setDialog: (d: any) => void;
    setThemePickerOpen: (o: boolean) => void;
    copyInviteLink: () => void;
    openDirectChat: (suid: string) => void;
    openGroupChat: (groupId: number) => void;
    onExportChat: () => void;
    onOpenMedia: (id: string, customList?: MediaItem[]) => void;
    onDownload: (m: ChatMessage) => void;
    onTogglePrivacy: () => void;
    onJumpToMessage: (id: string) => void;
    onToggleStar: (id: string) => void;
    onSetPermission: (patch: Partial<SharedSettings>) => void;
    onToggleAdmin: (suid: string) => void;
    onConfirmAddMembers: () => void;
    onAcceptRequest: (suid: string) => void;
    onRejectRequest: (suid: string) => void;
};

export function ChatInfoDrawer({
    infoOpen,
    infoView,
    setInfoView,
    setInfoOpen,
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
    setMediaTab,
    setMediaScope,
    mediaTab,
    mediaScope,
    buckets,
    now,
    avatarBySuid,
    candidates,
    addQuery,
    setAddQuery,
    addSel,
    setAddSel,
    directory,
    setDialog,
    setThemePickerOpen,
    copyInviteLink,
    openDirectChat,
    openGroupChat,
    onExportChat,
    onOpenMedia,
    onDownload,
    onTogglePrivacy,
    onJumpToMessage,
    onToggleStar,
    onSetPermission,
    onToggleAdmin,
    onConfirmAddMembers,
    onAcceptRequest,
    onRejectRequest,
}: ChatInfoDrawerProps) {
    if (!infoOpen) return null;

    const infoBack = (v: InfoView): InfoView => (v === "admins" ? "permissions" : "main");

    const infoTitle =
        infoView === "starred"
            ? "Starred messages"
            : infoView === "permissions"
                ? "Group permissions"
                : infoView === "admins"
                    ? "Edit group admins"
                    : infoView === "addMembers"
                        ? "Add members"
                        : infoView === "pending"
                            ? "Pending requests"
                            : infoView === "privacy"
                                ? "Advanced chat privacy"
                                : infoView === "media"
                                    ? "Media, links and docs"
                                    : isGroup
                                        ? "Group info"
                                        : "Contact info";

    const adminMembers = members.filter(isAdminMember);

    return (
        <div
            className={`absolute inset-0 z-30 flex flex-col ${
                dark ? "bg-[#0B1120] text-slate-100" : "bg-slate-50 text-slate-900"
            } md:static md:w-88 lg:w-96 md:border-l ${dark ? "md:border-slate-700/80" : "md:border-slate-200"}`}
            style={{ animation: "gkInfoIn .18s ease-out" }}
        >
            <div
                className={`flex shrink-0 items-center gap-3 px-4 py-3 border-b ${
                    dark ? "bg-[#0E1626] border-slate-700/80" : "bg-white border-slate-200"
                }`}
            >
                <button
                    onClick={() => (infoView === "main" ? setInfoOpen(false) : setInfoView(infoBack(infoView)))}
                    aria-label={infoView === "main" ? "Close" : "Back"}
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                        dark ? "text-slate-200 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"
                    }`}
                >
                    {infoView === "main" ? <IoClose className="text-xl" /> : <IoArrowBack className="text-xl" />}
                </button>
                <h3 className="text-base font-bold tracking-tight">{infoTitle}</h3>
            </div>

            <div className={`flex-1 min-h-0 overflow-y-auto ${HIDE_SCROLL}`}>
                {infoView === "starred" && (
                    <InfoStarredView
                        dark={dark}
                        surface={surface}
                        subText={subText}
                        me={me}
                        avatarBySuid={avatarBySuid}
                        starredMessages={starredMessages}
                        onJumpToMessage={onJumpToMessage}
                        onToggleStar={onToggleStar}
                    />
                )}
                {infoView === "permissions" && (
                    <InfoPermissionsView
                        dark={dark}
                        cv={cv}
                        surface={surface}
                        subText={subText}
                        meAdmin={meAdmin}
                        shared={shared}
                        adminMembersCount={adminMembers.length}
                        adminMembersNames={adminMembers.map((m) => m.name).join(", ")}
                        onSetPermission={onSetPermission}
                        onGoToAdmins={() => setInfoView("admins")}
                    />
                )}
                {infoView === "admins" && (
                    <InfoAdminsView
                        dark={dark}
                        cv={cv}
                        surface={surface}
                        subText={subText}
                        me={me}
                        meAdmin={meAdmin}
                        members={members}
                        shared={shared}
                        onToggleAdmin={onToggleAdmin}
                    />
                )}
                {infoView === "addMembers" && (
                    <InfoAddMembersView
                        dark={dark}
                        cv={cv}
                        surface={surface}
                        subText={subText}
                        shared={shared}
                        addQuery={addQuery}
                        setAddQuery={setAddQuery}
                        addSel={addSel}
                        setAddSel={setAddSel}
                        candidates={candidates}
                        onConfirmAddMembers={onConfirmAddMembers}
                    />
                )}
                {infoView === "pending" && (
                    <InfoPendingView
                        dark={dark}
                        cv={cv}
                        surface={surface}
                        subText={subText}
                        shared={shared}
                        directory={directory}
                        onAcceptRequest={onAcceptRequest}
                        onRejectRequest={onRejectRequest}
                    />
                )}
                {infoView === "privacy" && (
                    <InfoPrivacyView
                        dark={dark}
                        cv={cv}
                        surface={surface}
                        subText={subText}
                        isGroup={isGroup}
                        shared={shared}
                        canEditSettings={canEditSettings}
                        onTogglePrivacy={onTogglePrivacy}
                    />
                )}
                {infoView === "media" && (
                    <InfoMediaView
                        dark={dark}
                        cv={cv}
                        surface={surface}
                        subText={subText}
                        mediaTab={mediaTab}
                        setMediaTab={setMediaTab}
                        mediaScope={mediaScope}
                        setMediaScope={setMediaScope}
                        buckets={buckets}
                        now={now}
                        onOpenMedia={onOpenMedia}
                        onDownload={onDownload}
                    />
                )}
                {infoView === "main" && (
                    <InfoMainView
                        dark={dark}
                        cv={cv}
                        surface={surface}
                        subText={subText}
                        isGroup={isGroup}
                        title={title}
                        activeGroup={activeGroup}
                        activePeer={activePeer}
                        me={me}
                        members={members}
                        peerGroups={peerGroups}
                        mediaTotal={mediaTotal}
                        starredMessages={starredMessages}
                        mutedNow={mutedNow}
                        meta={meta}
                        shared={shared}
                        canEditSettings={canEditSettings}
                        canAdd={canAdd}
                        canInvite={canInvite}
                        meAdmin={meAdmin}
                        isAdminMember={isAdminMember}
                        setInfoView={setInfoView}
                        setMediaTab={setMediaTab}
                        setMediaScope={setMediaScope}
                        setDialog={setDialog}
                        setThemePickerOpen={setThemePickerOpen}
                        setAddSel={setAddSel}
                        setAddQuery={setAddQuery}
                        copyInviteLink={copyInviteLink}
                        openDirectChat={openDirectChat}
                        openGroupChat={openGroupChat}
                        onExportChat={onExportChat}
                    />
                )}
            </div>
        </div>
    );
}

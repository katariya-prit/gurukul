/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { IoPaperPlaneOutline } from "react-icons/io5";
import ChatThemePicker from "../../../../components/chat/ChatThemePicker";
import { DEFAULT_CHAT_THEME_ID, getChatTheme } from "../../../../components/chat/chatThemes";
import { ChatHeader } from "./ChatHeader";
import { ChatMessagesArea } from "./ChatMessagesArea";
import { ChatInfoDrawer } from "./ChatInfoDrawer";
import { ChatDialogs } from "./ChatDialogs";
import { MediaLightbox } from "./MediaLightbox";
import { resolveStoredChatTheme, isMuted } from "../utils/storage";
import { isSuperRole } from "../utils/userHelpers";
import type {
    ChatMessage,
    ChatUser,
    ChatVars,
    ConvMeta,
    DialogKind,
    DirUser,
    InfoView,
    MediaBuckets,
    MediaItem,
    MediaTab,
    SharedSettings,
} from "../types";
import type { GroupData } from "../../../../services/groupService";

export type ChatAreaProps = {
    dark: boolean;
    isStudent?: boolean;
    convKey: string | null;
    activeGroup: GroupData | null;
    activePeer: DirUser | null;
    chatTitle: string;
    groupsOfUser: (suid: string) => GroupData[];
    activeMembers: any[];
    themeConversationKey: string | null;
    chatThemeId: string;
    applyThemeToAll: boolean;
    now: number;
    meta: ConvMeta;
    shared: SharedSettings;
    messages: ChatMessage[];
    rows: {
        m: ChatMessage;
        day: string | null;
        mine: boolean;
        sameSender: boolean;
        showName: boolean;
        nameColor: string;
        avatar?: string;
    }[];
    starredSet: Set<string>;
    starredMessages: ChatMessage[];
    highlightId: string | null;
    hasEarlier: boolean;
    canSend: boolean;
    adminBlocked: boolean;
    canEditSettings: boolean;
    canAdd: boolean;
    canInvite: boolean;
    meAdmin: boolean;
    me: ChatUser;
    messagesRef: React.RefObject<HTMLDivElement | null>;
    infoOpen: boolean;
    infoView: InfoView;
    dialog: DialogKind;
    themePickerOpen: boolean;
    mediaTab: MediaTab;
    mediaScope: "chat" | "all";
    mediaTotal: number;
    buckets: MediaBuckets;
    lightbox: { items: MediaItem[]; index: number } | null;
    avatarBySuid: Map<string, string | undefined>;
    candidates: DirUser[];
    addQuery: string;
    setAddQuery: (q: string) => void;
    addSel: string[];
    setAddSel: (fn: (cur: string[]) => string[]) => void;
    directory: DirUser[];
    setInfoOpen: (o: boolean) => void;
    setInfoView: (v: InfoView) => void;
    setDialog: (d: DialogKind) => void;
    setThemePickerOpen: (o: boolean) => void;
    setMediaTab: (t: MediaTab) => void;
    setMediaScope: (fn: any) => void;
    setChatThemeId: (id: string) => void;
    setApplyThemeToAll: (a: boolean) => void;
    onCloseChat: () => void;
    onNewMessageOpen: () => void;
    onMessagesScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    onLoadEarlier: () => void;
    onStar: (id: string) => void;
    onOpenMedia: (id: string, customList?: MediaItem[]) => void;
    onDownload: (m: ChatMessage) => void;
    onSend: (text: string, files: File[]) => Promise<boolean>;
    onPersistChatTheme: (id: string, applyToAll: boolean) => void;
    onApplyMute: (choice: any) => void;
    onApplyTtl: (ms: number) => void;
    onTogglePrivacy: () => void;
    onExportChat: () => void;
    onClearChat: () => void;
    onDeleteChat: () => void;
    onSetPermission: (patch: Partial<SharedSettings>) => void;
    onToggleAdmin: (suid: string) => void;
    onConfirmAddMembers: () => void;
    onAcceptRequest: (suid: string) => void;
    onRejectRequest: (suid: string) => void;
    copyInviteLink: () => void;
    openDirectChat: (suid: string) => void;
    openGroupChat: (groupId: number) => void;
    onJumpToMessage: (id: string) => void;
    onLightboxClose: () => void;
    onLightboxGo: (delta: number) => void;
};

export function ChatArea({
    dark,
    isStudent = false,
    convKey,
    activeGroup,
    activePeer,
    chatTitle,
    groupsOfUser,
    activeMembers,
    themeConversationKey,
    chatThemeId,
    applyThemeToAll,
    now,
    meta,
    shared,
    messages,
    rows,
    starredSet,
    starredMessages,
    highlightId,
    hasEarlier,
    canSend,
    adminBlocked,
    canEditSettings,
    canAdd,
    canInvite,
    meAdmin,
    me,
    messagesRef,
    infoOpen,
    infoView,
    dialog,
    themePickerOpen,
    mediaTab,
    mediaScope,
    mediaTotal,
    buckets,
    lightbox,
    avatarBySuid,
    candidates,
    addQuery,
    setAddQuery,
    addSel,
    setAddSel,
    directory,
    setInfoOpen,
    setInfoView,
    setDialog,
    setThemePickerOpen,
    setMediaTab,
    setMediaScope,
    setChatThemeId,
    setApplyThemeToAll,
    onCloseChat,
    onNewMessageOpen,
    onMessagesScroll,
    onLoadEarlier,
    onStar,
    onOpenMedia,
    onDownload,
    onSend,
    onPersistChatTheme,
    onApplyMute,
    onApplyTtl,
    onTogglePrivacy,
    onExportChat,
    onClearChat,
    onDeleteChat,
    onSetPermission,
    onToggleAdmin,
    onConfirmAddMembers,
    onAcceptRequest,
    onRejectRequest,
    copyInviteLink,
    openDirectChat,
    openGroupChat,
    onJumpToMessage,
    onLightboxClose,
    onLightboxGo,
}: ChatAreaProps) {
    if (!convKey) {
        return (
            <div
                className={`${convKey ? "hidden" : "hidden md:flex"} flex-1 min-w-0 flex-col items-center justify-center gap-3 px-6 text-center
                ${dark ? "bg-[#0A0E14]" : "bg-[#FAFAFA]"}`}
            >
                <span
                    className={`flex h-24 w-24 items-center justify-center rounded-full border-2 ${
                        dark ? "border-slate-200 text-slate-100" : "border-slate-900 text-slate-900"
                    }`}
                >
                    <IoPaperPlaneOutline className="text-5xl" />
                </span>
                <h2 className={`mt-2 text-xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>
                    {isStudent ? "Gurukul Groups" : "Your messages"}
                </h2>
                <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>
                    {isStudent ? "Select a group from the list to start chatting." : "Send a message to start a chat."}
                </p>
                {!isStudent && (
                    <button
                        onClick={onNewMessageOpen}
                        className={`mt-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all active:scale-95
                        ${dark ? "bg-blue-600 hover:bg-blue-500 shadow-blue-900/40" : "bg-red-600 hover:bg-red-700 shadow-red-600/25"}`}
                    >
                        Send message
                    </button>
                )}
            </div>
        );
    }

    const isGroup = !!activeGroup;
    const title = chatTitle;
    const peerGroups = activePeer ? groupsOfUser(activePeer.suid) : [];
    const members = isGroup ? activeMembers : [];
    const subtitle = isGroup
        ? members.map((m) => m.name).join(", ")
        : [activePeer?.role_code, peerGroups.map((g) => g.group_name).join(", ")].filter(Boolean).join(" · ") ||
          "Direct message";

    const preference =
        themeConversationKey === convKey
            ? { id: chatThemeId, applyToAll: applyThemeToAll }
            : resolveStoredChatTheme(convKey);
    const ct = getChatTheme(preference.id);
    const cv: ChatVars = dark ? ct.dark : ct.light;

    const surface = dark ? "bg-[#0E1626]" : "bg-white";
    const subText = dark ? "text-slate-400" : "text-slate-500";
    const mutedNow = isMuted(meta.mutedUntil, now);

    const isAdminMember = (m: any) => isSuperRole(m.role_code, m.name) || shared.admins.includes(String(m.suid));

    return (
        <div className="flex flex-1 min-w-0 min-h-0">
            <style>{`
                @keyframes gkInfoIn {
                    from { opacity: 0; transform: translateX(24px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes gkDialogIn {
                    from { opacity: 0; transform: translateY(8px) scale(.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes gkAvatarRing {
                    0% { box-shadow: 0 0 0 0 ${cv.accent}66; }
                    100% { box-shadow: 0 0 0 12px ${cv.accent}00; }
                }
                .gk-hd-avatar {
                    border-radius: 9999px;
                    transition: transform .35s cubic-bezier(.34, 1.56, .64, 1);
                }
                .gk-hd-btn:hover .gk-hd-avatar,
                .gk-hd-btn:focus-visible .gk-hd-avatar {
                    transform: scale(1.12) rotate(-6deg);
                    animation: gkAvatarRing 1.1s ease-out infinite;
                }
                .gk-hd-btn:active .gk-hd-avatar {
                    transform: scale(.96);
                }
                .chat-themed-input:focus {
                    border-color: ${cv.accent};
                    box-shadow: 0 0 0 2px ${cv.accent}33;
                }
                .chat-sidebar-row:not(:disabled):hover {
                    background-color: ${cv.accent}12;
                }
                @media (prefers-reduced-motion: reduce) {
                    .gk-hd-btn:hover .gk-hd-avatar,
                    .gk-hd-btn:focus-visible .gk-hd-avatar { animation: none; transform: none; }
                }
            `}</style>

            <section className="relative flex-1 min-w-0 min-h-0 h-full flex flex-col overflow-clip">
                <ChatHeader
                    dark={dark}
                    cv={cv}
                    isGroup={isGroup}
                    title={title}
                    subtitle={subtitle}
                    activePeer={activePeer}
                    onBack={onCloseChat}
                    onOpenInfo={() => {
                        setInfoView("main");
                        setInfoOpen(true);
                    }}
                />

                <ChatMessagesArea
                    dark={dark}
                    cv={cv}
                    title={title}
                    convKey={convKey}
                    messages={messages}
                    rows={rows}
                    starredSet={starredSet}
                    highlightId={highlightId}
                    shared={shared}
                    hasEarlier={hasEarlier}
                    canSend={canSend}
                    adminBlocked={adminBlocked}
                    meName={me.name}
                    messagesRef={messagesRef}
                    onMessagesScroll={onMessagesScroll}
                    onLoadEarlier={onLoadEarlier}
                    onStar={onStar}
                    onOpenMedia={onOpenMedia}
                    onDownload={onDownload}
                    onSend={onSend}
                />

                <ChatInfoDrawer
                    infoOpen={infoOpen}
                    infoView={infoView}
                    setInfoView={setInfoView}
                    setInfoOpen={setInfoOpen}
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
                    setMediaTab={setMediaTab}
                    setMediaScope={setMediaScope}
                    mediaTab={mediaTab}
                    mediaScope={mediaScope}
                    buckets={buckets}
                    now={now}
                    avatarBySuid={avatarBySuid}
                    candidates={candidates}
                    addQuery={addQuery}
                    setAddQuery={setAddQuery}
                    addSel={addSel}
                    setAddSel={setAddSel}
                    directory={directory}
                    setDialog={setDialog}
                    setThemePickerOpen={setThemePickerOpen}
                    copyInviteLink={copyInviteLink}
                    openDirectChat={openDirectChat}
                    openGroupChat={openGroupChat}
                    onExportChat={onExportChat}
                    onOpenMedia={onOpenMedia}
                    onDownload={onDownload}
                    onTogglePrivacy={onTogglePrivacy}
                    onJumpToMessage={onJumpToMessage}
                    onToggleStar={onStar}
                    onSetPermission={onSetPermission}
                    onToggleAdmin={onToggleAdmin}
                    onConfirmAddMembers={onConfirmAddMembers}
                    onAcceptRequest={onAcceptRequest}
                    onRejectRequest={onRejectRequest}
                />

                <ChatDialogs
                    dialog={dialog}
                    dark={dark}
                    cv={cv}
                    isGroup={isGroup}
                    mutedNow={mutedNow}
                    meta={meta}
                    shared={shared}
                    onClose={() => setDialog(null)}
                    onApplyMute={onApplyMute}
                    onApplyTtl={onApplyTtl}
                    onClearChat={onClearChat}
                    onDeleteChat={onDeleteChat}
                />

                <MediaLightbox
                    lightbox={lightbox}
                    me={me}
                    mediaScope={mediaScope}
                    onClose={onLightboxClose}
                    onGo={onLightboxGo}
                    onDownload={onDownload}
                />

                <ChatThemePicker
                    open={themePickerOpen && themeConversationKey === convKey}
                    dark={dark}
                    selectedId={preference.id}
                    applyToAll={preference.applyToAll}
                    onSelect={(id) => {
                        setChatThemeId(id);
                        onPersistChatTheme(id, preference.applyToAll);
                    }}
                    onApplyToAllChange={(applyToAllState) => {
                        setApplyThemeToAll(applyToAllState);
                        onPersistChatTheme(preference.id, applyToAllState);
                    }}
                    onReset={() => {
                        setChatThemeId(DEFAULT_CHAT_THEME_ID);
                        onPersistChatTheme(DEFAULT_CHAT_THEME_ID, preference.applyToAll);
                    }}
                    onClose={() => setThemePickerOpen(false)}
                />
            </section>
        </div>
    );
}

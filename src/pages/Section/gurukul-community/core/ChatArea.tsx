/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GroupData } from "../../../../services/groupService";
import ChatThemePicker from "../../../../components/chat/ChatThemePicker";
import { DEFAULT_CHAT_THEME_ID, getChatTheme } from "../../../../components/chat/chatThemes";
import { IoLockClosedOutline, IoPaperPlaneOutline } from "react-icons/io5";
import type {
    ChatMessage, ChatUser, ConvMeta, DialogKind, DirUser, InfoView, MediaBuckets, MediaItem, MediaTab, SharedSettings,
} from "../types";
import type { MsgRow } from "../messageTypes";
import type { MessageActions } from "../hooks/useMessageActions";
import { resolveStoredChatTheme } from "../utils/storage";
import { isSuperRole } from "../utils/userHelpers";
import { ChatHeader } from "./ChatHeader";
import { PinnedBanner } from "./PinnedBanner";
import { ChatMessagesArea } from "./ChatMessagesArea";
import { Composer } from "./Composer";
import { ChatInfoDrawer } from "./ChatInfoDrawer";
import { ChatDialogs } from "./ChatDialogs";
import { MessageDialogs } from "./MessageDialogs";
import { MessageInfoPanel } from "./MessageInfoPanel";
import { MessageMenuHost } from "./MessageMenu";
import { MediaLightbox } from "./MediaLightbox";
import type { InfoCtx } from "./info-views/infoTypes";
import type { TypingEntry } from "../hooks/Usetyping";

type Setter<T> = React.Dispatch<React.SetStateAction<T>>;

export type ChatAreaProps = {
    dark: boolean;
    isStudent: boolean;
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
    typingEntries: TypingEntry[];
    typingLabel: string;
    onComposerInput: () => void;
    onComposerStop: () => void;
    rows: MsgRow[];
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
    messagesRef: React.RefObject<any>;
    infoOpen: boolean;
    infoView: InfoView;
    dialog: DialogKind;
    themePickerOpen: boolean;
    mediaTab: MediaTab;
    mediaScope: "chat" | "all";
    mediaTotal: number;
    buckets: MediaBuckets;
    lightbox: { items: MediaItem[]; index: number } | null;
    avatarBySuid: Map<string, any>;
    candidates: DirUser[];
    addQuery: string;
    setAddQuery: Setter<string>;
    addSel: string[];
    setAddSel: Setter<string[]>;
    directory: DirUser[];
    setInfoOpen: Setter<boolean>;
    setInfoView: Setter<InfoView>;
    setDialog: Setter<DialogKind>;
    setThemePickerOpen: Setter<boolean>;
    setMediaTab: Setter<MediaTab>;
    setMediaScope: Setter<"chat" | "all">;
    setChatThemeId: Setter<string>;
    setApplyThemeToAll: Setter<boolean>;
    onCloseChat: () => void;
    onNewMessageOpen: () => void;
    onMessagesScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    onLoadEarlier: () => void;
    onStar: (id: string) => void;
    onOpenMedia: (id: string, list?: MediaItem[]) => void;
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
    openDirectChat: (peerId: string) => void;
    openGroupChat: (groupId: number) => void;
    onJumpToMessage: (id: string) => void;
    onLightboxClose: () => void;
    onLightboxGo: (d: number) => void;
    msg: MessageActions;
};

export function ChatArea(p: ChatAreaProps) {
    const { dark, convKey, activeGroup, activePeer, msg, me, shared, meta, now } = p;

    /* ---------------- empty state ---------------- */
    if (!convKey) {
        return (
            <div className={`hidden md:flex flex-1 min-w-0 flex-col items-center justify-center gap-3 px-6 text-center ${dark ? "bg-[#0A0E14]" : "bg-[#FAFAFA]"}`}>
                <span className={`flex h-24 w-24 items-center justify-center rounded-full border-2 ${dark ? "border-slate-200 text-slate-100" : "border-slate-900 text-slate-900"}`}>
                    <IoPaperPlaneOutline className="text-5xl" />
                </span>
                <h2 className={`mt-2 text-xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>Your messages</h2>
                <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>
                    {p.isStudent ? "Open one of your groups to start chatting." : "Send a message to start a chat."}
                </p>
                {!p.isStudent && (
                    <button
                        onClick={p.onNewMessageOpen}
                        className={`mt-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all active:scale-95 ${
                            dark ? "bg-blue-600 hover:bg-blue-500 shadow-blue-900/40" : "bg-red-600 hover:bg-red-700 shadow-red-600/25"
                        }`}
                    >
                        Send message
                    </button>
                )}
            </div>
        );
    }

    /* ---------------- derived values ---------------- */
    const isGroup = !!activeGroup;
    const title = p.chatTitle;
    const members = isGroup ? p.activeMembers : [];
    const peerGroups = activePeer ? p.groupsOfUser(activePeer.suid) : [];
    const subtitle = isGroup
        ? members.map((m) => m.name).join(", ")
        : [activePeer?.role_code, peerGroups.map((g) => g.group_name).join(", ")].filter(Boolean).join(" · ") || "Direct message";

    const preference =
        p.themeConversationKey === convKey ? { id: p.chatThemeId, applyToAll: p.applyThemeToAll } : resolveStoredChatTheme(convKey);
    const ct = getChatTheme(preference.id);
    const cv: any = dark ? ct.dark : ct.light;

    const surface = dark ? "bg-[#0E1626]" : "bg-white";
    const subText = dark ? "text-slate-400" : "text-slate-500";
    const mutedNow = meta.mutedUntil === -1 || meta.mutedUntil > now;
    const isAdminMember = (m: any) => isSuperRole(m.role_code, m.name) || shared.admins.includes(String(m.suid));

    const ctx: InfoCtx = {
        dark, cv, surface, subText, isGroup, title,
        activeGroup, activePeer, peerGroups, members,
        adminMembers: members.filter(isAdminMember), isAdminMember,
        me, directory: p.directory, now, shared, meta,
        meAdmin: p.meAdmin, mutedNow,
        canEditSettings: p.canEditSettings, canAdd: p.canAdd, canInvite: p.canInvite,
        mediaTab: p.mediaTab, mediaScope: p.mediaScope, mediaTotal: p.mediaTotal, buckets: p.buckets,
        starredMessages: p.starredMessages,
        candidates: p.candidates, addQuery: p.addQuery, addSel: p.addSel,
        setInfoView: p.setInfoView, setDialog: p.setDialog, setThemePickerOpen: p.setThemePickerOpen,
        setMediaTab: p.setMediaTab, setMediaScope: p.setMediaScope, setAddQuery: p.setAddQuery, setAddSel: p.setAddSel,
        onStar: p.onStar, onOpenMedia: p.onOpenMedia, onDownload: p.onDownload,
        onTogglePrivacy: p.onTogglePrivacy, onExportChat: p.onExportChat,
        onSetPermission: p.onSetPermission, onToggleAdmin: p.onToggleAdmin,
        onConfirmAddMembers: p.onConfirmAddMembers, onAcceptRequest: p.onAcceptRequest, onRejectRequest: p.onRejectRequest,
        copyInviteLink: p.copyInviteLink, openDirectChat: p.openDirectChat, openGroupChat: p.openGroupChat,
        onJumpToMessage: p.onJumpToMessage,
    };

    return (
        <div className="flex flex-1 min-w-0 min-h-0">
            <style>{`
                @keyframes gkInfoIn { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes gkDialogIn { from { opacity: 0; transform: translateY(8px) scale(.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
                @keyframes gkAvatarRing { 0% { box-shadow: 0 0 0 0 ${cv.accent}66; } 100% { box-shadow: 0 0 0 12px ${cv.accent}00; } }
                .gk-hd-avatar { border-radius: 9999px; transition: transform .35s cubic-bezier(.34, 1.56, .64, 1); }
                .gk-hd-btn:hover .gk-hd-avatar, .gk-hd-btn:focus-visible .gk-hd-avatar { transform: scale(1.12) rotate(-6deg); animation: gkAvatarRing 1.1s ease-out infinite; }
                .gk-hd-btn:active .gk-hd-avatar { transform: scale(.96); }
                .chat-themed-input:focus { border-color: ${cv.accent}; box-shadow: 0 0 0 2px ${cv.accent}33; }
                .chat-sidebar-row:not(:disabled):hover { background-color: ${cv.accent}12; }
                @media (prefers-reduced-motion: reduce) {
                    .gk-hd-btn:hover .gk-hd-avatar, .gk-hd-btn:focus-visible .gk-hd-avatar { animation: none; transform: none; }
                }
            `}</style>

            {/* The chat column. relative + h-full + flex-col + min-h-0 keeps the layout and lets overlays use absolute inset-0 */}
            <section className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-clip">
                <div className="h-0.5 shrink-0" style={{ backgroundImage: `linear-gradient(to right, transparent, ${cv.accent}, transparent)` }} />

                <ChatHeader
                    dark={dark}
                    cv={cv}
                    isGroup={isGroup}
                    title={title}
                    subtitle={subtitle}
                    typingLabel={p.typingLabel}
                    avatar={activePeer?.avatar}
                    superBadge={activePeer?.isSuper}
                    onBack={p.onCloseChat}
                    onOpenInfo={() => {
                        p.setInfoView("main");
                        p.setInfoOpen(true);
                    }}
                />

                <PinnedBanner dark={dark} cv={cv} actions={msg} meSuid={me.suid} canSend={p.canSend} onJump={p.onJumpToMessage} />

                <ChatMessagesArea
                    dark={dark}
                    cv={cv}
                    shared={shared}
                    title={title}
                    messagesCount={p.messages.length}
                    rows={p.rows}
                    starredSet={p.starredSet}
                    pinnedSet={msg.pinnedSet}
                    highlightId={p.highlightId}
                    hasEarlier={p.hasEarlier}
                    typingEntries={p.typingEntries}
                    isGroup={isGroup}
                    meSuid={me.suid}
                    tickFor={msg.tickFor}
                    messagesRef={p.messagesRef}
                    onScroll={p.onMessagesScroll}
                    onLoadEarlier={p.onLoadEarlier}
                    onMenu={msg.openMenu}
                    closeMenu={msg.closeMenu}
                    onReact={msg.toggleReaction}
                    onJump={p.onJumpToMessage}
                    onOpenMedia={(id) => p.onOpenMedia(id)}
                    onDownload={p.onDownload}
                />

                <footer
                    className={`shrink-0 border-t px-3 py-3 md:px-5 ${dark ? "border-slate-700/80 bg-[#0E1626]" : "border-slate-200 bg-white"}`}
                    style={{ backgroundImage: `linear-gradient(${cv.headerTint}, ${cv.headerTint})` }}
                >
                    {p.canSend ? (
                        <Composer
                            key={convKey}
                            dark={dark}
                            cv={cv}
                            meName={me.name}
                            meSuid={me.suid}
                            reply={msg.replyTarget}
                            onCancelReply={() => msg.setReplyTarget(null)}
                            onSend={p.onSend}
                            onTyping={p.onComposerInput}
                            onTypingStop={p.onComposerStop}
                        />
                    ) : (
                        <div className={`flex items-center justify-center gap-2 py-3 text-xs font-medium ${subText}`}>
                            <IoLockClosedOutline className="text-base" />
                            {p.adminBlocked ? "Only admins can send messages" : "You are not a member of this group"}
                        </div>
                    )}
                </footer>

                {/* Group / Contact info overlay */}
                {p.infoOpen && <ChatInfoDrawer c={ctx} infoView={p.infoView} onClose={() => p.setInfoOpen(false)} />}

                {/* Message info (from the message menu) */}
                <MessageInfoPanel
                    dark={dark}
                    cv={cv}
                    actions={msg}
                    messages={p.messages}
                    me={me}
                    isGroup={isGroup}
                    members={members}
                    activePeer={activePeer}
                    directory={p.directory}
                />

                <ChatDialogs
                    dark={dark}
                    cv={cv}
                    dialog={p.dialog}
                    setDialog={p.setDialog}
                    isGroup={isGroup}
                    title={title}
                    meta={meta}
                    shared={shared}
                    mutedNow={mutedNow}
                    onApplyMute={p.onApplyMute}
                    onApplyTtl={p.onApplyTtl}
                    onClearChat={p.onClearChat}
                    onDeleteChat={p.onDeleteChat}
                />

                <MessageDialogs dark={dark} cv={cv} actions={msg} me={me} isGroup={isGroup} meAdmin={p.meAdmin} />

                <MessageMenuHost
                    dark={dark}
                    cv={cv}
                    actions={msg}
                    messages={p.messages}
                    starredSet={p.starredSet}
                    canSend={p.canSend}
                    meSuid={me.suid}
                    onStar={p.onStar}
                />

                <MediaLightbox
                    lightbox={p.lightbox}
                    mediaScope={p.mediaScope}
                    meSuid={me.suid}
                    onClose={p.onLightboxClose}
                    onGo={p.onLightboxGo}
                    onDownload={p.onDownload}
                />

                {/* Rendered last so it always opens on top of the info panel */}
                <ChatThemePicker
                    open={p.themePickerOpen && p.themeConversationKey === convKey}
                    dark={dark}
                    selectedId={preference.id}
                    applyToAll={preference.applyToAll}
                    onSelect={(id: string) => {
                        p.setChatThemeId(id);
                        p.onPersistChatTheme(id, preference.applyToAll);
                    }}
                    onApplyToAllChange={(applyToAll: boolean) => {
                        p.setApplyThemeToAll(applyToAll);
                        p.onPersistChatTheme(preference.id, applyToAll);
                    }}
                    onReset={() => {
                        p.setChatThemeId(DEFAULT_CHAT_THEME_ID);
                        p.onPersistChatTheme(DEFAULT_CHAT_THEME_ID, preference.applyToAll);
                    }}
                    onClose={() => p.setThemePickerOpen(false)}
                />
            </section>
        </div>
    );
}

export default ChatArea;
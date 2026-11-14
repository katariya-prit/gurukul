/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GroupData } from "../../../../../services/groupService";
import type {
    ChatMessage, ChatUser, ConvMeta, DialogKind, DirUser, InfoView, MediaBuckets, MediaItem, MediaTab, SharedSettings,
} from "../../types";

type Setter<T> = React.Dispatch<React.SetStateAction<T>>;

/** Everything the info screens need. Built once in ChatArea. */
export type InfoCtx = {
    dark: boolean;
    cv: any;
    surface: string;
    subText: string;
    isGroup: boolean;
    title: string;
    activeGroup: GroupData | null;
    activePeer: DirUser | null;
    peerGroups: GroupData[];
    members: any[];
    adminMembers: any[];
    isAdminMember: (m: any) => boolean;
    me: ChatUser;
    directory: DirUser[];
    now: number;
    shared: SharedSettings;
    meta: ConvMeta;
    meAdmin: boolean;
    mutedNow: boolean;
    canEditSettings: boolean;
    canAdd: boolean;
    canInvite: boolean;
    mediaTab: MediaTab;
    mediaScope: "chat" | "all";
    mediaTotal: number;
    buckets: MediaBuckets;
    starredMessages: ChatMessage[];
    candidates: DirUser[];
    addQuery: string;
    addSel: string[];
    setInfoView: Setter<InfoView>;
    setDialog: Setter<DialogKind>;
    setThemePickerOpen: Setter<boolean>;
    setMediaTab: Setter<MediaTab>;
    setMediaScope: Setter<"chat" | "all">;
    setAddQuery: Setter<string>;
    setAddSel: Setter<string[]>;
    onStar: (id: string) => void;
    onOpenMedia: (id: string, list?: MediaItem[]) => void;
    onDownload: (m: ChatMessage) => void;
    onTogglePrivacy: () => void;
    onExportChat: () => void;
    onSetPermission: (patch: Partial<SharedSettings>) => void;
    onToggleAdmin: (suid: string) => void;
    onConfirmAddMembers: () => void;
    onAcceptRequest: (suid: string) => void;
    onRejectRequest: (suid: string) => void;
    copyInviteLink: () => void;
    openDirectChat: (peerId: string) => void;
    openGroupChat: (groupId: number) => void;
    onJumpToMessage: (id: string) => void;
};
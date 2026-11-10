import {
    IoCreateOutline,
    IoSearchOutline,
    IoClose,
    IoNotificationsOffOutline,
} from "react-icons/io5";
import { LogoTile } from "../ui/LogoTile";
import { GroupAvatar } from "../ui/GroupAvatar";
import { PersonAvatar } from "../ui/PersonAvatar";
import { formatListTime } from "../utils/formatters";
import { HIDE_SCROLL } from "../constants";
import type { ConvItem, ChatUser, DirUser, FilterTab } from "../types";
import type { GroupData } from "../../../../services/groupService";

export type ConversationListProps = {
    dark: boolean;
    convKey: string | null;
    me: ChatUser;
    isStudent?: boolean;
    directory: DirUser[];
    groups: GroupData[];
    visibleConversations: ConvItem[];
    suggestedPeople: DirUser[];
    unreadChats: number;
    filter: FilterTab;
    setFilter: (tab: FilterTab) => void;
    search: string;
    setSearch: (q: string) => void;
    loading: boolean;
    onOpenGroup: (groupId: number) => void;
    onOpenDirect: (peerId: string) => void;
    onOpenNewMessage: () => void;
};

export function ConversationList({
    dark,
    convKey,
    me,
    isStudent = false,
    directory,
    groups,
    visibleConversations,
    suggestedPeople,
    unreadChats,
    filter,
    setFilter,
    search,
    setSearch,
    loading,
    onOpenGroup,
    onOpenDirect,
    onOpenNewMessage,
}: ConversationListProps) {
    const q = search.trim().toLowerCase();

    const conversationsToDisplay = isStudent
        ? visibleConversations.filter((c) => c.kind === "group")
        : visibleConversations;
    const peopleToDisplay = isStudent ? [] : suggestedPeople;

    const chip = (id: FilterTab, label: string, count?: number) => {
        const on = filter === id;
        return (
            <button
                key={id}
                onClick={() => setFilter(id)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors
                ${on
                        ? dark ? "border-blue-500/40 bg-blue-600/20 text-blue-300" : "border-red-200 bg-red-50 text-red-700"
                        : dark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
            >
                {label}
                {count !== undefined && count > 0 && <span className="ml-1.5 opacity-80">{count}</span>}
            </button>
        );
    };

    const renderRow = (c: ConvItem) => {
        const active = c.key === convKey;
        const hasUnread = c.unread > 0;
        return (
            <button
                key={c.key}
                onClick={() => (c.kind === "group" ? onOpenGroup(Number(c.id)) : onOpenDirect(c.id))}
                className={`w-full flex items-center gap-3.5 px-4 py-3 text-left transition-colors duration-150
                ${active
                        ? dark ? "bg-slate-800/90" : "bg-red-50"
                        : dark ? "hover:bg-slate-800/50" : "hover:bg-slate-50"
                    }`}
            >
                {c.kind === "group" ? (
                    <GroupAvatar dark={dark} name={c.title} size={52} />
                ) : (
                    <PersonAvatar dark={dark} name={c.title} avatar={c.avatar} size={52} superBadge={c.isSuper} online />
                )}
                <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                        <span className={`truncate text-sm ${hasUnread ? "font-bold" : "font-semibold"} ${dark ? "text-slate-100" : "text-slate-900"}`}>
                            {c.title}
                        </span>
                        {c.lastTime > 0 && (
                            <span
                                className={`shrink-0 text-[11px] font-medium ${
                                    hasUnread && !c.muted ? (dark ? "text-blue-400" : "text-red-600") : dark ? "text-slate-500" : "text-slate-400"
                                }`}
                            >
                                {formatListTime(c.lastTime)}
                            </span>
                        )}
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                        <span
                            className={`truncate text-xs ${
                                hasUnread
                                    ? dark ? "font-semibold text-slate-200" : "font-semibold text-slate-800"
                                    : dark ? "text-slate-400" : "text-slate-500"
                            }`}
                        >
                            {c.preview}
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5">
                            {c.muted && (
                                <IoNotificationsOffOutline
                                    aria-label="Muted"
                                    className={`text-sm ${dark ? "text-slate-500" : "text-slate-400"}`}
                                />
                            )}
                            {hasUnread && (
                                <span
                                    className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white
                                    ${c.muted ? (dark ? "bg-slate-600" : "bg-slate-400") : dark ? "bg-blue-600" : "bg-red-600"}`}
                                >
                                    {c.unread > 99 ? "99+" : c.unread}
                                </span>
                            )}
                        </span>
                    </span>
                </span>
            </button>
        );
    };

    return (
        <aside
            className={`${convKey ? "hidden md:flex" : "flex"} w-full md:w-88 lg:w-96 shrink-0 min-h-0 flex-col border-l
            ${dark ? "border-slate-700/80 bg-[#0B1120]" : "border-slate-200 bg-white"}`}
        >
            {/* Title row */}
            <div className="flex shrink-0 items-center gap-3 px-4 pt-5 pb-3">
                <LogoTile dark={dark} size={40} />
                <div className="min-w-0 flex-1">
                    <h1 className={`text-xl font-bold tracking-tight leading-tight ${dark ? "text-white" : "text-slate-900"}`}>
                        Gurukul Community
                    </h1>
                    <p className={`truncate text-[11px] font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>
                        {me.name} · {directory.length} members
                    </p>
                </div>
                {!isStudent && (
                    <button
                        onClick={onOpenNewMessage}
                        title="New message"
                        aria-label="New message"
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg transition-all active:scale-95
                        ${dark ? "bg-blue-600 hover:bg-blue-500 shadow-blue-900/40" : "bg-red-600 hover:bg-red-700 shadow-red-600/25"}`}
                    >
                        <IoCreateOutline className="text-xl" />
                    </button>
                )}
            </div>

            {/* Search (WhatsApp style) */}
            <div className="shrink-0 px-4 pb-3">
                <div
                    className={`flex items-center gap-2.5 rounded-full border px-4 py-2.5 transition-colors
                    ${dark ? "border-transparent bg-slate-800/80 focus-within:border-blue-500" : "border-transparent bg-slate-100 focus-within:border-red-400"}`}
                >
                    <IoSearchOutline className={`text-base ${dark ? "text-slate-400" : "text-slate-500"}`} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={isStudent ? "Search groups" : "Search or start a new chat"}
                        className={`w-full bg-transparent text-sm outline-none ${
                            dark ? "text-slate-100 placeholder:text-slate-500" : "text-slate-800 placeholder:text-slate-500"
                        }`}
                    />
                    {search && (
                        <button onClick={() => setSearch("")} aria-label="Clear search">
                            <IoClose className={dark ? "text-slate-400" : "text-slate-500"} />
                        </button>
                    )}
                </div>
            </div>

            {/* Filter chips: All / Unread / Groups */}
            {!isStudent && (
                <div className={`flex shrink-0 gap-2 overflow-x-auto px-4 pb-3 ${HIDE_SCROLL}`}>
                    {chip("all", "All")}
                    {chip("unread", "Unread", unreadChats)}
                    {chip("groups", "Groups", groups.length)}
                </div>
            )}

            {/* List */}
            <div className={`flex-1 min-h-0 overflow-y-auto pb-3 ${HIDE_SCROLL}`}>
                {loading ? (
                    <div className="space-y-1 px-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex animate-pulse items-center gap-3.5 py-3">
                                <div className={`h-13 w-13 rounded-full ${dark ? "bg-slate-800" : "bg-slate-200"}`} />
                                <div className="flex-1 space-y-2">
                                    <div className={`h-3.5 w-1/2 rounded ${dark ? "bg-slate-800" : "bg-slate-200"}`} />
                                    <div className={`h-3 w-3/4 rounded ${dark ? "bg-slate-800/70" : "bg-slate-100"}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {conversationsToDisplay.map(renderRow)}

                        {peopleToDisplay.length > 0 && (
                            <>
                                <p className={`px-4 pt-4 pb-1 text-[10px] font-bold uppercase tracking-[0.2em] ${dark ? "text-slate-500" : "text-slate-400"}`}>
                                    People
                                </p>
                                {peopleToDisplay.map((u) => (
                                    <button
                                        key={u.suid}
                                        onClick={() => onOpenDirect(u.suid)}
                                        className={`flex w-full items-center gap-3.5 px-4 py-3 text-left transition-colors ${
                                            dark ? "hover:bg-slate-800/50" : "hover:bg-slate-50"
                                        }`}
                                    >
                                        <PersonAvatar dark={dark} name={u.name} avatar={u.avatar} size={52} superBadge={u.isSuper} online />
                                        <span className="min-w-0 flex-1">
                                            <span className={`block truncate text-sm font-semibold ${dark ? "text-slate-100" : "text-slate-900"}`}>
                                                {u.name}
                                            </span>
                                            <span className={`block truncate text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                                                {u.role_code || "Tap to start conversation"}
                                            </span>
                                        </span>
                                    </button>
                                ))}
                            </>
                        )}

                        {conversationsToDisplay.length === 0 && peopleToDisplay.length === 0 && (
                            <div className="flex flex-col items-center px-6 py-14 text-center">
                                <p className={`text-sm font-semibold ${dark ? "text-slate-300" : "text-slate-700"}`}>
                                    {filter === "unread"
                                        ? "No unread chats"
                                        : filter === "groups" || isStudent
                                            ? "No groups assigned yet"
                                            : q
                                                ? "No chats found"
                                                : "No chats yet"}
                                </p>
                                <p className={`mt-1 text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>
                                    {isStudent
                                        ? "You will see your groups here once added by an admin."
                                        : filter === "all" && !q
                                            ? "Tap the compose button to message someone."
                                            : "Try a different filter or search."}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </aside>
    );
}

import { useState, useEffect } from "react";
import {
    IoClose,
    IoSearchOutline,
    IoChatbubbleEllipsesOutline,
    IoBackspaceOutline,
    IoKeypadOutline,
    IoPeopleOutline,
    IoPersonOutline,
} from "react-icons/io5";
import { toast } from "sonner";
import { PersonAvatar } from "../ui/PersonAvatar";
import { HIDE_SCROLL } from "../constants";
import { lookupUserBySuid } from "../utils/api";
import type { DirUser } from "../types";

export type NewChatModalProps = {
    open: boolean;
    dark: boolean;
    otherUsers: DirUser[];
    newSearch: string;
    setNewSearch: (q: string) => void;
    onClose: () => void;
    onSelectUser: (suid: string) => void;
};

export function NewChatModal({
    open,
    dark,
    otherUsers,
    newSearch,
    setNewSearch,
    onClose,
    onSelectUser,
}: NewChatModalProps) {
    const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== "undefined" && window.innerWidth < 768);
    const [activeTab, setActiveTab] = useState<"list" | "dialer">("list");
    const [dialedSuid, setDialedSuid] = useState<string>("");
    const [isLookingUp, setIsLookingUp] = useState<boolean>(false);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // When modal opens, default to dialer on mobile, list on desktop
    useEffect(() => {
        if (open) {
            setActiveTab(window.innerWidth < 768 ? "dialer" : "list");
            setDialedSuid("");
        }
    }, [open]);

    if (!open) return null;

    const nq = newSearch.trim().toLowerCase();
    const filteredUsers = otherUsers.filter(
        (u) =>
            !nq ||
            u.name.toLowerCase().includes(nq) ||
            u.suid.toLowerCase().includes(nq) ||
            (u.role_code || "").toLowerCase().includes(nq)
    );

    // Check if dialedSuid matches a known user
    const matchedUser = dialedSuid
        ? otherUsers.find((u) => String(u.suid) === dialedSuid) || null
        : null;

    const handleDigitClick = (digit: string) => {
        if (dialedSuid.length >= 12) return;
        setDialedSuid((prev) => prev + digit);
    };

    const handleBackspace = () => {
        setDialedSuid((prev) => prev.slice(0, -1));
    };

    const handleClear = () => {
        setDialedSuid("");
    };

    const handleDialChat = async (targetSuid?: string) => {
        const suidToUse = (targetSuid || dialedSuid || newSearch).trim();
        if (!suidToUse) {
            toast.error("Please enter a valid SUID number");
            return;
        }

        // If in known users, select directly
        const known = otherUsers.find((u) => String(u.suid) === suidToUse);
        if (known) {
            onSelectUser(known.suid);
            onClose();
            return;
        }

        // Otherwise lookup in backend
        try {
            setIsLookingUp(true);
            const user = await lookupUserBySuid(suidToUse);
            if (user) {
                toast.success(`Found user: ${user.name}`);
                onSelectUser(String(user.suid));
                onClose();
            } else {
                toast.error(`No user found with SUID: ${suidToUse}`);
            }
        } catch {
            toast.error("Lookup failed. Please verify the SUID.");
        } finally {
            setIsLookingUp(false);
        }
    };

    const keypadButtons = [
        { digit: "1", sub: "" },
        { digit: "2", sub: "ABC" },
        { digit: "3", sub: "DEF" },
        { digit: "4", sub: "GHI" },
        { digit: "5", sub: "JKL" },
        { digit: "6", sub: "MNO" },
        { digit: "7", sub: "PQRS" },
        { digit: "8", sub: "TUV" },
        { digit: "9", sub: "WXYZ" },
        { digit: "*", sub: "" },
        { digit: "0", sub: "+" },
        { digit: "#", sub: "" },
    ];

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-4">
            <div onClick={onClose} className={`absolute inset-0 backdrop-blur-xs ${dark ? "bg-black/75" : "bg-slate-900/40"}`} />

            <div
                className={`relative flex w-full max-w-md flex-col overflow-hidden rounded-3xl border shadow-2xl transition-all
                ${dark ? "border-slate-800 bg-[#0E1626] text-slate-100" : "border-slate-200 bg-white text-slate-900"}
                ${activeTab === "dialer" ? "max-h-[92vh]" : "h-[min(75vh,580px)]"}`}
            >
                {/* Header */}
                <div
                    className={`flex shrink-0 items-center justify-between border-b px-5 py-3.5 ${
                        dark ? "border-slate-800" : "border-slate-100"
                    }`}
                >
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-500/10">
                        <button
                            onClick={() => setActiveTab("list")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                activeTab === "list"
                                    ? dark
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "bg-red-600 text-white shadow-sm"
                                    : dark
                                        ? "text-slate-400 hover:text-slate-200"
                                        : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            <IoPeopleOutline className="text-sm" />
                            Users
                        </button>
                        <button
                            onClick={() => setActiveTab("dialer")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                activeTab === "dialer"
                                    ? dark
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "bg-red-600 text-white shadow-sm"
                                    : dark
                                        ? "text-slate-400 hover:text-slate-200"
                                        : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            <IoKeypadOutline className="text-sm" />
                            Dial SUID
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                            dark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
                        }`}
                    >
                        <IoClose className="text-xl" />
                    </button>
                </div>

                {/* TAB 1: USER LIST (Desktop / Contact Directory) */}
                {activeTab === "list" && (
                    <>
                        <div
                            className={`flex shrink-0 items-center gap-2.5 border-b px-4 py-2.5 ${
                                dark ? "border-slate-800" : "border-slate-100"
                            }`}
                        >
                            <IoSearchOutline className={dark ? "text-slate-400" : "text-slate-500"} />
                            <input
                                autoFocus={!isMobile}
                                value={newSearch}
                                onChange={(e) => setNewSearch(e.target.value)}
                                placeholder="Search by Name or SUID (e.g. 620001)..."
                                className={`w-full bg-transparent text-sm outline-none ${
                                    dark ? "placeholder:text-slate-500 text-white" : "placeholder:text-slate-400 text-slate-900"
                                }`}
                            />
                            {newSearch && (
                                <button
                                    onClick={() => setNewSearch("")}
                                    className="text-xs text-slate-400 hover:text-slate-200"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* Dial SUID action banner if user typed digits */}
                        {/^\d+$/.test(newSearch.trim()) && !otherUsers.some((u) => u.suid === newSearch.trim()) && (
                            <div className={`px-4 py-2.5 border-b flex items-center justify-between ${dark ? "bg-blue-950/30 border-blue-900/40" : "bg-red-50/50 border-red-100"}`}>
                                <div className="text-xs">
                                    <span className="font-semibold">Dial SUID: #{newSearch.trim()}</span>
                                    <p className={`text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>Directly start 1-to-1 chat</p>
                                </div>
                                <button
                                    onClick={() => handleDialChat(newSearch.trim())}
                                    disabled={isLookingUp}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm flex items-center gap-1.5 ${
                                        dark ? "bg-blue-600 hover:bg-blue-500" : "bg-red-600 hover:bg-red-700"
                                    }`}
                                >
                                    <IoChatbubbleEllipsesOutline />
                                    {isLookingUp ? "Dialing..." : "Start Chat"}
                                </button>
                            </div>
                        )}

                        <div className={`flex-1 min-h-0 overflow-y-auto py-1 ${HIDE_SCROLL}`}>
                            {filteredUsers.map((u) => (
                                <button
                                    key={u.suid}
                                    onClick={() => {
                                        onSelectUser(u.suid);
                                        onClose();
                                    }}
                                    className={`flex w-full items-center gap-3.5 px-4 py-3 text-left transition-colors ${
                                        dark ? "hover:bg-slate-800/60" : "hover:bg-slate-50"
                                    }`}
                                >
                                    <PersonAvatar dark={dark} name={u.name} avatar={u.avatar} size={44} superBadge={u.isSuper} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="truncate text-sm font-semibold">{u.name}</span>
                                            <span
                                                className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold ${
                                                    dark
                                                        ? "bg-blue-950/80 text-blue-300 border border-blue-800/60"
                                                        : "bg-red-50 text-red-700 border border-red-200"
                                                }`}
                                            >
                                                #{u.suid}
                                            </span>
                                        </div>
                                        {u.role_code && (
                                            <span className={`block truncate text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                                                {u.role_code}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                            {filteredUsers.length === 0 && (
                                <div className="py-12 text-center px-4">
                                    <IoPersonOutline className={`mx-auto text-4xl mb-2 ${dark ? "text-slate-600" : "text-slate-300"}`} />
                                    <p className={`text-xs font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>
                                        No members match "{newSearch}"
                                    </p>
                                    <button
                                        onClick={() => {
                                            setActiveTab("dialer");
                                            if (/^\d+$/.test(newSearch.trim())) {
                                                setDialedSuid(newSearch.trim());
                                            }
                                        }}
                                        className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold ${
                                            dark ? "text-blue-400 hover:text-blue-300" : "text-red-600 hover:text-red-700"
                                        }`}
                                    >
                                        <IoKeypadOutline /> Use Number Pad to Dial SUID
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* TAB 2: PHONE NUMERIC KEYPAD / DIAL PAD (Mobile Friendly, No Native Keyboard) */}
                {activeTab === "dialer" && (
                    <div className="flex flex-col p-4 sm:p-5 select-none">
                        {/* Dialed SUID Screen — readOnly so phone keyboard NEVER opens */}
                        <div
                            className={`relative flex flex-col items-center justify-center rounded-2xl border px-4 py-4 min-h-[78px] mb-3 transition-colors ${
                                dark
                                    ? "bg-slate-900/80 border-slate-800"
                                    : "bg-slate-50 border-slate-200"
                            }`}
                        >
                            <span className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>
                                SUID Dial Number
                            </span>
                            <div className="flex items-center justify-center gap-1 w-full overflow-x-auto no-scrollbar">
                                <span className={`font-mono text-2xl sm:text-3xl font-extrabold tracking-wider ${
                                    dialedSuid ? (dark ? "text-blue-400" : "text-red-600") : (dark ? "text-slate-600" : "text-slate-400")
                                }`}>
                                    {dialedSuid ? dialedSuid : "— — — — — —"}
                                </span>
                            </div>

                            {/* Matched Contact Preview if known */}
                            {matchedUser && (
                                <div className={`mt-2 flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                                    dark ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/60" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                }`}>
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span>{matchedUser.name}</span>
                                    {matchedUser.role_code && <span className="text-[10px] opacity-75">({matchedUser.role_code})</span>}
                                </div>
                            )}
                        </div>

                        {/* Custom Numeric Keypad Grid */}
                        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 max-w-[320px] mx-auto w-full my-auto">
                            {keypadButtons.map((btn) => (
                                <button
                                    key={btn.digit}
                                    type="button"
                                    onClick={() => handleDigitClick(btn.digit)}
                                    className={`flex flex-col items-center justify-center h-13 sm:h-14 rounded-2xl border font-bold transition-all active:scale-95 cursor-pointer shadow-xs ${
                                        dark
                                            ? "bg-slate-800/70 hover:bg-slate-800 border-slate-700/80 text-white"
                                            : "bg-white hover:bg-slate-100 border-slate-200 text-slate-800"
                                    }`}
                                >
                                    <span className="text-xl sm:text-2xl font-bold leading-none">{btn.digit}</span>
                                    {btn.sub && (
                                        <span className={`text-[9px] font-semibold tracking-widest mt-0.5 leading-none ${
                                            dark ? "text-slate-400" : "text-slate-400"
                                        }`}>
                                            {btn.sub}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Bottom Actions: Clear, Chat / Call Button, Backspace */}
                        <div className="flex items-center justify-between gap-3 max-w-[320px] mx-auto w-full mt-4 pt-2">
                            <button
                                type="button"
                                onClick={handleClear}
                                title="Clear"
                                className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xs font-bold transition-all active:scale-95 ${
                                    dark ? "bg-slate-800/80 hover:bg-slate-800 text-slate-400" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                                }`}
                            >
                                C
                            </button>

                            <button
                                type="button"
                                onClick={() => handleDialChat()}
                                disabled={!dialedSuid || isLookingUp}
                                className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                                    dark
                                        ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40"
                                        : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                                }`}
                            >
                                <IoChatbubbleEllipsesOutline className="text-xl" />
                                {isLookingUp ? "Dialing..." : "Start Chat"}
                            </button>

                            <button
                                type="button"
                                onClick={handleBackspace}
                                title="Backspace"
                                className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold transition-all active:scale-95 ${
                                    dark ? "bg-slate-800/80 hover:bg-slate-800 text-slate-400" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                                }`}
                            >
                                <IoBackspaceOutline />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

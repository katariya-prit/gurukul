import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, LogOut, Settings, User } from "lucide-react";
import { useTheme } from "../theme/ThemeContext";
import MorphPopover from "../overlay/MorphPopover";

export interface ProfileUser {
    suid: string;
    fullName: string;
    username: string;
    joinedDate: string;
    birthDate: string;
    roleLabel: string;
    avatarUrl?: string;
}

interface ProfilePopupProps {
    user?: ProfileUser;
    onLogout?: () => void;
    profilePath?: string;
    settingsPath?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const DEFAULT_USER: ProfileUser = {
    suid: "123098",
    fullName: "Super Admin Principal",
    username: "super-admin",
    joinedDate: "14 Jan 2024",
    birthDate: "08 Aug 1990",
    roleLabel: "SUPER_ADMIN",
};

const MenuButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    danger?: boolean;
    theme: boolean;
}> = ({ icon, label, onClick, danger, theme }) => (
    <button
        role="menuitem"
        onClick={onClick}
        className={`group relative flex w-full items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold tracking-wide transition-all duration-300 overflow-hidden cursor-pointer ${danger
                ? theme
                    ? "hover:bg-blue-500/10 text-blue-400"
                    : "hover:bg-red-50 text-red-600"
                : theme
                    ? "text-gray-200 hover:bg-gray-800/60"
                    : "text-neutral-700 hover:bg-neutral-50"
            }`}
    >
        <div
            className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${danger ? (theme ? "bg-blue-500/10" : "bg-red-100") : theme ? "bg-gray-700/50" : "bg-neutral-100"
                }`}
        />

        <span
            className={`relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 shadow-sm z-10 ${danger
                    ? theme
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-red-100 text-red-600"
                    : theme
                        ? "bg-gray-800 text-gray-300 border border-gray-700 group-hover:border-gray-600 group-hover:text-blue-400"
                        : "bg-white text-neutral-600 border border-neutral-200 group-hover:border-neutral-300 group-hover:text-red-600"
                }`}
        >
            {icon}
        </span>

        <span className="relative uppercase z-10">{label}</span>

        {!danger && (
            <ChevronRight
                size={16}
                className={`relative z-10 ml-auto transition-transform duration-300 group-hover:translate-x-1 ${theme ? "text-gray-500 group-hover:text-blue-400" : "text-neutral-400 group-hover:text-red-500"
                    }`}
            />
        )}
    </button>
);

const Avatar: React.FC<{ user: ProfileUser; initial: string; size?: number; theme: boolean }> = ({
    user,
    initial,
    size = 20,
    theme,
}) => (
    <div
        className={`relative flex items-center justify-center overflow-hidden rounded-full font-bold shadow-2xl transition-all duration-300 hover:scale-105 ${theme
                ? "bg-gray-800 text-blue-400 ring-[5px] ring-gray-900 shadow-black/80"
                : "bg-neutral-100 text-red-700 ring-[5px] ring-white shadow-red-900/10"
            }`}
        style={{
            height: size * 4,
            width: size * 4,
            fontSize: size * 1.1,
        }}
    >
        {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
        ) : (
            initial
        )}
        <div className="absolute inset-0 rounded-full shadow-[inset_0_0_15px_rgba(255,255,255,0.15)] pointer-events-none" />
    </div>
);

const ProfilePopup: React.FC<ProfilePopupProps> = ({
    user = DEFAULT_USER,
    onLogout,
    profilePath = "/dashboard/profile",
    settingsPath = "/dashboard/settings/profile",
    open,
    onOpenChange,
}) => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [internalOpen, setInternalOpen] = useState(false);

    const isOpen = open ?? internalOpen;

    const setOpen = useCallback(
        (value: boolean) => {
            if (open === undefined) setInternalOpen(value);
            onOpenChange?.(value);
        },
        [open, onOpenChange]
    );

    const handleProfileClick = () => {
        setOpen(false);
        navigate(profilePath);
    };

    const handleSettingsClick = () => {
        setOpen(false);
        navigate(settingsPath);
    };

    const handleLogoutClick = () => {
        setOpen(false);
        if (onLogout) {
            onLogout();
        } else {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/login");
        }
    };

    const initial = user.fullName?.charAt(0)?.toUpperCase() || "U";

    return (
        <div className="relative inline-block">
            <style>{`
        @keyframes premiumIndicator {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(16, 185, 129, 0.5)); transform: scale(1); }
          50% { filter: drop-shadow(0 0 12px rgba(16, 185, 129, 0.9)); transform: scale(1.05); }
        }
        @keyframes meshMove {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-4% , 5%) scale(1.08); }
        }
        @keyframes waveSway {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-20px); }
        }
        @keyframes waveSwayReverse {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(15px); }
        }
        .animate-waveSway-1 { animation: waveSway 12s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        .animate-waveSway-2 { animation: waveSwayReverse 16s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
      `}</style>

            <MorphPopover
                id="profile"
                isOpen={isOpen}
                onOpenChange={setOpen}
                ariaLabel="Profile menu"
                closedRadius={24}
                openRadius={32}
                align="right"
                triggerContentClassName="flex items-center gap-2 sm:gap-3"
                triggerClassName={`group py-1.5 pl-1.5 pr-3 sm:pr-5 cursor-pointer border transition-colors duration-300 ${theme
                        ? "bg-gray-800/80 hover:bg-gray-700 border-gray-700 hover:border-gray-600"
                        : "bg-white hover:bg-neutral-50 border-neutral-200 shadow-sm hover:shadow-md"
                    }`}
                panelClassName={`w-[calc(100vw-2rem)] max-w-[24rem] sm:w-96 border backdrop-blur-xl ${theme
                        ? "bg-gray-900/95 border-gray-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]"
                        : "bg-white/95 border-neutral-200 shadow-[0_25px_60px_-15px_rgba(153,27,27,0.18)]"
                    }`}
                renderTrigger={() => (
                    <>
                        <span
                            className={`relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center overflow-hidden rounded-full font-bold ring-2 ring-transparent transition-all duration-300 group-hover:ring-gray-300/50 ${theme ? "bg-gray-700 text-gray-200" : "bg-neutral-100 text-neutral-700"
                                }`}
                        >
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                            ) : (
                                initial
                            )}
                            <span
                                className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-white/80 bg-emerald-500"
                                style={{ animation: "premiumIndicator 3s infinite" }}
                            />
                        </span>
                        <span className="hidden flex-col items-start leading-tight sm:flex">
                            <span className={`text-[14px] sm:text-[15px] font-bold tracking-wide ${theme ? "text-gray-100" : "text-neutral-800"}`}>
                                {user.fullName}
                            </span>
                            <span className={`text-[9px] sm:text-[10px] font-bold tracking-widest uppercase ${theme ? "text-gray-400" : "text-neutral-500"}`}>
                                {user.roleLabel}
                            </span>
                        </span>
                    </>
                )}
            >
                <div role="menu">
                    <div className={`relative overflow-hidden px-6 sm:px-8 pb-16 sm:pb-20 pt-8 sm:pt-10 ${theme ? "bg-linear-to-br from-blue-950 via-gray-900 to-slate-950" : "bg-linear-to-br from-red-700 via-red-800 to-neutral-950"}`}>
                        <div
                            className="pointer-events-none absolute -right-6 -top-6 h-48 w-48 rounded-full bg-white/10 blur-3xl mix-blend-overlay"
                            style={{ animation: "meshMove 9s ease-in-out infinite alternate" }}
                        />
                        <div
                            className={`pointer-events-none absolute -bottom-10 -left-6 h-40 w-40 rounded-full blur-3xl mix-blend-overlay ${theme ? "bg-blue-500/20" : "bg-red-400/20"}`}
                            style={{ animation: "meshMove 11s ease-in-out infinite alternate-reverse" }}
                        />

                        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-0 z-0">
                            <svg
                                viewBox="0 0 1440 160"
                                preserveAspectRatio="none"
                                className={`relative block h-12 sm:h-16 w-[115%] left-[-7%] ${theme ? "text-gray-900/95" : "text-white/95"}`}
                                style={{ fill: "currentColor" }}
                            >
                                <defs>
                                    <linearGradient id="luxuryGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor={theme ? "#3b82f6" : "#ef4444"} stopOpacity="0" />
                                        <stop offset="30%" stopColor={theme ? "#60a5fa" : "#fca5a5"} stopOpacity="0.8" />
                                        <stop offset="70%" stopColor={theme ? "#22d3ee" : "#f87171"} stopOpacity="0.8" />
                                        <stop offset="100%" stopColor={theme ? "#3b82f6" : "#ef4444"} stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <path
                                    d="M0,96 C240,32 480,160 720,96 C960,32 1200,128 1440,64 L1440,160 L0,160 Z"
                                    className="opacity-25 animate-waveSway-1"
                                />
                                <path
                                    d="M0,64 C360,128 540,16 900,112 C1080,64 1260,128 1440,80 L1440,160 L0,160 Z"
                                    className="opacity-40 animate-waveSway-2"
                                />
                                <path
                                    d="M0,80 C280,135 560,35 840,115 C1120,45 1280,105 1440,75"
                                    fill="none"
                                    stroke="url(#luxuryGlow)"
                                    strokeWidth="3"
                                    className="opacity-70 animate-waveSway-1"
                                />
                                <path d="M0,80 C280,135 560,35 840,115 C1120,45 1280,105 1440,75 L1440,160 L0,160 Z" />
                            </svg>
                        </div>
                    </div>

                    <div className="-mt-10 flex flex-col items-center px-5 sm:px-8 pb-6 sm:pb-8 text-center relative z-10">
                        <Avatar user={user} initial={initial} size={18} theme={theme} />
                        <h3 className={`mt-3 text-lg sm:text-xl font-black tracking-tight ${theme ? "text-white" : "text-neutral-900"}`}>
                            {user.fullName}
                        </h3>

                        <div className="mt-1.5 flex items-center gap-2">
                            <span className={`inline-flex items-center justify-center rounded-full px-3.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${theme ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_2px_10px_rgba(59,130,246,0.1)]" : "bg-red-50 text-red-700 border border-red-100 shadow-[0_2px_10px_rgba(239,68,68,0.06)]"
                                }`}
                            >
                                {user.roleLabel}
                            </span>
                        </div>

                        <p className={`mt-1.5 text-[11px] sm:text-xs font-semibold ${theme ? "text-gray-400" : "text-neutral-500"}`}>
                            Member since {user.joinedDate}
                        </p>

                        <div className={`mt-5 w-full border-t ${theme ? "border-gray-800" : "border-neutral-100"}`} />

                        <div className="mt-4 flex w-full flex-col gap-1.5 sm:gap-2">
                            <MenuButton icon={<User size={16} strokeWidth={2.5} />} label="My Profile" onClick={handleProfileClick} theme={theme} />
                            <MenuButton icon={<Settings size={16} strokeWidth={2.5} />} label="Account Settings" onClick={handleSettingsClick} theme={theme} />

                            <div className={`my-1 w-full border-t border-dashed ${theme ? "border-gray-800" : "border-neutral-200"}`} />

                            <MenuButton icon={<LogOut size={16} strokeWidth={2.5} />} label="Sign Out" onClick={handleLogoutClick} danger theme={theme} />
                        </div>
                    </div>
                </div>
            </MorphPopover>
        </div>
    );
};

export default ProfilePopup;
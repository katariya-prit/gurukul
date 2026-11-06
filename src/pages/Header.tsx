import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineMenuAlt2, HiOutlineBell } from "react-icons/hi";
import { useTheme } from "../components/theme/ThemeContext";
import ThemeToggle from "../components/theme/ThemeToggle";
import EventCalendarContent from "../components/Event-Calendar/Event-Calendar";
import MorphPopover from "../components/overlay/MorphPopover";
import { eventsData } from "../components/Event-Calendar/event-constants";
import ProfilePopup, { type ProfileUser } from "../components/Profile-Popup/Profile-Popup";
import { CgAlbum } from "react-icons/cg";
import Application from "../components/applocation/Application";
import type { AuthUser } from "../Types/Role-create";
import { useSidebarView } from "../context/SidebarViewContext";
import { useNotifications } from "../context/NotificationContext";
import NotificationCenter from "../components/notifications/NotificationCenter";

interface HeaderProps {
    toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
    const { theme } = useTheme();
    const {
        isCenterOpen,
        setBellAnchor,
        openCenter,
        closeCenter,
        unreadCount,
    } = useNotifications();
    const navigate = useNavigate();
    const { activeDepartmentName, setActiveDepartment } = useSidebarView();
    const [user] = useState<AuthUser | null>(() => {
        const data = localStorage.getItem("user");
        if (!data) {
            return null;
        }

        try {
            const parsed: unknown = JSON.parse(data);
            return typeof parsed === "object" && parsed !== null ? (parsed as AuthUser) : null;
        } catch (error: unknown) {
            console.error("Error parsing user data:", error);
            return null;
        }
    });
    const [applicationData, setApplicationData] = useState(false);
    const [isEventCalendarOpen, setIsEventCalendarOpen] = useState<boolean>(false);
    const applicationTriggerRef = useRef<HTMLButtonElement>(null);
    const profileUser: ProfileUser = {
        suid: user?.id ? String(user.id) : "-",
        fullName: user?.username ?? "Admin",
        username: user?.username ?? "-",
        joinedDate: "-",
        birthDate: "-",
        roleLabel: user?.roleName ?? user?.roleCode ?? "USER",
    };
    const userDepartmentName = user?.departmentName ?? user?.department_name ?? null;
    const headerTitle = activeDepartmentName || (user && user.roleCode !== "SUPER_ADMIN" ? userDepartmentName || "GURUKUL" : "GURUKUL");
    const handleLogout = () => {
        setActiveDepartment(null, null);
        localStorage.removeItem("user");
        navigate("/login");
    };
    const currentDate = new Date();
    const dayNumber = currentDate.getDate().toString().padStart(2, '0');
    const monthShort = currentDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const yearStr = currentDate.getFullYear();
    const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dateStr = String(currentDate.getDate()).padStart(2, '0');
    const todayStr = `${yearStr}-${monthStr}-${dateStr}`;
    const todayEvent = eventsData ? eventsData[todayStr] : null;

    const calendarTriggerClass = `group relative flex h-9.5 cursor-pointer items-center justify-center border px-3.5 shadow-sm transition-colors duration-300 ${theme
        ? "bg-slate-800/90 border-slate-700/80 hover:border-slate-500 hover:bg-slate-800"
        : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white"
        }`;

    const calendarPanelClass = `border shadow-2xl backdrop-blur-md ${theme
        ? "bg-slate-900/90 border-white/10 text-slate-100"
        : "bg-white/95 border-slate-200 text-slate-800"
        }`;

    const notificationTriggerClass = `p-2.5 duration-300 cursor-pointer rounded-xl border-l transition-colors relative shadow-sm ${theme
        ? "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-blue-200"
        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-white hover:text-red-500"
        }`;

    const notificationPanelClass = ``;
    const notificationAriaLabel =
        unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
            : "Notifications";

    const handleCalendarOpenChange = (open: boolean) => {
        setIsEventCalendarOpen(open);
        if (open) {
            if (isCenterOpen) closeCenter();
            if (applicationData) setApplicationData(false);
        }
    };

    const handleNotificationOpenChange = (open: boolean) => {
        if (open) {
            openCenter();
            setIsEventCalendarOpen(false);
            if (applicationData) setApplicationData(false);
        } else {
            closeCenter();
        }
    };

    return (
        <header className={`h-18 border-b flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 shadow-sm transition-colors duration-300 ${theme ? "bg-[#0f172a]/95 backdrop-blur-xl border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
            }`}>
            <Application
                open={applicationData}
                onClose={() => setApplicationData(false)}
                triggerRef={applicationTriggerRef}
            />
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className={`p-2 rounded-lg md:hidden transition-colors cursor-pointer ${theme ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                >
                    <HiOutlineMenuAlt2 className="text-2xl" />
                </button>
                <h1 className={`text-lg sm:text-2xl font-black hidden sm:block tracking-wide ${theme ? "text-white" : "text-slate-800"
                    }`}>
                    {headerTitle}
                </h1>
            </div>
            <div className="flex items-center gap-3 sm:gap-5 h-full">
                <MorphPopover
                    id="calendar"
                    isOpen={isEventCalendarOpen}
                    onOpenChange={handleCalendarOpenChange}
                    ariaLabel="Event calendar"
                    triggerTitle="Calendar"
                    triggerClassName={calendarTriggerClass}
                    panelClassName={calendarPanelClass}
                    closedRadius={12}
                    openRadius={28}
                    panelWidth={400}
                    renderTrigger={() => (
                        <>
                            <span className={`text-[17px] font-black leading-none tracking-tight transition-colors ${theme ? "text-blue-500" : "text-red-500"
                                }`}>
                                {dayNumber}
                            </span>
                            <span className={`text-[12px] font-light mx-2 ${theme ? "text-slate-600 group-hover:text-slate-500" : "text-slate-300 group-hover:text-slate-400"
                                }`}>
                                |
                            </span>
                            <span className={`text-[11px] font-extrabold tracking-widest leading-none mt-0.5 ${theme ? "text-slate-300 group-hover:text-white" : "text-slate-600 group-hover:text-slate-900"
                                }`}>
                                {monthShort}
                            </span>
                            {todayEvent && (
                                <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 animate-pulse ${theme ? "border-slate-800" : "border-white"
                                    } ${todayEvent.category === 'event'
                                        ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.9)]"
                                        : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]"
                                    }`}></span>
                            )}
                        </>
                    )}
                >
                    <EventCalendarContent />
                </MorphPopover>
                <div className="relative flex items-center">
                    <button
                        ref={applicationTriggerRef}
                        onClick={() => {
                            setApplicationData(prev => !prev);
                            if (isEventCalendarOpen) setIsEventCalendarOpen(false);
                            if (isCenterOpen) closeCenter();
                        }}
                        className={`p-2.5 duration-300 cursor-pointer border-r rounded-xl transition-colors relative shadow-sm ${theme
                            ? "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-blue-200"
                            : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-white hover:text-red-500"
                            }`}
                        title="Application"
                    >
                        <CgAlbum className="text-[20px]" />
                    </button>
                    <div ref={setBellAnchor} className="relative flex items-center">
                        <MorphPopover
                            id="notifications"
                            isOpen={isCenterOpen}
                            onOpenChange={handleNotificationOpenChange}
                            ariaLabel={notificationAriaLabel}
                            triggerTitle="Notifications"
                            triggerClassName={notificationTriggerClass}
                            panelClassName={notificationPanelClass}
                            closedRadius={12}
                            openRadius={20}
                            panelWidth={360}
                            renderTrigger={() => (
                                <>
                                    <HiOutlineBell className="text-[20px]" />
                                    {unreadCount > 0 && (
                                        <span aria-hidden="true" className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-50" />
                                            <span className="relative inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-white bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
                                                {unreadCount > 99 ? "99+" : unreadCount}
                                            </span>
                                        </span>
                                    )}
                                </>
                            )}
                        >
                            <NotificationCenter />
                        </MorphPopover>
                    </div>
                </div>
                <ThemeToggle />
                <div className={`h-7 w-px hidden sm:block ${theme ? "bg-slate-700" : "bg-slate-200"}`} />
                <ProfilePopup
                    user={profileUser}
                    onLogout={handleLogout}
                    profilePath="/dashboard/profile"
                    settingsPath="/dashboard/settings/profile"
                />
            </div>
        </header>
    );
}
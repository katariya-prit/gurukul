import { useTheme } from "../components/theme/ThemeContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/gurukul.png";

import Navbar from "../components/sidebar/Navbar";
import {
    HiOutlineLogout,
    HiChevronLeft,
    HiChevronRight,
    HiOutlineExclamationCircle,
} from "react-icons/hi";

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const { theme } = useTheme(); // theme: true (Dark Mode), false (Light Mode)
    const navigate = useNavigate();

    const [isCollapsed, setIsCollapsed] = useState(false);
    const isMiniSidebar = isCollapsed && window.innerWidth >= 768;

    // 🌟 Logout confirmation modal state — have direct logout nathi thatu,
    // pehla confirm karavu pade chhe
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        setIsLoggingOut(true);

        // 🌟 Static data fix: "adminData" ni jagaye "user" key vaprai chhe
        // baki badha files (Dashboard.tsx, CreateUserForm.tsx) ma — etle
        // have proper cleanup thai chhe, koi stale key bachi nathi rahti
        localStorage.removeItem("user");
        localStorage.removeItem("adminData");

        // 🌟 Halko sa delay — UI ne "process thai rahyu chhe" jevu feedback
        // aapva mate, real API call hoy tyare aa j jagah par await thashe
        setTimeout(() => {
            navigate("/login");
        }, 400);
    };

    const cancelLogout = () => {
        setShowLogoutConfirm(false);
    };

    return (
        <>
            <aside
                onClick={(e) => e.stopPropagation()}
                className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-[width,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:translate-x-0 md:relative
                    ${isOpen ? "translate-x-0" : "-translate-x-full"} 
                    ${isMiniSidebar ? "w-22" : "w-65"} 
                    ${theme
                        ? "bg-gray-900 text-white border-r border-gray-800 shadow-[4px_0_24px_rgba(0,0,0,0.5)]"
                        : "bg-white text-gray-800 border-r border-gray-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
                    }`}
            >
                {/* --- હેડર વિભાગ --- */}
                <div className={`flex items-center justify-between h-19 px-4 mb-4 shrink-0 w-full border-b 
                    ${theme ? "border-gray-800" : "border-gray-200"}`}
                >
                    <div className="flex items-center justify-start overflow-hidden flex-1">
                        {!isMiniSidebar ? (
                            /* --- મોટું સાઇડબાર: લોગો + ટેક્સ્ટ --- */
                            <div className="flex items-center gap-3 py-2 animate-fadeIn">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center p-1.5 shadow-sm 
                                    ${theme ? "bg-blue-200" : "bg-linear-to-tr from-red-700 to-red-400"}`}
                                >
                                    <img
                                        src={Logo}
                                        alt="Gurukul Logo"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div>
                                    <h2 className={`font-extrabold leading-tight text-base tracking-wide 
                                        ${theme ? "text-white" : "text-gray-800"}`}
                                    >
                                        Gurukul
                                    </h2>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest block mt-0.5
                                        ${theme ? "text-blue-200" : "text-red-500"}`}
                                    >
                                        Admin
                                    </span>
                                </div>
                            </div>
                        ) : (
                            /* --- મિની સાઇડબાર: લોગો હોવર ઇફેક્ટ --- */
                            <div className="w-full flex justify-center py-2 animate-fadeIn">
                                <div
                                    onClick={() => setIsCollapsed(false)}
                                    className={`relative w-11 h-11 rounded-xl flex items-center justify-center p-1.5 shadow-sm transition-all duration-300 group cursor-pointer 
                                        ${theme
                                            ? "bg-blue-200 hover:bg-blue-300"
                                            : "bg-red-50 hover:bg-red-600"
                                        }`}
                                    title="Expand Sidebar"
                                >
                                    <img
                                        src={Logo}
                                        alt="Gurukul Logo"
                                        className="w-full h-full object-contain transition-opacity duration-300 group-hover:opacity-0"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <HiChevronRight className={`text-xl font-bold ${theme ? "text-gray-400" : "text-white"}`} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- કોલેપ્સ બટન --- */}
                    {!isMiniSidebar && (
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className={`hidden md:flex p-2 ml-2 rounded-xl border transition-all cursor-pointer shadow-sm active:scale-95 
                                ${theme
                                    ? "bg-gray-800 text-blue-200 border-gray-700 hover:bg-blue-200 hover:text-gray-900"
                                    : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-red-50 hover:text-red-600"
                                }`}
                        >
                            <HiChevronLeft size={18} />
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar p-3">
                    <nav className="space-y-1.5 relative">
                        <Navbar
                            setSidebarOpen={setIsOpen}
                            isMiniSidebar={isMiniSidebar}
                        />
                    </nav>
                </div>

                {/* --- લોગઆઉટ બટન વિભાગ --- */}
                <div className={`pt-4 mt-auto shrink-0 border-t 
                    ${theme ? "border-gray-800" : "border-gray-100"}`}
                >
                    <button
                        onClick={handleLogoutClick}
                        title={isMiniSidebar ? "Logout" : ""}
                        className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-semibold text-[15px] transition-all duration-200 group cursor-pointer 
                            ${isMiniSidebar ? "justify-center px-2" : ""} 
                            ${theme
                                ? "text-gray-300 hover:bg-gray-800 hover:text-blue-200"
                                : "text-gray-500 hover:bg-red-50 hover:text-red-600"
                            }`}
                    >
                        <HiOutlineLogout className={`text-xl transition-colors 
                            ${theme ? "text-gray-400 group-hover:text-blue-200" : "text-gray-400 group-hover:text-red-600"}`}
                        />
                        {!isMiniSidebar && "Logout"}
                    </button>
                </div>
            </aside>

            {/* --- મોબાઈલ ઓવરલે --- */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 md:hidden cursor-pointer"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* --- 🌟 લોગઆઉટ કન્ફર્મેશન મોડલ --- */}
            {showLogoutConfirm && (
                <div
                    className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={cancelLogout}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full max-w-sm rounded-3xl border p-6 shadow-2xl transition-all ${theme
                            ? "bg-gray-900 border-gray-800 text-white"
                            : "bg-white border-gray-100 text-gray-900"
                            }`}
                    >
                        <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${theme ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600"
                                }`}
                        >
                            <HiOutlineExclamationCircle className="text-2xl" />
                        </div>

                        <h3 className="text-lg font-bold">Log out of your account?</h3>
                        <p className={`text-sm mt-1.5 ${theme ? "text-gray-400" : "text-neutral-500"}`}>
                            You'll need to sign in again to access the Gurukul admin dashboard.
                        </p>

                        <div className="flex items-center gap-3 mt-6">
                            <button
                                onClick={cancelLogout}
                                disabled={isLoggingOut}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${theme
                                    ? "bg-gray-800 text-gray-200 hover:bg-gray-700"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmLogout}
                                disabled={isLoggingOut}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoggingOut ? (
                                    <>
                                        <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                        Logging out...
                                    </>
                                ) : (
                                    "Logout"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
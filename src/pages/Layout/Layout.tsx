import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../Sidebar";
import Header from "../Header";
import { useTheme } from "../../components/theme/ThemeContext";
import SkeletonLoader from "../../components/loader/Skeleton";
import { SidebarViewProvider } from "../../context/SidebarViewContext";
import { NotificationProvider } from "../../context/NotificationContext";
import NotificationToast from "../../components/notifications/NotificationToast";

export default function Layout() {
    const { theme } = useTheme();
    const location = useLocation();
    const isDashboard = location.pathname === "/dashboard";
    const [loadingPath, setLoadingPath] = useState(location.pathname);
    const isRouteLoading = loadingPath !== location.pathname;

    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setLoadingPath(location.pathname);
        }, 200);

        return () => window.clearTimeout(timer);
    }, [location.pathname]);

    const toggleSidebar = () => {
        setIsMobileSidebarOpen((prev) => !prev);
    };

    return (
        <NotificationProvider>
            <SidebarViewProvider>
                {/* Outer Frame matches Sidebar & Header base color so there is zero seam */}
                <div
                    className={`h-screen w-screen flex font-sans overflow-hidden transition-colors duration-500 ${theme ? "bg-[#0b1118] text-gray-50" : "bg-white text-gray-800"
                        }`}
                >
                    <Sidebar isOpen={isMobileSidebarOpen} setIsOpen={setIsMobileSidebarOpen} />

                    <div className="relative flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                        <Header toggleSidebar={toggleSidebar} />
                        <NotificationToast />

                        {/* Inset Rounded Main Canvas — fixes the sharp 90° top-left corner */}
                        <main
                            className={`relative flex-1 w-full overflow-y-auto no-scrollbar p-4 sm:p-6 lg:p-7 lg:rounded-tl-[32px] border-t border-l transition-all duration-500 ${theme
                                ? "bg-[#060a12] border-white/[0.08] shadow-[inset_0_4px_24px_rgba(0,0,0,0.5)]"
                                : "bg-[#f4f7fb] border-slate-200/80 shadow-[inset_0_2px_12px_rgba(15,23,42,0.03)]"
                                }`}
                        >
                            {/* Natural Blue & Pink Ambient Mesh Inside the Curved Canvas */}
                            <div
                                aria-hidden="true"
                                style={{
                                    background: theme
                                        ? `
                                            radial-gradient(ellipse 75% 65% at 18% 18%, rgba(56, 189, 248, 0.15) 0%, rgba(59, 130, 246, 0.07) 45%, transparent 80%),
                                            radial-gradient(ellipse 70% 65% at 85% 25%, rgba(236, 72, 153, 0.14) 0%, rgba(168, 85, 247, 0.06) 50%, transparent 80%),
                                            radial-gradient(ellipse 80% 60% at 50% 90%, rgba(99, 102, 241, 0.13) 0%, rgba(236, 72, 153, 0.05) 50%, transparent 85%)
                                          `
                                        : `
                                            radial-gradient(ellipse 75% 65% at 18% 18%, rgba(56, 189, 248, 0.16) 0%, rgba(147, 197, 253, 0.08) 45%, transparent 80%),
                                            radial-gradient(ellipse 70% 65% at 85% 25%, rgba(244, 114, 182, 0.15) 0%, rgba(251, 207, 232, 0.08) 50%, transparent 80%),
                                            radial-gradient(ellipse 80% 60% at 50% 90%, rgba(167, 139, 250, 0.12) 0%, rgba(186, 230, 253, 0.06) 50%, transparent 85%)
                                          `,
                                }}
                                className="pointer-events-none absolute inset-0 z-0 lg:rounded-tl-[32px]"
                            />

                            {/* Content Wrapper */}
                            <div
                                className={`relative z-10 w-full min-h-full transition-all duration-300 ${isDashboard
                                    ? "max-w-none"
                                    : `rounded-3xl border p-5 sm:p-6 backdrop-blur-2xl ${theme
                                        ? "bg-slate-900/40 text-gray-50 border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.08)]"
                                        : "bg-white/65 text-gray-800 border-white/90 shadow-[0_20px_60px_rgba(59,130,246,0.06),inset_0_1px_2px_rgba(255,255,255,0.95)]"
                                    }`
                                    }`}
                            >
                                {isRouteLoading ? (
                                    <div className="space-y-4">
                                        <SkeletonLoader variant="text" rows={3} />
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <SkeletonLoader variant="card" rows={1} />
                                            <SkeletonLoader variant="card" rows={1} />
                                        </div>
                                        <SkeletonLoader variant="table" rows={4} />
                                    </div>
                                ) : (
                                    <Outlet />
                                )}
                            </div>
                        </main>
                    </div>
                </div>
            </SidebarViewProvider>
        </NotificationProvider>
    );
}
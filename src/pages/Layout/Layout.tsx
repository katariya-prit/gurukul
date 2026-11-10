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
    const isCommunity = location.pathname.startsWith("/dashboard/community");
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
                    className={`h-screen w-screen flex font-sans overflow-hidden ${
                        theme ? "bg-[#0b1118] text-gray-50" : "bg-white text-gray-800"
                    }`}
                >
                    <Sidebar isOpen={isMobileSidebarOpen} setIsOpen={setIsMobileSidebarOpen} />

                    <div className="relative flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                        <Header toggleSidebar={toggleSidebar} />
                        <NotificationToast />

                        <main
                            className={`relative flex-1 w-full lg:rounded-tl-[32px] border-t border-l flex flex-col ${
                                isCommunity
                                    ? "overflow-hidden p-2 sm:p-3 lg:p-4"
                                    : "overflow-y-auto no-scrollbar p-4 sm:p-6 lg:p-7"
                            } ${
                                theme
                                    ? "bg-[#060a12] border-white/[0.08]"
                                    : "bg-[#f4f7fb] border-slate-200"
                            }`}
                        >
                            <div
                                className={`relative z-10 w-full flex-1 min-h-0 flex flex-col ${
                                    isCommunity
                                        ? "h-full max-w-none p-0 border-0 bg-transparent shadow-none"
                                        : isDashboard
                                            ? "max-w-none"
                                            : `rounded-2xl border p-4 sm:p-6 ${
                                                theme
                                                    ? "bg-[#0d1526] text-gray-50 border-white/[0.08]"
                                                    : "bg-white text-gray-800 border-slate-200 shadow-sm"
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
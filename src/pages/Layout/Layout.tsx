import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { HiOutlineArrowLeft } from "react-icons/hi";
import Sidebar from "../Sidebar";
import Header from "../Header";
import { useTheme } from "../../components/theme/ThemeContext";
import SkeletonLoader from "../../components/loader/Skeleton";
import { SidebarViewProvider } from "../../context/SidebarViewContext";
import { NotificationProvider } from "../../context/NotificationContext";
import NotificationCenter from "../../components/notifications/NotificationCenter";
import NotificationToast from "../../components/notifications/NotificationToast";

export default function Layout() {
    const { theme } = useTheme();
    const navigate = useNavigate();
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
            <div className={`h-screen w-screen flex font-sans overflow-hidden transition-colors duration-300 ${theme ? 'bg-[#0b1118] text-gray-50' : 'bg-[#f6f7f9] text-gray-800'
                }`}>

                <Sidebar isOpen={isMobileSidebarOpen} setIsOpen={setIsMobileSidebarOpen} />

                <div className={`relative flex-1 flex flex-col min-w-0 h-full overflow-hidden transition-colors duration-300 ${theme ? 'bg-[#0b1118] text-gray-50' : 'bg-[#f6f7f9] text-gray-800'
                    }`}>

                    <Header toggleSidebar={toggleSidebar} />
                    <NotificationToast />
                    <NotificationCenter />

                    <main className="flex-1 w-full overflow-y-auto p-3 no-scrollbar sm:p-5 lg:p-7">
                        <div className={`mx-auto w-full max-w-[1600px] min-h-full transition-colors duration-300 ${
                            isDashboard
                                ? ""
                                : `rounded-2xl border p-4 sm:p-6 ${theme
                                    ? "bg-gray-900 text-gray-50 border-gray-800"
                                    : "bg-white text-gray-800 border-gray-100"
                                }`
                        }`}>
                            {!isDashboard && (
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className={`inline-flex items-center gap-2 mb-5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${theme
                                            ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                        }`}
                                >
                                    <HiOutlineArrowLeft className="text-base" />
                                    Back
                                </button>
                            )}

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
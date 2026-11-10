import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../theme/ThemeContext";
import { useNotifications } from "../../context/NotificationContext";
import { motion, useReducedMotion } from "motion/react";

interface SubItem {
    name: string;
    path: string;
    icon?: React.ReactNode;
}

interface SidebarHoverMenuProps {
    title: string;
    items: SubItem[];
    setIsOpen: (isOpen: boolean) => void;
    parentTop: number;
}

export default function SidebarHoverMenu({ title, items, setIsOpen, parentTop }: SidebarHoverMenuProps) {
    const { theme } = useTheme();
    const shouldReduceMotion = useReducedMotion();
    const navigate = useNavigate();
    const location = useLocation();
    const { hasPageUpdate } = useNotifications();

    return (
        <motion.div
            style={{ top: parentTop }}
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 7, scale: shouldReduceMotion ? 1 : 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: shouldReduceMotion ? 0 : 5, scale: shouldReduceMotion ? 1 : 0.99 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: "easeOut" }}
            className={`fixed left-18 z-50 w-56 rounded-2xl border p-2 shadow-2xl backdrop-blur-xl ${
                theme
                    ? "border-gray-700/80 bg-gray-900/95 shadow-black/30"
                    : "border-gray-200/90 bg-white/95 shadow-gray-900/10"
            }`}
        >
            <p className={`px-3 py-2 text-xs font-bold uppercase tracking-wider ${
                theme ? "text-gray-500" : "text-neutral-400"
            }`}>
                {title}
            </p>

            <div className="flex flex-col gap-1">
                {items.map((sub) => {
                    const isActive = location.pathname === sub.path;
                    return (
                        <motion.button
                            key={sub.path}
                            onClick={() => {
                                navigate(sub.path);
                                setIsOpen(false);
                            }}
                            whileHover={shouldReduceMotion ? undefined : { x: 2 }}
                            whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
                            className={`w-full flex items-center gap-2.5 text-left px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 ${
                                isActive
                                    ? theme
                                        ? "bg-blue-500/15 text-blue-200 font-bold focus-visible:outline-blue-300"
                                        : "bg-red-50 text-red-700 font-bold focus-visible:outline-red-600"
                                    : theme
                                        ? "text-gray-300 hover:bg-gray-800 hover:text-blue-200 focus-visible:outline-blue-300"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-red-700 focus-visible:outline-red-600"
                            }`}
                        >
                            <span className={`text-lg transition-colors ${
                                isActive
                                    ? theme ? "text-blue-200" : "text-red-600"
                                    : theme ? "text-gray-400" : "text-gray-400"
                            }`}>
                                {sub.icon}
                            </span>
                            <span className="truncate">{sub.name}</span>
                            {hasPageUpdate(sub.path) && (
                                <span
                                    title="New update available"
                                    className="ml-auto h-2 w-2 rounded-full bg-red-600 ring-2 ring-white dark:ring-slate-900 animate-pulse shrink-0"
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </motion.div>
    );
}
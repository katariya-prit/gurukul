import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../theme/ThemeContext";
import { HiChevronDown } from "react-icons/hi";
import SidebarHoverMenu from "./SidebarHoverMenu";

interface SubItem {
    name: string;
    path: string;
    icon?: React.ReactNode;
}

interface DropdownProps {
    title: string;
    icon: React.ReactNode;
    items: SubItem[];
    setSidebarOpen: (isOpen: boolean) => void;
    isMiniSidebar: boolean;
}

export default function SidebarDropdown({ title, icon, items, setSidebarOpen, isMiniSidebar }: DropdownProps) {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const isChildActive = items.some((item) => location.pathname === item.path);

    const [isOpen, setIsOpen] = useState(isChildActive && !isMiniSidebar);
    const isParentActive = isChildActive;

    const [isHovered, setIsHovered] = useState(false);
    const [menuTop, setMenuTop] = useState<number>(0);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsOpen(isChildActive && !isMiniSidebar);
        if (isMiniSidebar) setIsHovered(false);
    }, [isMiniSidebar, isChildActive]);

    const handleMouseEnter = () => {
        if (isMiniSidebar && menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            setMenuTop(rect.top);
            setIsHovered(true);
        }
    };

    const handleMouseLeave = () => {
        if (isMiniSidebar) {
            setIsHovered(false);
        }
    };

    return (
        <div
            className="w-full relative cursor-pointer"
            ref={menuRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button
                onClick={() => {
                    if (!isMiniSidebar) {
                        setIsOpen(!isOpen);
                    }
                }}
                title={isMiniSidebar ? title : ""}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl font-semibold text-[15px] transition-all duration-200 group
                    ${isMiniSidebar ? "justify-center px-2" : ""}
                    ${
                        isParentActive
                            ? theme
                                ? "bg-linear-to-r from-blue-600 to-blue-200/10 text-blue-200 font-bold  "
                                : "bg-linear-to-r from-red-600 to-red-500/60 text-white font-bold"
                            : theme
                                ? "text-white hover:bg-gray-800 hover:text-blue-200"
                                : "bg-transparent text-gray-600 hover:bg-red-50 hover:text-red-600"
                    }
                `}
            >
                <div className="flex items-center gap-3.5">
                    <span className={`transition-colors ${
                        isParentActive
                            ? "text-white"
                            : theme ? "text-gray-400 group-hover:text-blue-200" : "text-gray-400  group-hover:text-red-600"
                    }`}>
                        {icon}
                    </span>
                    {!isMiniSidebar && title}
                </div>

                {!isMiniSidebar && (
                    <HiChevronDown className={`text-lg transition-transform duration-300 ${isOpen ? "rotate-180" : ""} ${
                        isParentActive
                            ? "text-white"
                            : theme ? "text-gray-400" : "text-gray-400"
                    }`} />
                )}
            </button>

            {/* --- સબ-મેનુ આઇટમ્સ (Accordion) --- */}
            <div
                className={`overflow-hidden transition-all duration-300 ${
                    isOpen && !isMiniSidebar ? "max-h-125 mt-1" : "max-h-0"
                }`}
                // 🌟 Closed/hidden hoy tyare aa wrapper Tab-focusable subtree ne
                // assistive tech mate pan "hidden" mark kare chhe.
                aria-hidden={!isOpen}
            >
                <div className="pl-12 p-2 space-y-1">
                    {items.map((sub, index) => {
                        const isActive = location.pathname === sub.path;
                        return (
                            <button
                                key={index}
                                // 🌟 MAIN FIX: dropdown closed hoy tyare Tab key
                                // aa button ne SKIP kare — focus sidhu next
                                // dropdown/element par jashe. Khuli tyare j
                                // normal tab-order ma aave chhe.
                                tabIndex={isOpen ? 0 : -1}
                                onClick={() => {
                                    navigate(sub.path);
                                    setSidebarOpen(false);
                                }}
                                className={`w-full flex items-center justify-start gap-1.5 text-left px-2 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer
                                    ${
                                        isActive
                                            ? theme
                                                ? "bg-linear-to-r from-blue-600 to-blue-200/10 text-blue-200 font-bold"
                                                : "bg-linear-to-r from-red-600 to-red-500/60 text-white font-bold"
                                            : theme
                                                ? "bg-transparent text-white hover:bg-gray-800 hover:text-blue-200"
                                                : "bg-transparent text-gray-600 hover:bg-red-50 hover:text-red-600"
                                    }
                                `}
                            >
                                {isActive && (
                                    <div className="w-1 h-6 shrink-0 rounded-2xl bg-white" />
                                )}
                                <span className={`text-lg transition-colors ${
                                    isActive
                                        ? "text-white"
                                        : theme ? "text-gray-400" : "text-gray-400"
                                }`}>
                                    {sub.icon}
                                </span>
                                {sub.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            {isMiniSidebar && isHovered && (
                <SidebarHoverMenu
                    title={title}
                    items={items}
                    setIsOpen={setSidebarOpen}
                    parentTop={menuTop}
                />
            )}
        </div>
    );
}
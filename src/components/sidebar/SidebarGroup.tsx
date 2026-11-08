import { useId, useState, type ComponentProps } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../theme/ThemeContext";
import MorphPopover from "../overlay/MorphPopover";
import ExpandedDropdown from "./SidebarDropdown";

type SidebarGroupProps = ComponentProps<typeof ExpandedDropdown>;

function MiniMorphItem({ title, icon, items, setSidebarOpen }: SidebarGroupProps) {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const uid = useId();
    const [isOpen, setIsOpen] = useState(false);

    const isGroupActive = items.some((item) => location.pathname === item.path);

    const triggerClass = `group flex w-full cursor-pointer items-center justify-center px-2 py-3.5 text-[15px] font-semibold transition-colors duration-200 ${isGroupActive
            ? theme
                ? "bg-gray-800 text-blue-200"
                : "bg-red-50 text-red-600"
            : theme
                ? "text-white hover:bg-gray-800 hover:text-blue-200"
                : "text-gray-500 hover:bg-red-50 hover:text-red-600"
        }`;


    const panelClass = `border shadow-2xl backdrop-blur-xl ${theme
            ? "border-gray-700/80 bg-gray-900/95 shadow-black/30"
            : "border-gray-200/90 bg-white/95 shadow-gray-900/10"
        }`;

    const handleNavigate = (path: string) => {
        navigate(path);
        setIsOpen(false);
        setSidebarOpen(false);
    };

    return (
        <MorphPopover
            id={`sidebar-${title}-${uid}`}
            isOpen={isOpen}
            onOpenChange={setIsOpen}
            placement="right"
            openOnHover
            wrapperClassName="relative flex w-full"
            triggerClassName={triggerClass}
            panelClassName={panelClass}
            triggerTitle={title}
            ariaLabel={title}
            closedRadius={12}
            openRadius={20}
            panelWidth={224}
            panelGap={14}
            hoverOpenDelay={90}
            hoverCloseDelay={180}
            renderTrigger={() => icon}
        >
            <div className="p-2">
                <p
                    className={`px-3 py-2 text-xs font-bold uppercase tracking-wider ${theme ? "text-gray-500" : "text-neutral-400"
                        }`}
                >
                    {title}
                </p>

                <div className="flex flex-col gap-1">
                    {items.map((sub) => {
                        const isActive = location.pathname === sub.path;

                        return (
                            <button
                                key={sub.path}
                                type="button"
                                onClick={() => handleNavigate(sub.path)}
                                className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 ${isActive
                                        ? theme
                                            ? "bg-blue-500/15 font-bold text-blue-200 focus-visible:outline-blue-300"
                                            : "bg-red-50 font-bold text-red-700 focus-visible:outline-red-600"
                                        : theme
                                            ? "text-gray-300 hover:bg-gray-800 hover:text-blue-200 focus-visible:outline-blue-300"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-red-700 focus-visible:outline-red-600"
                                    }`}
                            >
                                <span
                                    className={`text-lg transition-colors ${isActive ? (theme ? "text-blue-200" : "text-red-600") : "text-gray-400"
                                        }`}
                                >
                                    {sub.icon}
                                </span>
                                {sub.name}
                            </button>
                        );
                    })}
                </div>
            </div>
        </MorphPopover>
    );
}

export default function SidebarGroup(props: SidebarGroupProps) {
    if (props.isMiniSidebar) {
        return <MiniMorphItem {...props} />;
    }

    return <ExpandedDropdown {...props} />;
}
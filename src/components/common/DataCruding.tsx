import { useRef, useState } from "react";
import { useTheme } from "../theme/ThemeContext";
import { HiDotsVertical } from "react-icons/hi";
import { Menu } from "../overlay/OverlayPrimitives";

interface DataCrudingProps {
    onView?: () => void;
    onEdit?: () => void;
    onDelete: () => void;
    viewLabel?: string;
    editLabel?: string;
    deleteLabel?: string;
}

export default function DataCruding({
    onView,
    onEdit,
    onDelete,
    viewLabel = "View",
    editLabel = "Edit",
    deleteLabel = "Delete",
}: DataCrudingProps) {
    const { theme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen((prev) => !prev);
                }}
                aria-haspopup="true"
                aria-expanded={isOpen}
                aria-label="Open row actions"
                className={`p-2 rounded-full border transition-colors cursor-pointer flex items-center justify-center ${theme
                    ? "border-gray-700 bg-gray-800 text-gray-400 hover:text-white"
                    : "border-neutral-200 bg-neutral-50 text-neutral-500 hover:bg-neutral-100"
                    }`}
            >
                <HiDotsVertical className="text-sm" />
            </button>

            <Menu
                open={isOpen}
                onClose={() => setIsOpen(false)}
                anchorRef={buttonRef}
                placement="bottom-end"
                ariaLabel="Row actions"
                className="min-w-28 p-1"
            >
                        {onView && (
                            <button
                                type="button"
                                role="menuitem"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onView();
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${theme ? "hover:bg-gray-700" : "hover:bg-neutral-100"
                                    }`}
                            >
                                {viewLabel}
                            </button>
                        )}

                        {onEdit && (
                            <button
                                type="button"
                                role="menuitem"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit();
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${theme ? "hover:bg-gray-700" : "hover:bg-neutral-100"
                                    }`}
                            >
                                {editLabel}
                            </button>
                        )}

                        <button
                            type="button"
                            role="menuitem"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded-lg text-red-500 transition cursor-pointer ${theme ? "hover:bg-red-950/30" : "hover:bg-red-50"
                                }`}
                        >
                            {deleteLabel}
                        </button>
            </Menu>
        </>
    );
}
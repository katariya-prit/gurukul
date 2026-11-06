import { useRef, useState } from "react";
import { HiDotsVertical, HiEye, HiPencil, HiTrash } from "react-icons/hi";
import { useTheme } from "../theme/ThemeContext";
import { Menu } from "../overlay/OverlayPrimitives";

interface UserActionMenuProps {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function UserActionMenu({ onView, onEdit, onDelete }: UserActionMenuProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleAction = (callback: () => void) => {
    callback();
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Open user actions"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={`p-2 rounded-full border transition-colors cursor-pointer flex items-center justify-center ${
          theme
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
            ariaLabel="User actions"
            className={`min-w-36 p-1 ${
              theme
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-neutral-100 text-neutral-700"
            }`}
          >
            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                handleAction(onView);
              }}
              className={`w-full flex items-center gap-2 text-left px-3 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                theme ? "hover:bg-gray-700" : "hover:bg-neutral-100"
              }`}
            >
              <HiEye className="text-sm" />
              View
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                handleAction(onEdit);
              }}
              className={`w-full flex items-center gap-2 text-left px-3 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                theme ? "hover:bg-gray-700" : "hover:bg-neutral-100"
              }`}
            >
              <HiPencil className="text-sm" />
              Edit
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                handleAction(onDelete);
              }}
              className={`w-full flex items-center gap-2 text-left px-3 py-2 text-xs font-semibold rounded-lg text-red-500 transition cursor-pointer ${
                theme ? "hover:bg-red-950/30" : "hover:bg-red-50"
              }`}
            >
              <HiTrash className="text-sm" />
              Delete
            </button>
      </Menu>
      
    </>
  );
}

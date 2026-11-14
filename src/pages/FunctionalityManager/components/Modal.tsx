import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "../../../components/theme/ThemeContext";
import { surfaceClass } from "./styles";

interface ModalProps {
    title: string;
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    size?: "sm" | "md" | "lg";
    wide?: boolean;
    role?: "dialog" | "alertdialog";
}

export default function Modal({
    title,
    open,
    onClose,
    children,
    size = "md",
    wide = false,
    role = "dialog",
}: ModalProps) {
    const { theme } = useTheme();
    const modalRef = useRef<HTMLElement>(null);
    const resolvedSize = wide ? "lg" : size;

    const maxWidthClass =
        resolvedSize === "sm"
            ? "sm:max-w-md"
            : resolvedSize === "lg"
                ? "sm:max-w-2xl"
                : "sm:max-w-xl";

    useEffect(() => {
        if (!open) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose();
                return;
            }

            if (event.key === "Tab" && modalRef.current) {
                const focusable = modalRef.current.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (focusable.length === 0) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose, open]);

    if (typeof document === "undefined") return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[9999] flex items-end justify-center p-0 sm:items-center sm:p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.16 }}
                        onClick={onClose}
                        className={`fixed inset-0 ${
                            theme ? "bg-black/60 backdrop-blur-md" : "bg-black/40 backdrop-blur-sm"
                        }`}
                        aria-hidden="true"
                    />

                    <motion.section
                        ref={modalRef}
                        role={role}
                        aria-modal="true"
                        aria-labelledby="manager-modal-title"
                        initial={{ opacity: 0, y: 40, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className={`relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border shadow-2xl sm:max-h-[90vh] sm:rounded-2xl ${maxWidthClass} ${surfaceClass(
                            theme
                        )} pb-[env(safe-area-inset-bottom)]`}
                    >
                        <div className="flex shrink-0 items-center justify-between border-b border-inherit px-5 py-4 sm:px-6 sm:py-5">
                            <h2 id="manager-modal-title" className="truncate text-lg font-bold sm:text-xl">
                                {title}
                            </h2>
                            <button
                                type="button"
                                aria-label="Close dialog"
                                onClick={onClose}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-2xl transition hover:bg-black/5 focus-visible:outline-2 dark:hover:bg-white/5"
                            >
                                ×
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>
                    </motion.section>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}

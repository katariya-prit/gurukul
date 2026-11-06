import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";

interface MorphPopoverProps {
    id: string;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    renderTrigger: (state: { isOpen: boolean }) => ReactNode;
    children: ReactNode;
    triggerClassName?: string;
    triggerContentClassName?: string;
    panelClassName?: string;
    closedRadius?: number;
    openRadius?: number;
    ariaLabel?: string;
    triggerTitle?: string;
    align?: "left" | "right";
    panelWidth?: number;
    panelGap?: number;
    viewportMargin?: number;
}

interface PanelPosition {
    top: number;
    left: number;
    width: number;
    maxHeight: number;
}

const SPRING = { type: "spring" as const, stiffness: 320, damping: 30, mass: 0.9 };

export default function MorphPopover({
    id,
    isOpen,
    onOpenChange,
    renderTrigger,
    children,
    triggerClassName = "",
    triggerContentClassName = "flex items-center",
    panelClassName = "",
    closedRadius = 12,
    openRadius = 28,
    ariaLabel,
    triggerTitle,
    align = "right",
    panelWidth = 360,
    panelGap = 10,
    viewportMargin = 12,
}: MorphPopoverProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const hasOpenedRef = useRef(false);
    const reduceMotion = useReducedMotion();
    const layoutId = `morph-${id}`;
    const transition = reduceMotion ? { duration: 0.01 } : SPRING;
    const triggerFadeDelay = reduceMotion ? 0 : 0.12;
    const panelFadeDelay = reduceMotion ? 0 : 0.14;
    const [position, setPosition] = useState<PanelPosition | null>(null);

    useEffect(() => {
        if (isOpen) hasOpenedRef.current = true;
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node;
            const insideWrapper = wrapperRef.current?.contains(target);
            const insidePanel = panelRef.current?.contains(target);
            if (!insideWrapper && !insidePanel) {
                onOpenChange(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onOpenChange(false);
        };

        document.addEventListener("pointerdown", handlePointerDown, true);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown, true);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onOpenChange]);

    useEffect(() => {
        if (!isOpen) return;

        const openFrame = requestAnimationFrame(() => {
            panelRef.current?.focus({ preventScroll: true });
        });

        return () => {
            cancelAnimationFrame(openFrame);
            requestAnimationFrame(() => {
                const active = document.activeElement;
                if (!active || active === document.body) {
                    triggerRef.current?.focus({ preventScroll: true });
                }
            });
        };
    }, [isOpen]);

    useLayoutEffect(() => {
        if (!isOpen) {
            setPosition(null);
            return;
        }

        const updatePosition = () => {
            const anchor = wrapperRef.current;
            if (!anchor) return;

            const rect = anchor.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const width = Math.min(panelWidth, Math.max(0, viewportWidth - viewportMargin * 2));
            const idealLeft = align === "right" ? rect.right - width : rect.left;
            const left = Math.min(
                Math.max(idealLeft, viewportMargin),
                Math.max(viewportMargin, viewportWidth - width - viewportMargin)
            );
            const top = rect.bottom + panelGap;
            const maxHeight = Math.max(0, viewportHeight - top - viewportMargin);

            setPosition({ top, left, width, maxHeight });
        };

        updatePosition();
        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);

        const observer =
            typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updatePosition);
        if (wrapperRef.current) observer?.observe(wrapperRef.current);
        observer?.observe(document.body);

        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
            observer?.disconnect();
        };
    }, [align, isOpen, panelGap, panelWidth, viewportMargin]);

    return (
        <LayoutGroup id={id}>
            <div ref={wrapperRef} className="relative inline-flex">
                {!isOpen ? (
                    <motion.button
                        ref={triggerRef}
                        layoutId={layoutId}
                        type="button"
                        onClick={() => onOpenChange(true)}
                        aria-haspopup="dialog"
                        aria-expanded={false}
                        aria-label={ariaLabel}
                        title={triggerTitle}
                        className={triggerClassName}
                        style={{ borderRadius: closedRadius }}
                        transition={transition}
                    >
                        <motion.span
                            className={triggerContentClassName}
                            initial={hasOpenedRef.current ? { opacity: 0 } : false}
                            animate={{ opacity: 1 }}
                            transition={{ delay: triggerFadeDelay, duration: 0.18 }}
                        >
                            {renderTrigger({ isOpen: false })}
                        </motion.span>
                    </motion.button>
                ) : (
                    <button
                        type="button"
                        tabIndex={-1}
                        aria-hidden="true"
                        className={`${triggerClassName} pointer-events-none invisible`}
                        style={{ borderRadius: closedRadius }}
                    >
                        <span className={triggerContentClassName}>{renderTrigger({ isOpen: true })}</span>
                    </button>
                )}
            </div>
            {isOpen && position &&
                createPortal(
                    <motion.div
                        ref={panelRef}
                        layoutId={layoutId}
                        role="dialog"
                        aria-modal="false"
                        aria-label={ariaLabel}
                        tabIndex={-1}
                        className={`fixed z-50 overflow-hidden outline-none ${panelClassName}`}
                        style={{
                            position: "fixed",
                            top: position.top,
                            left: position.left,
                            width: position.width,
                            maxHeight: position.maxHeight,
                            borderRadius: openRadius,
                            transformOrigin: align === "right" ? "top right" : "top left",
                            willChange: "transform, opacity",
                        }}
                        transition={transition}
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: panelFadeDelay, duration: 0.2 }}
                            className="max-h-full overflow-y-auto"
                        >
                            {children}
                        </motion.div>
                    </motion.div>,
                    document.body
                )}
        </LayoutGroup>
    );
}   
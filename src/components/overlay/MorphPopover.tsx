import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type PointerEvent as ReactPointerEvent,
    type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";

interface MorphPopoverProps {
    id: string;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    renderTrigger: (state: { isOpen: boolean }) => ReactNode;
    children: ReactNode;
    variant?: "morph" | "flyout";
    triggerClassName?: string;
    triggerContentClassName?: string;
    panelClassName?: string;
    wrapperClassName?: string;
    ghostClassName?: string;
    closedRadius?: number;
    openRadius?: number;
    ariaLabel?: string;
    triggerTitle?: string;
    align?: "left" | "right";
    placement?: "bottom" | "right";
    panelWidth?: number;
    panelGap?: number;
    viewportMargin?: number;
    openOnHover?: boolean;
    hoverOpenDelay?: number;
    hoverCloseDelay?: number;
}

interface PanelPosition {
    top: number;
    left: number;
    width: number;
    maxHeight: number;
    anchorCenterY: number;
}

const SPRING = { type: "spring" as const, stiffness: 320, damping: 30, mass: 0.9 };
const FLYOUT_SPRING = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.8 };

export default function MorphPopover({
    id,
    isOpen,
    onOpenChange,
    renderTrigger,
    children,
    variant = "morph",
    triggerClassName = "",
    triggerContentClassName = "flex items-center",
    panelClassName = "",
    wrapperClassName = "relative inline-flex",
    ghostClassName = "",
    closedRadius = 12,
    openRadius = 28,
    ariaLabel,
    triggerTitle,
    align = "right",
    placement = "bottom",
    panelWidth = 360,
    panelGap = 10,
    viewportMargin = 12,
    openOnHover = false,
    hoverOpenDelay = 90,
    hoverCloseDelay = 180,
}: MorphPopoverProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const hasOpenedRef = useRef(false);
    const hoverTimerRef = useRef<number | null>(null);
    const reduceMotion = useReducedMotion();
    const isFlyout = variant === "flyout";
    const layoutId = `morph-${id}`;
    const transition = reduceMotion ? { duration: 0.01 } : SPRING;
    const triggerFadeDelay = reduceMotion ? 0 : 0.12;
    const panelFadeDelay = reduceMotion ? 0 : isFlyout ? 0.05 : 0.14;
    const [position, setPosition] = useState<PanelPosition | null>(null);
    const [panelHeight, setPanelHeight] = useState(0);
    const hasPosition = position !== null;

    const measure = useCallback(() => {
        const anchor = wrapperRef.current;
        if (!anchor) return;

        const rect = anchor.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const width = Math.min(panelWidth, Math.max(0, viewportWidth - viewportMargin * 2));
        const maxLeft = Math.max(viewportMargin, viewportWidth - width - viewportMargin);
        const anchorCenterY = rect.top + rect.height / 2;

        let left: number;
        let top: number;
        let maxHeight: number;

        if (placement === "right") {
            left = Math.min(rect.right + panelGap, maxLeft);
            top = rect.top;
            maxHeight = Math.max(0, viewportHeight - viewportMargin * 2);
        } else {
            const idealLeft = align === "right" ? rect.right - width : rect.left;
            left = Math.min(Math.max(idealLeft, viewportMargin), maxLeft);
            top = rect.bottom + panelGap;
            maxHeight = Math.max(0, viewportHeight - top - viewportMargin);
        }

        setPosition((prev) =>
            prev &&
                prev.top === top &&
                prev.left === left &&
                prev.width === width &&
                prev.maxHeight === maxHeight &&
                prev.anchorCenterY === anchorCenterY
                ? prev
                : { top, left, width, maxHeight, anchorCenterY }
        );
    }, [align, panelGap, panelWidth, placement, viewportMargin]);

    const clearHoverTimer = useCallback(() => {
        if (hoverTimerRef.current !== null) {
            window.clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
    }, []);

    const scheduleOpenChange = useCallback(
        (open: boolean, delay: number) => {
            clearHoverTimer();
            hoverTimerRef.current = window.setTimeout(() => {
                hoverTimerRef.current = null;
                onOpenChange(open);
            }, delay);
        },
        [clearHoverTimer, onOpenChange]
    );

    useEffect(() => () => clearHoverTimer(), [clearHoverTimer]);

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
        if (!isOpen || openOnHover) return;

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
    }, [isOpen, openOnHover]);

    useLayoutEffect(() => {
        if (!isOpen) return;

        measure();
        window.addEventListener("resize", measure);
        window.addEventListener("scroll", measure, true);

        const observer =
            typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
        if (wrapperRef.current) observer?.observe(wrapperRef.current);
        observer?.observe(document.body);

        return () => {
            window.removeEventListener("resize", measure);
            window.removeEventListener("scroll", measure, true);
            observer?.disconnect();
        };
    }, [isOpen, measure]);

    useLayoutEffect(() => {
        if (!isOpen || !hasPosition) return;

        const element = panelRef.current;
        if (!element) return;

        const update = () => setPanelHeight(element.offsetHeight);
        update();

        const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
        observer?.observe(element);

        return () => observer?.disconnect();
    }, [isOpen, hasPosition]);

    const handleWrapperEnter = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!openOnHover || event.pointerType !== "mouse") return;
        if (isOpen) {
            clearHoverTimer();
            return;
        }
        measure();
        scheduleOpenChange(true, hoverOpenDelay);
    };

    const handleWrapperLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!openOnHover || event.pointerType !== "mouse") return;
        const next = event.relatedTarget;
        if (next instanceof Node && panelRef.current?.contains(next)) return;
        scheduleOpenChange(false, hoverCloseDelay);
    };

    const handlePanelEnter = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!openOnHover || event.pointerType !== "mouse") return;
        clearHoverTimer();
    };

    const handlePanelLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!openOnHover || event.pointerType !== "mouse") return;
        const next = event.relatedTarget;
        if (next instanceof Node && wrapperRef.current?.contains(next)) return;
        scheduleOpenChange(false, hoverCloseDelay);
    };

    const panelTop =
        position === null
            ? 0
            : placement === "right" && panelHeight > 0
                ? Math.max(
                    viewportMargin,
                    Math.min(position.top, window.innerHeight - viewportMargin - panelHeight)
                )
                : position.top;

    const originY =
        position === null
            ? 0
            : Math.max(
                0,
                panelHeight > 0
                    ? Math.min(panelHeight, position.anchorCenterY - panelTop)
                    : position.anchorCenterY - panelTop
            );

    const baseStyle = position
        ? {
            position: "fixed" as const,
            top: panelTop,
            left: position.left,
            width: position.width,
            maxHeight: position.maxHeight,
            borderRadius: openRadius,
            willChange: "transform, opacity",
        }
        : undefined;

    const panelContent = (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: panelFadeDelay, duration: 0.2 }}
            className="max-h-full overflow-y-auto"
        >
            {children}
        </motion.div>
    );

    const triggerNode = isFlyout ? (
        <button
            ref={triggerRef}
            type="button"
            onClick={() => {
                measure();
                onOpenChange(true);
            }}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-label={ariaLabel}
            title={isOpen ? undefined : triggerTitle}
            className={`${triggerClassName} ${isOpen ? ghostClassName : ""}`}
            style={{ borderRadius: closedRadius }}
        >
            <span className={triggerContentClassName}>{renderTrigger({ isOpen })}</span>
        </button>
    ) : !isOpen ? (
        <motion.button
            ref={triggerRef}
            layoutId={layoutId}
            type="button"
            onClick={() => {
                measure();
                onOpenChange(true);
            }}
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
    );

    return (
        <LayoutGroup id={id}>
            <div
                ref={wrapperRef}
                className={wrapperClassName}
                onPointerEnter={handleWrapperEnter}
                onPointerLeave={handleWrapperLeave}
            >
                {triggerNode}
            </div>

            {isFlyout &&
                createPortal(
                    <AnimatePresence>
                        {isOpen && position && (
                            <motion.div
                                key={layoutId}
                                ref={panelRef}
                                role="dialog"
                                aria-modal="false"
                                aria-label={ariaLabel}
                                tabIndex={-1}
                                onPointerEnter={handlePanelEnter}
                                onPointerLeave={handlePanelLeave}
                                className={`fixed z-50 overflow-hidden outline-none ${panelClassName}`}
                                style={{ ...baseStyle, transformOrigin: `0px ${originY}px` }}
                                initial={
                                    reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5, x: -10 }
                                }
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={
                                    reduceMotion
                                        ? { opacity: 0, transition: { duration: 0.01 } }
                                        : {
                                            opacity: 0,
                                            scale: 0.6,
                                            x: -8,
                                            transition: { duration: 0.14, ease: "easeIn" },
                                        }
                                }
                                transition={reduceMotion ? { duration: 0.01 } : FLYOUT_SPRING}
                            >
                                {panelContent}
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}

            {!isFlyout &&
                isOpen &&
                position &&
                createPortal(
                    <motion.div
                        ref={panelRef}
                        layoutId={layoutId}
                        role="dialog"
                        aria-modal="false"
                        aria-label={ariaLabel}
                        tabIndex={-1}
                        onPointerEnter={handlePanelEnter}
                        onPointerLeave={handlePanelLeave}
                        className={`fixed z-50 overflow-hidden outline-none ${panelClassName}`}
                        style={{
                            ...baseStyle,
                            transformOrigin:
                                placement === "right" || align === "left" ? "top left" : "top right",
                        }}
                        transition={transition}
                    >
                        {panelContent}
                    </motion.div>,
                    document.body
                )}
        </LayoutGroup>
    );
}
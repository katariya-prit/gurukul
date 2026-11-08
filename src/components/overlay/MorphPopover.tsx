import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    useSyncExternalStore,
    type PointerEvent as ReactPointerEvent,
    type ReactNode,
} from "react";
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
    keepTriggerVisible?: boolean;
}

interface PanelPosition {
    top: number;
    left: number;
    width: number;
    maxHeight: number;
}

const SPRING = { type: "spring" as const, stiffness: 220, damping: 28, mass: 1.2 };
const DESKTOP_QUERY = "(min-width: 768px)";

const subscribeDesktop = (onChange: () => void) => {
    const media = window.matchMedia(DESKTOP_QUERY);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
};

const getDesktopSnapshot = () => window.matchMedia(DESKTOP_QUERY).matches;

const getDesktopServerSnapshot = () => true;

export default function MorphPopover({
    id,
    isOpen,
    onOpenChange,
    renderTrigger,
    children,
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
    keepTriggerVisible = false,
}: MorphPopoverProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const hasOpenedRef = useRef(false);
    const hoverTimerRef = useRef<number | null>(null);
    const reduceMotion = useReducedMotion();
    const isDesktop = useSyncExternalStore(
        subscribeDesktop,
        getDesktopSnapshot,
        getDesktopServerSnapshot
    );
    const skipMorph = reduceMotion === true || !isDesktop;
    const activeLayoutId = skipMorph ? undefined : `morph-${id}`;
    const transition = skipMorph ? { duration: 0.01 } : SPRING;
    const triggerFadeDelay = skipMorph ? 0 : 0.12;
    const panelFadeDelay = skipMorph ? 0 : 0.14;
    const contentFadeDuration = skipMorph ? 0.01 : 0.2;
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
                prev.maxHeight === maxHeight
                ? prev
                : { top, left, width, maxHeight }
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

    return (
        <LayoutGroup id={id}>
            <div
                ref={wrapperRef}
                className={wrapperClassName}
                onPointerEnter={handleWrapperEnter}
                onPointerLeave={handleWrapperLeave}
            >
                {!isOpen ? (
                    <motion.button
                        ref={triggerRef}
                        layoutId={activeLayoutId}
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
                            initial={hasOpenedRef.current && !keepTriggerVisible && !skipMorph ? { opacity: 0 } : false}
                            animate={{ opacity: 1 }}
                            transition={{ delay: triggerFadeDelay, duration: contentFadeDuration }}
                        >
                            {renderTrigger({ isOpen: false })}
                        </motion.span>
                    </motion.button>
                ) : (
                    <button
                        type="button"
                        tabIndex={-1}
                        aria-hidden="true"
                        className={`${triggerClassName} pointer-events-none ${keepTriggerVisible ? ghostClassName : "invisible"}`}
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
                        layoutId={activeLayoutId}
                        role="dialog"
                        aria-modal="false"
                        aria-label={ariaLabel}
                        tabIndex={-1}
                        onPointerEnter={handlePanelEnter}
                        onPointerLeave={handlePanelLeave}
                        className={`fixed z-50 overflow-hidden outline-none ${panelClassName}`}
                        style={{
                            position: "fixed",
                            top: panelTop,
                            left: position.left,
                            width: position.width,
                            maxHeight: position.maxHeight,
                            borderRadius: openRadius,
                            transformOrigin:
                                placement === "right" || align === "left" ? "top left" : "top right",
                            willChange: "transform, opacity",
                        }}
                        transition={transition}
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: panelFadeDelay, duration: contentFadeDuration }}
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
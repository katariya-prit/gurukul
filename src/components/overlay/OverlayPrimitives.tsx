import {
  useEffect,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  m,
  useReducedMotion,
  type PanInfo,
} from "motion/react";
import {
  arrow,
  autoUpdate,
  flip,
  offset,
  size,
  shift,
  useFloating,
  type Placement,
} from "@floating-ui/react-dom";
import { useTheme } from "../theme/ThemeContext";
import { OVERLAY_Z_INDEX } from "./OverlayRoot";
import { OverlayContext } from "./overlayContext";

type ElementRef<T extends HTMLElement> = MutableRefObject<T | null>;

function useOverlayContext() {
  const context = useContext(OverlayContext);
  if (!context) throw new Error("Overlay primitives must be used inside OverlayRoot");
  return context;
}

interface LayerOptions {
  id: string;
  open: boolean;
  elementRef: ElementRef<HTMLElement>;
  triggerRef?: ElementRef<HTMLElement>;
  modal?: boolean;
  onClose: () => void;
  closeOnOutside?: boolean;
}

function useLayer({
  id,
  open,
  elementRef,
  triggerRef,
  modal = false,
  onClose,
  closeOnOutside = true,
}: LayerOptions) {
  const { register, update } = useOverlayContext();
  const callbackRef = useRef(onClose);
  useLayoutEffect(() => {
    callbackRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const registration = {
      id,
      element: elementRef.current,
      trigger: triggerRef?.current ?? null,
      modal,
      onEscape: () => callbackRef.current(),
      onOutside: () => {
        if (closeOnOutside) callbackRef.current();
      },
    };
    const unregister = register(registration);
    return unregister;
  }, [closeOnOutside, elementRef, id, modal, open, register, triggerRef]);

  useLayoutEffect(() => {
    if (!open) return;
    update({
      id,
      element: elementRef.current,
      trigger: triggerRef?.current ?? null,
      modal,
      onEscape: () => callbackRef.current(),
      onOutside: () => {
        if (closeOnOutside) callbackRef.current();
      },
    });
  });
}

function useFocusTrap(
  open: boolean,
  elementRef: ElementRef<HTMLElement>,
  triggerRef?: ElementRef<HTMLElement>,
  initialFocusRef?: ElementRef<HTMLElement>
) {
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const trigger = triggerRef?.current ?? null;
    const focusTarget = initialFocusRef?.current ??
      elementRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
    focusTarget?.focus();
    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !elementRef.current) return;
      const focusable = elementRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
    };
    document.addEventListener("keydown", handleTab);
    return () => {
      document.removeEventListener("keydown", handleTab);
      (trigger ?? previousFocus)?.focus();
    };
  }, [elementRef, initialFocusRef, open, triggerRef]);
}

function useBodyScrollLock(open: boolean) {
  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, [open]);
}

let bodyScrollLocks = 0;
let previousBodyOverflow = "";
let previousBodyPadding = "";

function lockBodyScroll() {
  bodyScrollLocks += 1;
  if (bodyScrollLocks !== 1) return;
  previousBodyOverflow = document.body.style.overflow;
  previousBodyPadding = document.body.style.paddingRight;
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow = "hidden";
  if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
}

function unlockBodyScroll() {
  bodyScrollLocks = Math.max(0, bodyScrollLocks - 1);
  if (bodyScrollLocks !== 0) return;
  document.body.style.overflow = previousBodyOverflow;
  document.body.style.paddingRight = previousBodyPadding;
}

function GlassSurface({ children, className = "", style }: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const { theme } = useTheme();
  return (
    <div
      style={style}
      className={`overlay-surface rounded-3xl border shadow-2xl backdrop-blur-xl ${theme ? "border-white/10 bg-slate-950/85 text-white" : "border-white/70 bg-white/90 text-neutral-900"} ${className}`}
    >
      {children}
    </div>
  );
}

export interface PopoverProps {
  open: boolean;
  onClose: () => void;
  anchorRef: ElementRef<HTMLElement>;
  children: ReactNode;
  placement?: Placement;
  className?: string;
  role?: "dialog" | "menu" | "listbox" | "region";
  ariaLabel?: string;
  showArrow?: boolean;
  closeOnOutside?: boolean;
  onKeyDown?: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
  matchAnchorWidth?: boolean;
}

export function Popover({
  open,
  onClose,
  anchorRef,
  children,
  placement = "bottom-end",
  className = "",
  role = "region",
  ariaLabel,
  showArrow = false,
  closeOnOutside = true,
  onKeyDown,
  matchAnchorWidth = false,
}: PopoverProps) {
  const id = useId();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [arrowElement, setArrowElement] = useState<HTMLDivElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { theme } = useTheme();
  const { portalRoot, getOrigin } = useOverlayContext();
  const { refs, floatingStyles, middlewareData, placement: finalPlacement } = useFloating({
    open,
    placement,
    strategy: "fixed",
    transform: false,
    middleware: [
      offset(showArrow ? 12 : 8),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      ...(showArrow && arrowElement ? [arrow({ element: arrowElement })] : []),
      ...(matchAnchorWidth
        ? [size({
            apply({ rects, elements }) {
              elements.floating.style.width = `${rects.reference.width}px`;
            },
          })]
        : []),
    ],
    whileElementsMounted: autoUpdate,
  });

  useLayoutEffect(() => {
    if (anchorRef.current) {
      refs.setReference(anchorRef.current);
    }
  });

  useLayoutEffect(() => {
    if (open && surfaceRef.current) {
      surfaceRef.current.style.transformOrigin = getOrigin(surfaceRef.current, anchorRef.current);
    }
  }, [anchorRef, getOrigin, open, arrowElement]);

  useLayer({
    id,
    open,
    elementRef: surfaceRef as ElementRef<HTMLElement>,
    triggerRef: anchorRef,
    onClose,
    closeOnOutside,
  });

  useEffect(() => {
    if (!open || role !== "menu") return;
    const anchor = anchorRef.current;
    surfaceRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus();
    return () => anchor?.focus();
  }, [anchorRef, open, role]);

  if (!portalRoot) return null;
  const reduce = shouldReduceMotion === true;
  const arrowX = middlewareData.arrow?.x;
  const arrowY = middlewareData.arrow?.y;
  const side = finalPlacement.split("-")[0];
  const arrowStyle: CSSProperties = {
    position: "absolute",
    left: arrowX,
    top: arrowY,
    ...(side === "top" ? { bottom: -5 } : {}),
    ...(side === "bottom" ? { top: -5 } : {}),
    ...(side === "left" ? { right: -5 } : {}),
    ...(side === "right" ? { left: -5 } : {}),
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div
          ref={(node) => {
            surfaceRef.current = node;
            refs.setFloating(node);
          }}
          role={role}
          aria-label={ariaLabel}
          initial={{ opacity: 0, scale: reduce ? 1 : 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: reduce ? 1 : 0.96 }}
          transition={reduce ? { duration: 0.16 } : { type: "spring", stiffness: 420, damping: 34, mass: 0.8 }}
          style={{
            ...floatingStyles,
            zIndex: OVERLAY_Z_INDEX.popover,
          }}
          onAnimationStart={() => {
            if (surfaceRef.current) surfaceRef.current.style.willChange = "transform, opacity";
          }}
          onAnimationComplete={() => {
            if (surfaceRef.current) surfaceRef.current.style.willChange = "";
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.defaultPrevented || role !== "menu") return;
            const items = Array.from(
              surfaceRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? []
            );
            const currentIndex = items.indexOf(document.activeElement as HTMLElement);
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              const nextIndex = event.key === "ArrowDown"
                ? (currentIndex + 1 + items.length) % items.length
                : (currentIndex - 1 + items.length) % items.length;
              items[nextIndex]?.focus();
            } else if (event.key === "Home") {
              event.preventDefault();
              items[0]?.focus();
            } else if (event.key === "End") {
              event.preventDefault();
              items.at(-1)?.focus();
            }
          }}
          className={`overlay-layer ${className}`}
        >
          <GlassSurface className="relative overflow-visible">
            {showArrow && <div ref={setArrowElement} style={arrowStyle} className={`h-2.5 w-2.5 rotate-45 border ${theme ? "border-white/10 bg-slate-950" : "border-white/70 bg-white"}`} />}
            {children}
          </GlassSurface>
        </m.div>
      )}
    </AnimatePresence>,
    portalRoot
  );
}

export function Menu(props: Omit<PopoverProps, "role">) {
  return <Popover {...props} role="menu" />;
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  description?: string;
  ariaLabel?: string;
  className?: string;
  triggerRef?: ElementRef<HTMLElement>;
  initialFocusRef?: ElementRef<HTMLElement>;
  closeOnOutside?: boolean;
  closeButtonLabel?: string;
  onExitComplete?: () => void;
}

export function Modal({
  open,
  onClose,
  children,
  title,
  description,
  ariaLabel,
  className = "",
  triggerRef,
  initialFocusRef,
  closeOnOutside = true,
  closeButtonLabel = "Close dialog",
  onExitComplete,
}: ModalProps) {
  const id = useId();
  const surfaceRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { portalRoot, getOrigin } = useOverlayContext();
  const { theme } = useTheme();
  useLayer({
    id,
    open,
    elementRef: surfaceRef as ElementRef<HTMLElement>,
    triggerRef,
    modal: true,
    onClose,
    closeOnOutside,
  });
  useFocusTrap(open, surfaceRef as ElementRef<HTMLElement>, triggerRef, initialFocusRef);
  useBodyScrollLock(open);

  useLayoutEffect(() => {
    if (open && surfaceRef.current) {
      surfaceRef.current.style.transformOrigin = getOrigin(surfaceRef.current, triggerRef?.current ?? null);
    }
  }, [getOrigin, open, triggerRef]);

  if (!portalRoot) return null;
  const reduce = shouldReduceMotion === true;
  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div
          className="overlay-scrim fixed inset-0 z-[1200] flex items-center justify-center bg-black/45 p-3 backdrop-blur-md sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.12 : 0.2 }}
          onPointerDown={(event) => {
            if (closeOnOutside && event.target === event.currentTarget) onClose();
          }}
        >
          <m.section
            ref={surfaceRef}
            role="dialog"
            aria-modal="true"
            aria-label={title ? undefined : ariaLabel ?? "Dialog"}
            aria-labelledby={title ? `${id}-title` : undefined}
            aria-describedby={description ? `${id}-description` : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, scale: reduce ? 1 : 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: reduce ? 1 : 0.96 }}
            transition={reduce ? { duration: 0.16 } : { type: "spring", stiffness: 420, damping: 34, mass: 0.8 }}
            onAnimationStart={() => {
              if (surfaceRef.current) surfaceRef.current.style.willChange = "transform, opacity";
            }}
            onAnimationComplete={() => {
              if (surfaceRef.current) surfaceRef.current.style.willChange = "";
              if (!open) onExitComplete?.();
            }}
            className={`overlay-surface my-auto max-h-[calc(100dvh-1.5rem)] w-full overflow-y-auto overscroll-contain rounded-3xl border shadow-2xl backdrop-blur-xl ${theme ? "border-white/10 bg-slate-950/85 text-white" : "border-white/70 bg-white/90 text-neutral-900"} ${className}`}
          >
            {(title || description) && (
              <header className="flex items-start justify-between gap-4 p-5 pb-0">
                <div>
                  {title && <h2 id={`${id}-title`} className="text-xl font-bold">{title}</h2>}
                  {description && <p id={`${id}-description`} className={`mt-1 text-sm ${theme ? "text-white/60" : "text-neutral-500"}`}>{description}</p>}
                </div>
                <button
                  type="button"
                  aria-label={closeButtonLabel}
                  onClick={onClose}
                  className={`rounded-full px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 ${theme ? "hover:bg-white/10 focus-visible:ring-blue-400" : "hover:bg-neutral-100 focus-visible:ring-red-400"}`}
                >
                  Close
                </button>
              </header>
            )}
            {children}
          </m.section>
        </m.div>
      )}
    </AnimatePresence>,
    portalRoot
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  onResolve: (confirmed: boolean) => void;
  title: string;
  message: string;
  destructive?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ConfirmDialog({
  open,
  onResolve,
  title,
  message,
  destructive = false,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
}: ConfirmDialogProps) {
  const { theme } = useTheme();
  const id = useId();
  return (
    <Modal open={open} onClose={() => onResolve(false)} className="max-w-md p-6">
      <section role="alertdialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-message`}>
        <h2 id={`${id}-title`} className="text-xl font-bold">{title}</h2>
        <p id={`${id}-message`} className={`mt-3 text-sm ${theme ? "text-white/65" : "text-neutral-600"}`}>{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => onResolve(false)} className={`rounded-full border px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 ${theme ? "border-white/15 hover:bg-white/10 focus-visible:ring-blue-400" : "border-neutral-200 hover:bg-neutral-50 focus-visible:ring-red-400"}`}>{cancelLabel}</button>
          <button type="button" onClick={() => onResolve(true)} className={`rounded-full px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 ${destructive ? "bg-red-600 hover:bg-red-500 focus-visible:ring-red-400" : theme ? "bg-blue-600 hover:bg-blue-500 focus-visible:ring-blue-400" : "bg-red-600 hover:bg-red-500 focus-visible:ring-red-400"}`}>{confirmLabel}</button>
        </div>
      </section>
    </Modal>
  );
}

interface EdgeOverlayProps extends Omit<ModalProps, "className" | "closeOnOutside"> {
  side?: "left" | "right" | "top" | "bottom";
  className?: string;
  distanceThreshold?: number;
  velocityThreshold?: number;
}

function EdgeOverlay({
  open,
  onClose,
  children,
  title,
  description,
  ariaLabel,
  triggerRef,
  initialFocusRef,
  side = "right",
  className = "",
  distanceThreshold = 120,
  velocityThreshold = 650,
  onExitComplete,
}: EdgeOverlayProps) {
  const id = useId();
  const surfaceRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { portalRoot } = useOverlayContext();
  const { theme } = useTheme();
  useLayer({
    id,
    open,
    elementRef: surfaceRef as ElementRef<HTMLElement>,
    triggerRef,
    modal: true,
    onClose,
    closeOnOutside: true,
  });
  useFocusTrap(open, surfaceRef as ElementRef<HTMLElement>, triggerRef, initialFocusRef);
  useBodyScrollLock(open);
  if (!portalRoot) return null;
  const reduce = shouldReduceMotion === true;
  const xStart = side === "right" ? "100%" : side === "left" ? "-100%" : 0;
  const yStart = side === "bottom" ? "100%" : side === "top" ? "-100%" : 0;
  const dragAxis = side === "left" || side === "right" ? "x" : "y";
  const closeInDirection = (info: PanInfo) => {
    const displacement = dragAxis === "x" ? info.offset.x : info.offset.y;
    const velocity = dragAxis === "x" ? info.velocity.x : info.velocity.y;
    const sign = side === "right" || side === "bottom" ? 1 : -1;
    if (displacement * sign > distanceThreshold || velocity * sign > velocityThreshold) onClose();
  };
  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div
          className="overlay-scrim fixed inset-0 z-[1300] flex bg-black/45 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.12 : 0.2 }}
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <m.aside
            ref={surfaceRef}
            role="dialog"
            aria-modal="true"
            aria-label={title ? undefined : ariaLabel ?? "Panel"}
            tabIndex={-1}
            drag={reduce ? false : dragAxis}
            dragConstraints={dragAxis === "x" ? { left: 0, right: 0 } : { top: 0, bottom: 0 }}
            dragElastic={0.28}
            onDragEnd={(_, info) => closeInDirection(info)}
            initial={{ opacity: 0, x: reduce ? 0 : xStart, y: reduce ? 0 : yStart }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: reduce ? 0 : xStart, y: reduce ? 0 : yStart }}
            transition={reduce ? { duration: 0.16 } : { type: "spring", stiffness: 420, damping: 34, mass: 0.8 }}
            onAnimationStart={() => {
              if (surfaceRef.current) surfaceRef.current.style.willChange = "transform, opacity";
            }}
            onAnimationComplete={() => {
              if (surfaceRef.current) surfaceRef.current.style.willChange = "";
              if (!open) onExitComplete?.();
            }}
            className={`overlay-surface flex max-h-[100dvh] w-full flex-col overflow-y-auto overscroll-contain border backdrop-blur-xl ${theme ? "border-white/10 bg-slate-950/90 text-white" : "border-white/70 bg-white/95 text-neutral-900"} ${side === "right" ? "ml-auto h-full max-w-3xl border-l" : side === "left" ? "mr-auto h-full max-w-3xl border-r" : side === "top" ? "mb-auto max-h-[85dvh] border-b" : "mt-auto max-h-[85dvh] border-t"} ${className}`}
          >
            {(title || description) && (
              <header className="flex shrink-0 items-start justify-between gap-4 p-5">
                <div>
                  {title && <h2 className="text-xl font-bold">{title}</h2>}
                  {description && <p className={`mt-1 text-sm ${theme ? "text-white/60" : "text-neutral-500"}`}>{description}</p>}
                </div>
                <button type="button" onClick={onClose} aria-label="Close panel" className={`rounded-full px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 ${theme ? "hover:bg-white/10 focus-visible:ring-blue-400" : "hover:bg-neutral-100 focus-visible:ring-red-400"}`}>Close</button>
              </header>
            )}
            {children}
          </m.aside>
        </m.div>
      )}
    </AnimatePresence>,
    portalRoot
  );
}

export function Sheet(props: EdgeOverlayProps) {
  return <EdgeOverlay {...props} side={props.side ?? "bottom"} />;
}

export function Drawer(props: EdgeOverlayProps) {
  return <EdgeOverlay {...props} side={props.side ?? "right"} />;
}

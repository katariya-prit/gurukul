import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";
import { useTheme } from "../theme/ThemeContext";
import { OverlayContext, type ConfirmOptions, type InteractionOrigin, type OverlayRegistration } from "./overlayContext";

export const OVERLAY_Z_INDEX = {
  popover: 1000,
  menu: 1100,
  modal: 1200,
  sheet: 1300,
  toast: 1400,
} as const;

function ConfirmSurface({
  options,
  onResolve,
  register,
}: {
  options: ConfirmOptions;
  onResolve: (confirmed: boolean) => void;
  register: (registration: OverlayRegistration) => () => void;
}) {
  const { theme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const originRef = useRef("50% 50%");

  useLayoutEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    const point = window.__overlayLastInteraction;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (point && Date.now() - point.timestamp < 1000) {
      originRef.current = `${Math.max(0, Math.min(rect.width, point.x - rect.left))}px ${Math.max(0, Math.min(rect.height, point.y - rect.top))}px`;
    } else if (trigger) {
      const triggerRect = trigger.getBoundingClientRect();
      originRef.current = `${Math.max(0, Math.min(rect.width, triggerRect.left + triggerRect.width / 2 - rect.left))}px ${Math.max(0, Math.min(rect.height, triggerRect.top + triggerRect.height / 2 - rect.top))}px`;
    }
  }, []);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const unregister = register({
      id: "overlay-confirm-dialog",
      element: surfaceRef.current,
      trigger: window.__overlayLastInteraction?.target instanceof HTMLElement
        ? window.__overlayLastInteraction.target
        : previousFocus,
      modal: true,
      onEscape: () => onResolve(false),
      onOutside: () => onResolve(false),
    });
    surfaceRef.current?.querySelector<HTMLElement>("button:not([disabled])")?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !surfaceRef.current) return;
      const focusable = surfaceRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
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
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      unregister();
      previousFocus?.focus();
    };
  }, [onResolve, register]);

  const reduce = shouldReduceMotion === true;
  return (
    <m.div
      className="overlay-scrim fixed inset-0 z-[1200] flex items-center justify-center bg-black/45 p-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0.12 : 0.18 }}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onResolve(false);
      }}
    >
      <m.section
        ref={surfaceRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="overlay-confirm-title"
        aria-describedby="overlay-confirm-message"
        initial={{ opacity: 0, scale: reduce ? 1 : 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: reduce ? 1 : 0.96 }}
        transition={
          reduce
            ? { duration: 0.16 }
            : { type: "spring", stiffness: 420, damping: 34, mass: 0.8 }
        }
        style={{ transformOrigin: originRef.current }}
        onAnimationStart={() => {
          if (surfaceRef.current) surfaceRef.current.style.willChange = "transform, opacity";
        }}
        onAnimationComplete={() => {
          if (surfaceRef.current) surfaceRef.current.style.willChange = "";
        }}
        className={`overlay-surface w-full max-w-md rounded-3xl border p-6 text-left ${theme ? "border-white/10 bg-slate-950/85 text-white" : "border-white/70 bg-white/90 text-neutral-900"}`}
      >
        <h2 id="overlay-confirm-title" className="text-xl font-bold">{options.title}</h2>
        <p id="overlay-confirm-message" className={`mt-3 text-sm ${theme ? "text-white/65" : "text-neutral-600"}`}>
          {options.message}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => onResolve(false)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 ${theme ? "border-white/15 hover:bg-white/10 focus-visible:ring-blue-400" : "border-neutral-200 hover:bg-neutral-50 focus-visible:ring-red-400"}`}
          >
            {options.cancelLabel ?? "Cancel"}
          </button>
          <button
            type="button"
            onClick={() => onResolve(true)}
            className={`rounded-full px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 ${options.destructive ? "bg-red-600 hover:bg-red-500 focus-visible:ring-red-400" : theme ? "bg-blue-600 hover:bg-blue-500 focus-visible:ring-blue-400" : "bg-red-600 hover:bg-red-500 focus-visible:ring-red-400"}`}
          >
            {options.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </m.section>
    </m.div>
  );
}

declare global {
  interface Window {
    __overlayLastInteraction?: InteractionOrigin;
  }
}

export default function OverlayRoot({ children }: { children: ReactNode }) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [confirmRequest, setConfirmRequest] = useState<{
    options: ConfirmOptions;
    resolve: (confirmed: boolean) => void;
  } | null>(null);
  const stackRef = useRef<OverlayRegistration[]>([]);
  const resolveConfirmRef = useRef<((confirmed: boolean) => void) | null>(null);

  const syncInert = useCallback((stack: OverlayRegistration[]) => {
    const appRoot = document.getElementById("root");
    if (appRoot) appRoot.inert = stack.some((item) => item.modal);
  }, []);

  useLayoutEffect(() => {
    let root = document.getElementById("overlay-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "overlay-root";
      document.body.append(root);
    }
    setPortalRoot(root);
  }, []);

  const register = useCallback((registration: OverlayRegistration) => {
    stackRef.current = [...stackRef.current.filter((item) => item.id !== registration.id), registration];
    syncInert(stackRef.current);
    return () => {
      stackRef.current = stackRef.current.filter((item) => item.id !== registration.id);
      syncInert(stackRef.current);
    };
  }, [syncInert]);

  const update = useCallback((registration: OverlayRegistration) => {
    stackRef.current = stackRef.current.map((item) =>
      item.id === registration.id ? registration : item
    );
    syncInert(stackRef.current);
  }, [syncInert]);

  const getOrigin = useCallback((element: HTMLElement, trigger: HTMLElement | null) => {
    const rect = element.getBoundingClientRect();
    const interaction = window.__overlayLastInteraction;
    if (interaction && Date.now() - interaction.timestamp < 1000) {
      return `${Math.max(0, Math.min(rect.width, interaction.x - rect.left))}px ${Math.max(0, Math.min(rect.height, interaction.y - rect.top))}px`;
    }
    const anchor = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    if (anchor) {
      const anchorRect = anchor.getBoundingClientRect();
      return `${Math.max(0, Math.min(rect.width, anchorRect.left + anchorRect.width / 2 - rect.left))}px ${Math.max(0, Math.min(rect.height, anchorRect.top + anchorRect.height / 2 - rect.top))}px`;
    }
    return "50% 50%";
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => {
    resolveConfirmRef.current?.(false);
    resolveConfirmRef.current = resolve;
    setConfirmRequest({ options, resolve });
  }), []);

  useEffect(() => {
    const rememberPointer = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return;
      window.__overlayLastInteraction = {
        x: event.clientX,
        y: event.clientY,
        target: event.target,
        timestamp: Date.now(),
      };
    };
    const rememberKey = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (!(event.target instanceof HTMLElement)) return;
      const rect = event.target.getBoundingClientRect();
      window.__overlayLastInteraction = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        target: event.target,
        timestamp: Date.now(),
      };
    };
    const handleTopEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const top = stackRef.current.at(-1);
      if (!top) return;
      event.preventDefault();
      event.stopPropagation();
      top.onEscape();
    };
    const handleTopOutside = (event: PointerEvent) => {
      const top = stackRef.current.at(-1);
      if (!top || !(event.target instanceof Node)) return;
      if (top.element?.contains(event.target) || top.trigger?.contains(event.target)) return;
      top.onOutside();
    };
    document.addEventListener("pointerdown", rememberPointer, { capture: true, passive: true });
    document.addEventListener("pointerdown", handleTopOutside, true);
    document.addEventListener("keydown", rememberKey, true);
    document.addEventListener("keydown", handleTopEscape, true);
    return () => {
      document.removeEventListener("pointerdown", rememberPointer, true);
      document.removeEventListener("pointerdown", handleTopOutside, true);
      document.removeEventListener("keydown", rememberKey, true);
      document.removeEventListener("keydown", handleTopEscape, true);
    };
  }, []);

  useEffect(() => {
    if (!confirmRequest) return;
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
    };
  }, [confirmRequest]);

  const value = useMemo(
    () => ({ portalRoot, register, update, getOrigin, confirm }),
    [portalRoot, register, update, getOrigin, confirm]
  );

  const resolveConfirm = useCallback((confirmed: boolean) => {
    confirmRequest?.resolve(confirmed);
    resolveConfirmRef.current = null;
    setConfirmRequest(null);
  }, [confirmRequest]);

  return (
    <OverlayContext.Provider value={value}>
      <LazyMotion features={domAnimation}>
        {children}
        {portalRoot && createPortal(
          <AnimatePresence>
            {confirmRequest && (
              <ConfirmSurface
                key="overlay-confirm-dialog"
                options={confirmRequest.options}
                onResolve={resolveConfirm}
                register={register}
              />
            )}
          </AnimatePresence>,
          portalRoot
        )}
      </LazyMotion>
    </OverlayContext.Provider>
  );
}

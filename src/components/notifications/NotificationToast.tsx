import { useCallback, useEffect, useRef, useState, type FocusEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../context/NotificationContext";
import type { NotificationItem } from "../../services/notificationService";
import NotificationCard from "./NotificationCard";
import { Popover } from "../overlay/OverlayPrimitives";

const TOAST_DURATION = 6000;

export default function NotificationToast() {
    const {
        bellAnchor,
        dismissToast,
        isCenterOpen,
        latestToast,
        markRead,
    } = useNotifications();
    const navigate = useNavigate();
    const anchorRef = useRef<HTMLElement | null>(null);
    anchorRef.current = bellAnchor;
    const [hoveredToastId, setHoveredToastId] = useState<string | null>(null);
    const [focusedToastId, setFocusedToastId] = useState<string | null>(null);
    const remainingRef = useRef(TOAST_DURATION);
    const isHovered = latestToast?.id === hoveredToastId;
    const isFocused = latestToast?.id === focusedToastId;

    useEffect(() => {
        remainingRef.current = TOAST_DURATION;
    }, [latestToast?.id]);

    useEffect(() => {
        if (!latestToast || isCenterOpen || isHovered || isFocused) {
            return;
        }

        const startedAt = Date.now();
        const timeout = window.setTimeout(
            () => dismissToast(latestToast.id),
            remainingRef.current
        );

        return () => {
            window.clearTimeout(timeout);
            remainingRef.current = Math.max(
                0,
                remainingRef.current - (Date.now() - startedAt)
            );
        };
    }, [dismissToast, isCenterOpen, isFocused, isHovered, latestToast]);

    const handleActivate = useCallback(
        (notification: NotificationItem) => {
            void markRead(notification.id).catch((error: unknown) => {
                console.warn("Unable to mark notification as read", error);
            });
            dismissToast(notification.id);

            if (!notification.link) {
                return;
            }

            if (/^https?:\/\//i.test(notification.link)) {
                window.location.assign(notification.link);
            } else {
                navigate(notification.link);
            }
        },
        [dismissToast, markRead, navigate]
    );

    const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
        const nextFocusedElement = event.relatedTarget;
        if (
            !(nextFocusedElement instanceof Node) ||
            !event.currentTarget.contains(nextFocusedElement)
        ) {
            setFocusedToastId(null);
        }
    };

    if (!bellAnchor || !latestToast || isCenterOpen) {
        return null;
    }

    return (
        <Popover
            open
            onClose={() => dismissToast(latestToast.id)}
            anchorRef={anchorRef}
            placement="bottom-end"
            ariaLabel="Latest notification"
            closeOnOutside={false}
            className="w-[min(360px,calc(100vw-24px))]"
        >
            <div
                role="status"
                aria-live="polite"
                onPointerEnter={() => setHoveredToastId(latestToast.id)}
                onPointerLeave={() => setHoveredToastId(null)}
                onFocusCapture={() => setFocusedToastId(latestToast.id)}
                onBlurCapture={handleBlur}
                className="pointer-events-auto"
            >
                <NotificationCard
                    notification={latestToast}
                    unread={!latestToast.isRead}
                    toast
                    onActivate={handleActivate}
                    onDismiss={dismissToast}
                />
            </div>
        </Popover>
    );
}

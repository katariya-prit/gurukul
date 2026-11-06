import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLocation, useNavigate } from "react-router-dom";
import { useNotifications } from "../../context/NotificationContext";
import type { NotificationItem } from "../../services/notificationService";
import { useTheme } from "../theme/ThemeContext";
import NotificationCard from "./NotificationCard";
import { Popover } from "../overlay/OverlayPrimitives";

const MAX_NOTIFICATION_AGE_MS = 2 * 24 * 60 * 60 * 1000;

export default function NotificationCenter() {
    const {
        bellAnchor,
        closeCenter,
        isCenterOpen,
        markAllRead,
        markRead,
        notifications,
        unreadCount,
    } = useNotifications();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const anchorRef = useRef<HTMLElement | null>(null);
    anchorRef.current = bellAnchor;
    const scrollRef = useRef<HTMLDivElement>(null);
    const [currentTime, setCurrentTime] = useState<number | null>(null);
    const previousLocationRef = useRef(
        `${location.pathname}${location.search}${location.hash}`
    );
    const shouldReduceMotion = useReducedMotion();
    const reduceMotion = shouldReduceMotion === true;
    const recentNotifications =
        currentTime === null
            ? []
            : notifications.filter((notification) => {
                  const createdAt = new Date(notification.createdAt).getTime();
                  const age = currentTime - createdAt;
                  return (
                      Number.isFinite(createdAt) &&
                      age >= 0 &&
                      age <= MAX_NOTIFICATION_AGE_MS
                  );
              });

    useEffect(() => {
        const updateCurrentTime = () => setCurrentTime(Date.now());
        updateCurrentTime();
        const interval = window.setInterval(updateCurrentTime, 60_000);
        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        const currentLocation = `${location.pathname}${location.search}${location.hash}`;
        if (previousLocationRef.current !== currentLocation) {
            previousLocationRef.current = currentLocation;
            closeCenter();
        }
    }, [closeCenter, location.hash, location.pathname, location.search]);

    const handleActivate = useCallback(
        (notification: NotificationItem) => {
            void markRead(notification.id).catch((error: unknown) => {
                console.warn("Unable to mark notification as read", error);
            });
            closeCenter();

            if (!notification.link) {
                return;
            }

            if (/^https?:\/\//i.test(notification.link)) {
                window.location.assign(notification.link);
            } else {
                navigate(notification.link);
            }
        },
        [closeCenter, markRead, navigate]
    );

    const handleMarkAllRead = useCallback(() => {
        void markAllRead().catch((error: unknown) => {
            console.warn("Unable to mark all notifications as read", error);
        });
    }, [markAllRead]);

    if (!bellAnchor) {
        return null;
    }

    const visibleCardCount = Math.min(recentNotifications.length || 1, 6);
    const contentHeight = visibleCardCount * 76 + Math.max(0, visibleCardCount - 1) * 10;
    const scrollPadding = 16;
    const panelChrome = 52;
    const availableHeight = Math.max(
        0,
        window.innerHeight - bellAnchor.getBoundingClientRect().bottom - 24
    );
    const maxContentHeight = Math.min(
        506,
        Math.max(0, availableHeight - panelChrome - scrollPadding)
    );

    return (
        <Popover
            open={isCenterOpen}
            onClose={closeCenter}
            anchorRef={anchorRef}
            placement="bottom-end"
            role="dialog"
            ariaLabel="Notifications"
            className="w-[min(360px,calc(100vw-24px))] overflow-hidden p-3"
        >
                            <section
                            className="text-inherit"
                        >
                            <div className="mb-2 flex min-h-5 items-center justify-between gap-3 px-1">
                                <h2 className="text-sm font-semibold">Notifications</h2>
                                {unreadCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleMarkAllRead}
                                        className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                                            theme
                                                ? "text-blue-300 hover:bg-neutral-800 hover:text-blue-200"
                                                : "text-red-600 hover:bg-red-50 hover:text-red-700"
                                        }`}
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                            <div
                                ref={scrollRef}
                                className="no-scrollbar flex flex-col gap-2.5 overflow-y-auto overscroll-contain p-2"
                                style={{
                                    maxHeight: maxContentHeight,
                                    height: Math.min(contentHeight, maxContentHeight),
                                    boxSizing: "content-box",
                                    scrollBehavior: "smooth",
                                    scrollSnapType: "y proximity",
                                    scrollbarWidth: "none",
                                    WebkitMaskImage:
                                        "linear-gradient(transparent 0, black 20px, black calc(100% - 28px), transparent 100%)",
                                    maskImage:
                                        "linear-gradient(transparent 0, black 20px, black calc(100% - 28px), transparent 100%)",
                                }}
                            >
                                {recentNotifications.length === 0 ? (
                                    <div
                                        className={`flex h-[76px] shrink-0 flex-col items-center justify-center rounded-xl text-center ${
                                            theme
                                                ? "text-white"
                                                : "text-neutral-900"
                                        }`}
                                    >
                                        <span className="text-[13px] font-semibold">
                                            You're all caught up
                                        </span>
                                        <span
                                            className={`text-xs ${
                                                theme ? "text-white/60" : "text-neutral-500"
                                            }`}
                                        >
                                            New notifications will appear here.
                                        </span>
                                    </div>
                                ) : (
                                    <AnimatePresence>
                                        {recentNotifications.map((notification, index) => (
                                            <motion.div
                                                key={notification.id}
                                                layout={!reduceMotion}
                                                initial={{
                                                    opacity: reduceMotion ? 0 : index < 6 ? 0 : 0.4,
                                                    y: reduceMotion ? 0 : index < 6 ? -14 : 10,
                                                    scale: reduceMotion ? 1 : index < 6 ? 0.96 : 0.97,
                                                }}
                                                animate={{
                                                    opacity: 0.4,
                                                    y: reduceMotion ? 0 : 10,
                                                    scale: reduceMotion ? 1 : 0.97,
                                                }}
                                                whileInView={{
                                                    opacity: 1,
                                                    y: 0,
                                                    scale: 1,
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    y: reduceMotion ? 0 : -8,
                                                    scale: reduceMotion ? 1 : 0.98,
                                                }}
                                                viewport={{
                                                    root: scrollRef,
                                                    amount: 0.4,
                                                }}
                                                transition={
                                                    reduceMotion
                                                        ? { duration: 0.15, delay: index < 6 ? index * 0.04 : 0 }
                                                        : {
                                                              type: "spring",
                                                              stiffness: 360,
                                                              damping: 30,
                                                              delay: index < 6 ? index * 0.04 : 0,
                                                          }
                                                }
                                                className="shrink-0 snap-start"
                                            >
                                                <NotificationCard
                                                    notification={notification}
                                                    unread={!notification.isRead}
                                                    onActivate={handleActivate}
                                                />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </div>
                            </section>
        </Popover>
    );
}

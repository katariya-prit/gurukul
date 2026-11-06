import { useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLocation, useNavigate } from "react-router-dom";
import { HiOutlineBellAlert } from "react-icons/hi2";
import { useNotifications } from "../../context/NotificationContext";
import type { NotificationItem } from "../../services/notificationService";
import { useTheme } from "../theme/ThemeContext";
import NotificationCard from "./NotificationCard";

const MAX_NOTIFICATION_AGE_MS = 2 * 24 * 60 * 60 * 1000;

export default function NotificationCenter() {
    const {
        closeCenter,
        markAllRead,
        markRead,
        notifications,
        unreadCount,
    } = useNotifications();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const scrollRef = useRef<HTMLDivElement>(null);
    const shouldReduceMotion = useReducedMotion();
    const reduceMotion = shouldReduceMotion === true;
    const previousLocationRef = useRef(
        `${location.pathname}${location.search}${location.hash}`
    );
    const currentTime = Date.now();
    const recentNotifications = notifications.filter((notification) => {
        const createdAt = new Date(notification.createdAt).getTime();
        const age = currentTime - createdAt;
        return (
            Number.isFinite(createdAt) &&
            age >= 0 &&
            age <= MAX_NOTIFICATION_AGE_MS
        );
    });

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

    const visibleCardCount = Math.min(recentNotifications.length || 1, 6);
    const contentHeight = visibleCardCount * 76 + Math.max(0, visibleCardCount - 1) * 10;
    const maxContentHeight = Math.min(
        506,
        Math.max(180, window.innerHeight - 220)
    );

    return (
        <section
            className={`w-full rounded-[20px] border shadow-2xl backdrop-blur-md p-3 ${theme
                    ? "bg-slate-900/90 border-white/10 text-slate-100"
                    : "bg-white/95 border-slate-200 text-slate-800"
                }`}
        >
            <div className="mb-2 flex min-h-5 items-center justify-between gap-3 px-1 pt-1">
                <h2 className={`text-sm font-semibold ${theme ? "text-white" : "text-slate-900"}`}>
                    Notifications
                </h2>
                {unreadCount > 0 && (
                    <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${theme
                                ? "text-blue-300 hover:bg-white/10 hover:text-blue-200"
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
                        className={`flex h-[160px] shrink-0 flex-col items-center justify-center gap-2 rounded-xl text-center ${theme ? "text-white" : "text-neutral-900"
                            }`}
                    >
                        <span
                            className={`flex h-11 w-11 items-center justify-center rounded-full ${theme ? "bg-blue-500/15 text-blue-300" : "bg-red-500/10 text-red-500"
                                }`}
                        >
                            <HiOutlineBellAlert className="text-xl" />
                        </span>
                        <span className="text-[13px] font-semibold">
                            You're all caught up
                        </span>
                        <span
                            className={`text-xs ${theme ? "text-white/60" : "text-neutral-500"
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
    );
}
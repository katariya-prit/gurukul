import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import {
    getNotifications,
    markAllNotificationsRead,
    markNotificationRead,
    type NotificationItem,
} from "../services/notificationService";
import { useNotificationStream } from "../hooks/useNotificationStream";

interface NotificationContextValue {
    notifications: NotificationItem[];
    unreadCount: number;
    isLoading: boolean;
    latestToast: NotificationItem | null;
    isCenterOpen: boolean;
    bellAnchor: HTMLElement | null;
    setBellAnchor: (element: HTMLElement | null) => void;
    markRead: (id: string) => Promise<void>;
    markAllRead: () => Promise<void>;
    dismissToast: (id: string) => void;
    refresh: () => Promise<void>;
    openCenter: () => void;
    closeCenter: () => void;
    toggleCenter: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

function getStoredUserId(): string | undefined {
    try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
            return undefined;
        }

        const user: unknown = JSON.parse(storedUser);
        if (typeof user === "object" && user !== null && "id" in user) {
            const id = user.id;
            if (typeof id === "string" || typeof id === "number") {
                return String(id);
            }
        }
    } catch (error: unknown) {
        console.warn("Unable to read the notification user id", error);
    }

    return undefined;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [userId] = useState(getStoredUserId);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [latestToast, setLatestToast] = useState<NotificationItem | null>(null);
    const [isCenterOpen, setIsCenterOpen] = useState(false);
    const [bellAnchor, setBellAnchor] = useState<HTMLElement | null>(null);
    const notificationsRef = useRef<NotificationItem[]>([]);
    const liveIdsRef = useRef(new Set<string>());
    const isCenterOpenRef = useRef(false);
    const unreadCountRef = useRef(0);

    const updateNotifications = useCallback(
        (
            update: (items: NotificationItem[]) => NotificationItem[],
            unreadCountOverride?: number
        ) => {
            const nextNotifications = update(notificationsRef.current);
            const nextUnreadCount =
                unreadCountOverride ?? nextNotifications.filter((item) => !item.isRead).length;
            notificationsRef.current = nextNotifications;
            setNotifications(nextNotifications);
            unreadCountRef.current = nextUnreadCount;
            setUnreadCount(nextUnreadCount);
        },
        []
    );

    const refresh = useCallback(async () => {
        if (!userId) {
            updateNotifications(() => []);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const fetched = await getNotifications();
            const fetchedIds = new Set(fetched.notifications.map(({ id }) => id));
            const recentLiveNotifications = notificationsRef.current.filter(
                (item) => liveIdsRef.current.has(item.id) && !fetchedIds.has(item.id)
            );
            updateNotifications(
                () => [...recentLiveNotifications, ...fetched.notifications],
                fetched.unreadCount
            );
        } finally {
            setIsLoading(false);
        }
    }, [updateNotifications, userId]);

    const handleIncomingNotification = useCallback(
        (notification: NotificationItem) => {
            if (notificationsRef.current.some(({ id }) => id === notification.id)) {
                return;
            }

            liveIdsRef.current.add(notification.id);
            updateNotifications(
                (current) => [notification, ...current],
                unreadCountRef.current + (notification.isRead ? 0 : 1)
            );
            if (!isCenterOpenRef.current) {
                setLatestToast(notification);
            }
        },
        [updateNotifications]
    );

    useNotificationStream(userId, handleIncomingNotification);

    useEffect(() => {
        const loadNotifications = () => {
            void refresh().catch((error: unknown) => {
                console.warn("Unable to load notifications", error);
            });
        };

        loadNotifications();
        if (!userId) {
            return;
        }

        const timer = window.setInterval(loadNotifications, 30_000);
        window.addEventListener("focus", loadNotifications);

        return () => {
            window.clearInterval(timer);
            window.removeEventListener("focus", loadNotifications);
        };
    }, [refresh, userId]);

    const markRead = useCallback(
        async (id: string) => {
            const previousNotification = notificationsRef.current.find((item) => item.id === id);
            if (!previousNotification || previousNotification.isRead) {
                return;
            }
            const previousUnreadCount = unreadCountRef.current;

            updateNotifications((current) =>
                current.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
                Math.max(0, previousUnreadCount - 1)
            );

            try {
                await markNotificationRead(id);
            } catch (error: unknown) {
                updateNotifications((current) =>
                    current.map((item) =>
                        item.id === id ? { ...item, isRead: previousNotification.isRead } : item
                    ),
                    previousUnreadCount
                );
                throw error;
            }
        },
        [updateNotifications]
    );

    const markAllRead = useCallback(async () => {
        const unreadIds = new Set(
            notificationsRef.current.filter((item) => !item.isRead).map(({ id }) => id)
        );
        if (unreadCountRef.current === 0) {
            return;
        }

        const previousUnreadCount = unreadCountRef.current;
        updateNotifications((current) =>
            current.map((item) =>
                unreadIds.has(item.id) ? { ...item, isRead: true } : item
            ),
            0
        );

        try {
            await markAllNotificationsRead();
        } catch (error: unknown) {
            updateNotifications((current) =>
                current.map((item) =>
                    unreadIds.has(item.id) ? { ...item, isRead: false } : item
                ),
                previousUnreadCount
            );
            throw error;
        }
    }, [updateNotifications]);

    const dismissToast = useCallback((id: string) => {
        setLatestToast((current) => (current?.id === id ? null : current));
    }, []);

    const openCenter = useCallback(() => {
        isCenterOpenRef.current = true;
        setIsCenterOpen(true);
        setLatestToast(null);
        void refresh().catch((error: unknown) => {
            console.warn("Unable to load notifications", error);
        });
    }, [refresh]);

    const closeCenter = useCallback(() => {
        isCenterOpenRef.current = false;
        setIsCenterOpen(false);
        bellAnchor?.focus();
    }, [bellAnchor]);

    const toggleCenter = useCallback(() => {
        if (isCenterOpenRef.current) {
            closeCenter();
        } else {
            openCenter();
        }
    }, [closeCenter, openCenter]);

    const contextValue = useMemo(
        () => ({
            notifications,
            unreadCount,
            isLoading,
            latestToast,
            isCenterOpen,
            bellAnchor,
            setBellAnchor,
            markRead,
            markAllRead,
            dismissToast,
            refresh,
            openCenter,
            closeCenter,
            toggleCenter,
        }),
        [
            notifications,
            unreadCount,
            isLoading,
            latestToast,
            isCenterOpen,
            bellAnchor,
            markRead,
            markAllRead,
            dismissToast,
            refresh,
            openCenter,
            closeCenter,
            toggleCenter,
        ]
    );

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }

    return context;
}

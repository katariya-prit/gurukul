import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

export interface NotificationItem {
    id: string;
    type: string;
    title: string;
    message: string;
    relatedId: number | null;
    isRead: boolean;
    createdAt: string;
    link?: string | null;
    entity_type?: string;
    entity_id?: string;
    route_key?: string;
}

export interface NotificationList {
    notifications: NotificationItem[];
    unreadCount: number;
}

interface ApiErrorResponse {
    message?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function firstValue(record: Record<string, unknown>, keys: string[]): unknown {
    for (const key of keys) {
        if (record[key] !== undefined && record[key] !== null) {
            return record[key];
        }
    }

    return undefined;
}

function asString(value: unknown, fallback = ""): string {
    return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}

function asRelatedId(value: unknown): number | null {
    if (typeof value !== "number" && typeof value !== "string") {
        return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function asReadState(value: unknown): boolean {
    return value === true || value === 1 || value === "1" || value === "true";
}

export function normalizeNotification(value: unknown): NotificationItem | null {
    if (!isRecord(value)) {
        return null;
    }

    const type = asString(firstValue(value, ["type", "notificationType", "notification_type"]));
    const title = asString(value.title);
    const message = asString(value.message);
    const relatedId = asRelatedId(firstValue(value, ["relatedId", "related_id"]));
    const createdAt = asString(
        firstValue(value, ["createdAt", "created_at", "time", "timestamp"])
    );
    const rawId = firstValue(value, ["id", "notificationId", "notification_id"]);
    const normalizedId = rawId === undefined ? "" : String(rawId).trim();
    const stableId =
        normalizedId.length === 0
            ? [type, relatedId ?? "", createdAt, title, message].join(":")
            : normalizedId;
    const rawLink = firstValue(value, ["link", "route", "url", "href"]);
    const entityType = firstValue(value, ["entity_type", "entityType"]);
    const entityId = firstValue(value, ["entity_id", "entityId"]);
    const routeKey = firstValue(value, ["route_key", "routeKey"]);

    return {
        id: stableId,
        type,
        title,
        message,
        relatedId,
        isRead: asReadState(firstValue(value, ["isRead", "is_read", "read"])),
        createdAt,
        link: typeof rawLink === "string" && rawLink.length > 0 ? rawLink : null,
        ...(typeof entityType === "string" ? { entity_type: entityType } : {}),
        ...(typeof entityId === "string" || typeof entityId === "number"
            ? { entity_id: String(entityId) }
            : {}),
        ...(typeof routeKey === "string" ? { route_key: routeKey } : {}),
    };
}

function unwrapNotifications(value: unknown): NotificationList {
    const payload = isRecord(value) && "data" in value ? value.data : value;
    const notifications = (Array.isArray(payload) ? payload : [])
        .map(normalizeNotification)
        .filter((notification): notification is NotificationItem => notification !== null);
    const unreadCount = isRecord(value) ? asRelatedId(value.unread_count) : null;

    return {
        notifications,
        unreadCount: unreadCount ?? notifications.filter(({ isRead }) => !isRead).length,
    };
}

function getErrorMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
        return error.response?.data?.message || error.message || fallback;
    }

    return error instanceof Error ? error.message : fallback;
}

function requestConfig() {
    const token = localStorage.getItem("token");
    return {
        withCredentials: true,
        ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
    };
}

export async function getNotifications(): Promise<NotificationList> {
    try {
        const response = await axios.get<unknown>(`${API_URL}/notifications`, requestConfig());
        return unwrapNotifications(response.data);
    } catch (error: unknown) {
        throw new Error(getErrorMessage(error, "Failed to fetch notifications"), { cause: error });
    }
}

export async function markNotificationRead(id: string): Promise<void> {
    try {
        await axios.put(`${API_URL}/notifications/${encodeURIComponent(id)}/read`, {}, requestConfig());
    } catch (error: unknown) {
        throw new Error(getErrorMessage(error, "Failed to mark notification as read"), { cause: error });
    }
}

export async function markAllNotificationsRead(): Promise<void> {
    try {
        await axios.put(`${API_URL}/notifications/read-all`, {}, requestConfig());
        return;
    } catch (error: unknown) {
        if (!axios.isAxiosError(error) || error.response?.status !== 404) {
            throw new Error(getErrorMessage(error, "Failed to mark notifications as read"), {
                cause: error,
            });
        }
    }

    try {
        let notificationList = await getNotifications();
        while (notificationList.notifications.some((notification) => !notification.isRead)) {
            const unreadIds = notificationList.notifications
                .filter((notification) => !notification.isRead)
                .map(({ id }) => id);
            await Promise.all(unreadIds.map(markNotificationRead));

            notificationList = await getNotifications();
            if (
                notificationList.notifications.some(
                    ({ id, isRead }) => !isRead && unreadIds.includes(id)
                )
            ) {
                throw new Error("Some notifications could not be marked as read");
            }
        }
    } catch (error: unknown) {
        throw new Error(getErrorMessage(error, "Failed to mark notifications as read"), {
            cause: error,
        });
    }
}

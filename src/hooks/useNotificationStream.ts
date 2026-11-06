import { useEffect, useRef } from "react";
import { normalizeNotification, type NotificationItem } from "../services/notificationService";
import { transmitClient } from "../lib/transmitClient";

export function useNotificationStream(
    userId: string | undefined,
    onNewNotification: (notification: NotificationItem) => void
) {
    const callbackRef = useRef(onNewNotification);

    useEffect(() => {
        callbackRef.current = onNewNotification;
    }, [onNewNotification]);

    useEffect(() => {
        if (!userId) {
            return;
        }

        const subscription = transmitClient.subscription(`notifications/${userId}`);
        let isActive = true;
        let isClosed = false;

        const close = () => {
            if (isClosed) {
                return;
            }

            isClosed = true;
            isActive = false;
            const deletion = subscription.delete();
            void deletion.catch((error: unknown) => {
                window.dispatchEvent(
                    new CustomEvent("gurukul:realtime-error", {
                        detail: { source: "notifications", error },
                    })
                );
            });
        };

        void subscription
            .create()
            .then(() => {
                if (!isActive) {
                    return;
                }

                subscription.onMessage((payload: unknown) => {
                    if (!isActive) {
                        return;
                    }

                    const notification = normalizeNotification(payload);
                    if (notification) {
                        callbackRef.current(notification);
                    }
                });
            })
            .catch((error: unknown) => {
                if (isActive) {
                    window.dispatchEvent(
                        new CustomEvent("gurukul:realtime-error", {
                            detail: { source: "notifications", error },
                        })
                    );
                }
            });

        return close;
    }, [userId]);
}

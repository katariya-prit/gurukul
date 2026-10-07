import { useEffect, useRef } from "react";
import { Transmit } from "@adonisjs/transmit-client";
import type { NotificationItem } from "../services/notificationService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

export function useNotificationStream(
    roleCode: string | undefined,
    onNewNotification: (notification: NotificationItem) => void
) {
    const transmitRef = useRef<Transmit | null>(null);

    useEffect(() => {
        if (!roleCode) return;

        const transmit = new Transmit({ baseUrl: API_URL });
        transmitRef.current = transmit;

        const subscription = transmit.subscription(`notifications/${roleCode}`);

        subscription.create().then(() => {
            subscription.onMessage((data: NotificationItem) => {
                onNewNotification(data);
            });
        });

        return () => {
            subscription.delete();
            transmit.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roleCode]);
}
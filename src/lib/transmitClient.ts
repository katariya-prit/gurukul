import { Transmit } from "@adonisjs/transmit-client";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3333").replace(/\/+$/, "");

export const transmitClient = new Transmit({
    baseUrl: API_URL,
    onSubscribeFailed: (response) => {
        console.warn(`[Transmit Client] Subscription failed (${response.status} ${response.statusText})`);
    },
    onSubscription: (channel) => {
        console.log(`[Transmit Client] Successfully subscribed to ${channel}`);
    },
});

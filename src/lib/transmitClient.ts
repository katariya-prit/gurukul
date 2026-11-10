import { Transmit } from "@adonisjs/transmit-client";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3333").replace(/\/+$/, "");

function getAuthToken(): string | null {
    const keys = ["token", "accessToken", "access_token", "authToken", "jwt"];
    for (const k of keys) {
        const t = localStorage.getItem(k);
        if (t) return t.replace(/^Bearer\s+/i, "");
    }
    return null;
}

export const transmitClient = new Transmit({
    baseUrl: API_URL,
    beforeSubscribe: (request) => {
        const token = getAuthToken();
        if (token) {
            request.headers.set("Authorization", `Bearer ${token}`);
        }
    },
    beforeUnsubscribe: (request) => {
        const token = getAuthToken();
        if (token) {
            request.headers.set("Authorization", `Bearer ${token}`);
        }
    },
    onSubscribeFailed: (response) => {
        console.warn(`[Transmit Client] Subscription failed (${response.status} ${response.statusText})`);
    },
    onSubscription: (channel) => {
        console.log(`[Transmit Client] Successfully subscribed to ${channel}`);
    },
});

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

export interface NotificationItem {
    id: number;
    type: string;
    title: string;
    message: string;
    relatedId: number | null;
    isRead: boolean;
    createdAt: string;
}

const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const notificationService = {
    getAll: async (): Promise<{ success: boolean; data: NotificationItem[] }> => {
        try {
            const response = await axios.get(`${API_URL}/notifications`, {
                headers: getAuthHeaders(),
            });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || "Failed to fetch notifications");
        }
    },

    markRead: async (id: number): Promise<{ success: boolean }> => {
        try {
            const response = await axios.put(`${API_URL}/notifications/${id}/read`, {}, {
                headers: getAuthHeaders(),
            });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || "Failed to mark notification as read");
        }
    },
};
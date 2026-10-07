import axios from "axios"
export interface UserData {
    user_id: number;
    name: string;
    email?: string;
    role_code?: string;
    department_id?: number | null;
    section_id?: number | null;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";


export const userService = {
    getAllUsers: async () => {
        try {
            const token = localStorage.getItem("token");

            const res = await axios.get(`${API_URL}/users`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });
            return { success: true, data: res.data?.data ?? res.data };
        } catch (error: any) {
            return { success: false, message: error?.response?.data?.message || "Error fetching users" };
        }
    },

    getUserById: async (userId: number) => {
        try {
            const res = await axios.get(`${API_URL}/users/${userId}`);
            return { success: true, data: res.data?.data ?? res.data };
        } catch (error: any) {
            return { success: false, message: error?.response?.data?.message || "Error fetching user" };
        }
    },

    getUsersBySection: async (sectionId: number) => {
        try {
            const res = await axios.get(`${API_URL}/users/section/${sectionId}`);
            return { success: true, data: res.data?.data ?? res.data?.users ?? res.data };
        } catch (error: any) {
            return { success: false, message: error?.response?.data?.message || "Error fetching users for section" };
        }
    },
};
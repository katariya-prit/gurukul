import api from "./apiClient"
export interface UserData {
    user_id: number;
    name: string;
    email?: string;
    role_code?: string;
    department_id?: number | null;
    section_id?: number | null;
}

export const userService = {
    getAllUsers: async () => {
        try {
            const res = await api.get("/users");
            return { success: true, data: res.data?.data ?? res.data };
        } catch (error: any) {
            return { success: false, message: error?.response?.data?.message || "Error fetching users" };
        }
    },

    getUserById: async (userId: number) => {
        try {
            const res = await api.get(`/users/${userId}`);
            return { success: true, data: res.data?.data ?? res.data };
        } catch (error: any) {
            return { success: false, message: error?.response?.data?.message || "Error fetching user" };
        }
    },

    getUsersBySection: async (sectionId: number) => {
        try {
            const res = await api.get(`/users/section/${sectionId}`);
            return { success: true, data: res.data?.data ?? res.data?.users ?? res.data };
        } catch (error: any) {
            return { success: false, message: error?.response?.data?.message || "Error fetching users for section" };
        }
    },
};
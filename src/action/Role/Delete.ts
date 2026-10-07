import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

export const roleDelete = async (role_code: string) => {
    try {
        const token = localStorage.getItem("token");

        const response = await fetch(
            `${API_URL}/roles/delete/${role_code}`,
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const result = await response.json();

        if (!response.ok) {
            toast.error(result.message || "Role delete failed.");
            return false;
        }

        toast.success(result.message || "Role deleted successfully.");

        return true;
    } catch (error) {
        console.error(error);

        toast.error("Server connection failed.");

        return false;
    }
};
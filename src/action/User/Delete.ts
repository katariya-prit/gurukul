
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

export default async function userDelete(userId: number): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/users/delete/${userId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
            toast.error(result.message || "User deletion failed.");
            return false;
        }

        toast.success(result.message || "User deleted successfully.");
        return true;
    } catch (error: any) {
        console.error("Error deleting user:", error);
        toast.error("Server connection failed.");
        return false;
    }
}

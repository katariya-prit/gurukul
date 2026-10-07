import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

export default async function departmentDelete(departmentId: number): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/departments/delete/${departmentId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            toast.error(result.message || "Failed to delete department");
            return false;
        }

        toast.success(result.message || "Department deleted successfully.");
        return true;
    } catch (error) {
        console.error("Department delete error:", error);
        toast.error("Something went wrong while deleting.");
        return false;
    }
}

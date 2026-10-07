import { toast } from "sonner";

export interface DepartmentData {
  departmentId: number;
  departmentName: string;
  departmentHeadId: number | null;
  departmentHeadName: string | null;
  description: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

// 🎯 FIX: token header banavva mate helper function
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// mapDepartment ni jarur j nathi have - backend already camelCase pathave chhe
export const getDepartments = async (): Promise<DepartmentData[]> => {
  try {
    const response = await fetch(`${API_URL}/departments`, {
      headers: getAuthHeaders(), // 🎯 FIX
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to fetch departments");
    }

    if (!Array.isArray(result.data)) {
      return [];
    }

    return result.data;   // 👈 direct return, mapping ni jarur nathi
  } catch (error) {
    console.error("getDepartments error:", error);
    toast.error("Failed to fetch departments.");
    throw error;
  }
};

export const getDepartmentById = async (departmentId: number): Promise<DepartmentData | null> => {
  try {
    const response = await fetch(`${API_URL}/departments/${departmentId}`, {
      headers: getAuthHeaders(), // 🎯 FIX
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Department not found");
    }

    return result.data ?? null;   // 👈 direct return
  } catch (error) {
    console.error("getDepartmentById error:", error);
    toast.error("Failed to load department details.");
    throw error;
  }
};

export const deleteDepartment = async (departmentId: number): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/departments/delete/${departmentId}`, {
      method: "DELETE",
      headers: getAuthHeaders(), // 🎯 FIX
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to delete department");
    }

    toast.success(result.message || "Department deleted successfully.");
    return true;
  } catch (error) {
    console.error("deleteDepartment error:", error);
    toast.error(error instanceof Error ? error.message : "Something went wrong while deleting.");
    return false;
  }
};
import { Navigate, Outlet } from "react-router-dom";
import type { AuthUser } from "../../Types/Role-create";

function getStoredUser(): AuthUser | null {
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    try {
        const parsed: unknown = JSON.parse(stored);
        if (typeof parsed === "object" && parsed !== null && "roleCode" in parsed && typeof parsed.roleCode === "string") {
            return parsed as AuthUser;
        }
        return null;
    } catch {
        return null;
    }
}

export default function FunctionalityManagerGuard() {
    const user = getStoredUser();
    if (!user) return <Navigate to="/login" replace />;

    const rawPermissions = typeof user.permissions === "string"
        ? (() => {
            try {
                return JSON.parse(user.permissions) as Record<string, Record<string, boolean>>;
            } catch {
                return {} as Record<string, Record<string, boolean>>;
            }
        })()
        : user.permissions as Record<string, Record<string, boolean>> | undefined;

    const hasFunctionalityAccess = Boolean(
        user.roleCode === "SUPER_ADMIN" ||
            rawPermissions?.Functionality?.view ||
            rawPermissions?.Functionality?.create ||
            rawPermissions?.Functionality?.edit ||
            rawPermissions?.Functionality?.delete
    );

    if (!hasFunctionalityAccess) return <Navigate to="/dashboard" replace />;
    return <Outlet />;
}

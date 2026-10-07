import type { AuthUser } from "../../../Types/Role-create";

export type PermissionAction = "view" | "create" | "edit" | "delete";

/**
 * SUPER_ADMIN ne hammesha badhu access chhe.
 * Baki roles mate user.permissions JSON ma module.action check thay chhe.
 */
export function hasAccess(
    user: AuthUser | null,
    module: string,
    action: PermissionAction
): boolean {
    if (user?.roleCode === "SUPER_ADMIN") return true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userPerms: any = user?.permissions;
    if (userPerms && typeof userPerms === "object") {
        return !!userPerms[module]?.[action];
    }
    return false;
}

/**
 * Navbar ma bar-bar "hasAccess(user, ...)" na lakhvu pade mate —
 * ek vaar user bind karine curried function pacho male chhe.
 */
export function createPermissionChecker(user: AuthUser | null) {
    return (module: string, action: PermissionAction) => hasAccess(user, module, action);
}
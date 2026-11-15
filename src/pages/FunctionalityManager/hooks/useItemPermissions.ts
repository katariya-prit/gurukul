import { useCallback, useEffect, useState } from "react";
import { functionalityManagerService } from "../services/functionalityManagerService";
import type { ItemPermissions, PermissionOption } from "../types";

export function useItemPermissions(itemId: number) {
    const [permissions, setPermissions] = useState<ItemPermissions>({ roleCodes: [], sectionIds: [], userSuids: [] });
    const [options, setOptions] = useState<{ roles: PermissionOption[]; sections: PermissionOption[]; users: PermissionOption[] }>({
        roles: [],
        sections: [],
        users: [],
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [savedPermissions, permissionOptions] = await Promise.all([
                functionalityManagerService.getItemPermissions(itemId),
                functionalityManagerService.getPermissionOptions(),
            ]);
            setPermissions(savedPermissions);
            setOptions(permissionOptions);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Could not load item permissions.");
        } finally {
            setLoading(false);
        }
    }, [itemId]);

    useEffect(() => {
        void reload();
    }, [reload]);

    const save = async () => {
        setSaving(true);
        try {
            setPermissions(await functionalityManagerService.savePermissions(itemId, permissions));
        } finally {
            setSaving(false);
        }
    };

    return { permissions, setPermissions, options, loading, saving, error, reload, save };
}

import { useCallback, useEffect, useState } from "react";
import { functionalityManagerService } from "../services/functionalityManagerService";
import type { ItemLevel, PromoteMode } from "../types";

export function useLevels(itemId: number) {
    const [levels, setLevels] = useState<ItemLevel[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setLevels(await functionalityManagerService.getLevels(itemId));
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Could not load levels.");
        } finally {
            setLoading(false);
        }
    }, [itemId]);

    useEffect(() => {
        void reload();
    }, [reload]);

    const save = async (values: Array<{ levelNo: number; name: string; minPoints: number; promoteMode: PromoteMode }>) => {
        setSaving(true);
        try {
            const result = await functionalityManagerService.saveLevels(itemId, values);
            setLevels(result);
        } finally {
            setSaving(false);
        }
    };

    return { levels, setLevels, loading, saving, error, reload, save };
}

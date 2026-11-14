import { useCallback, useEffect, useState } from "react";
import { functionalityManagerService } from "../services/functionalityManagerService";
import type { ItemRubric, RubricCriterion } from "../types";

export function useRubric(itemId: number) {
    const [versions, setVersions] = useState<ItemRubric[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setVersions(await functionalityManagerService.getRubrics(itemId));
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Could not load rubric versions.");
        } finally {
            setLoading(false);
        }
    }, [itemId]);

    useEffect(() => {
        void reload();
    }, [reload]);

    const save = async (criteria: RubricCriterion[]) => {
        setSaving(true);
        try {
            await functionalityManagerService.saveRubric(itemId, criteria);
            await reload();
        } finally {
            setSaving(false);
        }
    };

    return { versions, current: versions.find((rubric) => rubric.isCurrent) ?? versions[0] ?? null, loading, saving, error, reload, save };
}

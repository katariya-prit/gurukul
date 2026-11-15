import { useCallback, useEffect, useState } from "react";
import { functionalityManagerService } from "../services/functionalityManagerService";
import type { FunctionalityItem, ItemInput } from "../types";

export function useItems(filters: { functionalityId?: number; departmentId?: number }) {
    const [items, setItems] = useState<FunctionalityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const functionalityId = filters.functionalityId;
    const departmentId = filters.departmentId;

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setItems(await functionalityManagerService.getItems({ functionalityId, departmentId }));
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Could not load items.");
        } finally {
            setLoading(false);
        }
    }, [departmentId, functionalityId]);

    useEffect(() => {
        void reload();
    }, [reload]);

    const save = async (input: ItemInput, id?: number) => {
        const saved = await functionalityManagerService.saveItem(input, id);
        await reload();
        return saved;
    };

    const setActive = async (id: number, isActive: boolean) => {
        const original = items.find((item) => item.id === id);
        setItems((current) => current.map((item) => item.id === id ? { ...item, isActive } : item));
        try {
            await functionalityManagerService.setItemActive(id, isActive);
        } catch (toggleError) {
            if (original) setItems((current) => current.map((item) => item.id === id ? original : item));
            throw toggleError;
        }
    };

    return { items, loading, error, reload, save, setActive };
}

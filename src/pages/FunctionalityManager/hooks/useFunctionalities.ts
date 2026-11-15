import { useCallback, useEffect, useState } from "react";
import { functionalityManagerService } from "../services/functionalityManagerService";
import type { Functionality, FunctionalityInput } from "../types";

export function useFunctionalities() {
    const [functionalities, setFunctionalities] = useState<Functionality[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setFunctionalities(await functionalityManagerService.getFunctionalities());
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Could not load functionalities.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void reload();
    }, [reload]);

    const save = async (input: FunctionalityInput, id?: number) => {
        const saved = await functionalityManagerService.saveFunctionality(input, id);
        await reload();
        return saved;
    };

    const setActive = async (id: number, isActive: boolean) => {
        const original = functionalities.find((entry) => entry.id === id);
        setFunctionalities((current) => current.map((entry) => entry.id === id ? { ...entry, isActive } : entry));
        try {
            await functionalityManagerService.setFunctionalityActive(id, isActive);
        } catch (toggleError) {
            if (original) {
                setFunctionalities((current) => current.map((entry) => entry.id === id ? original : entry));
            }
            throw toggleError;
        }
    };

    return {
        functionalities,
        loading,
        error,
        reload,
        save,
        setActive,
        mockMode: functionalityManagerService.isMockMode(),
    };
}

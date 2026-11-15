import { useCallback, useEffect, useState } from "react";
import { functionalityManagerService } from "../services/functionalityManagerService";
import type { DashboardWidget, WidgetInput } from "../types";

export function useWidgets() {
    const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setWidgets(await functionalityManagerService.getWidgets());
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Could not load widgets.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void reload();
    }, [reload]);

    const save = async (input: WidgetInput, id?: number) => {
        await functionalityManagerService.saveWidget(input, id);
        await reload();
    };

    const remove = async (id: number) => {
        await functionalityManagerService.deleteWidget(id);
        await reload();
    };

    return { widgets, loading, error, reload, save, remove };
}

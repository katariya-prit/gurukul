import { useEffect, useState, useCallback, useMemo } from "react";
import { functionalityManagerService } from "../../../FunctionalityManager/services/functionalityManagerService";
import type {
    Functionality,
    DepartmentFunctionalityItemAssignment,
} from "../../../FunctionalityManager/types";

export interface SelectedFunctionalityItem {
    functionality: Functionality;
    itemLabel: string;
    isInactive?: boolean;
}

export type SelectedFunctionalityMap = Record<number, SelectedFunctionalityItem>;

interface UseDepartmentFunctionalitiesSelectResult {
    loading: boolean;
    error: string | null;
    isForbidden: boolean;
    functionalities: Functionality[];
    selectedMap: SelectedFunctionalityMap;
    labelErrors: Record<number, string>;
    hasSelection: boolean;
    isDirty: boolean;
    setSelectedMap: React.Dispatch<React.SetStateAction<SelectedFunctionalityMap>>;
    toggleFunctionality: (functionality: Functionality) => void;
    removeFunctionality: (functionalityId: number) => void;
    updateItemLabel: (functionalityId: number, itemLabel: string) => void;
    selectAll: (subset?: Functionality[]) => void;
    clearAll: (subset?: Functionality[]) => void;
    validate: () => boolean;
    buildPayload: () => DepartmentFunctionalityItemAssignment[];
    reload: () => Promise<void>;
}

export function useDepartmentFunctionalitiesSelect(
    departmentId?: number
): UseDepartmentFunctionalitiesSelectResult {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isForbidden, setIsForbidden] = useState(false);
    const [functionalities, setFunctionalities] = useState<Functionality[]>([]);
    const [selectedMap, setSelectedMap] = useState<SelectedFunctionalityMap>({});
    const [initialEnabledMap, setInitialEnabledMap] = useState<Record<number, { isEnabled: boolean; itemLabel: string }>>({});
    const [labelErrors, setLabelErrors] = useState<Record<number, string>>({});

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        setIsForbidden(false);

        try {
            const allFuncs: Functionality[] = await functionalityManagerService.getFunctionalities();
            const activeOnly = allFuncs.filter((f: Functionality) => f.isActive);
            setFunctionalities(activeOnly);

            if (departmentId && Number.isInteger(departmentId) && departmentId > 0) {
                const assigned = await functionalityManagerService.getFunctionalitiesByDepartment(departmentId);
                const initialMap: Record<number, { isEnabled: boolean; itemLabel: string }> = {};
                const preselected: SelectedFunctionalityMap = {};

                for (const assignment of assigned) {
                    initialMap[assignment.functionalityId] = {
                        isEnabled: assignment.isEnabled,
                        itemLabel: assignment.itemLabel || "Item",
                    };

                    if (assignment.isEnabled) {
                        const matchedFunc = allFuncs.find((f: Functionality) => f.id === assignment.functionalityId);
                        const func: Functionality = matchedFunc ?? {
                            id: assignment.functionalityId,
                            key: `functionality_${assignment.functionalityId}`,
                            name: `Functionality #${assignment.functionalityId}`,
                            description: null,
                            icon: "puzzle",
                            themeColor: "#64748b",
                            evaluatorType: "teacher",
                            isActive: false,
                            departmentCount: 0,
                            itemCount: 0,
                        };

                        preselected[assignment.functionalityId] = {
                            functionality: func,
                            itemLabel: assignment.itemLabel || "Item",
                            isInactive: matchedFunc ? !matchedFunc.isActive : true,
                        };
                    }
                }

                setInitialEnabledMap(initialMap);
                setSelectedMap(preselected);
            } else {
                setInitialEnabledMap({});
                setSelectedMap({});
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to load functionalities.";
            if (
                message.includes("403") ||
                message.toLowerCase().includes("forbidden") ||
                (typeof err === "object" && err !== null && "status" in err && err.status === 403)
            ) {
                setIsForbidden(true);
            } else {
                setError(message);
            }
        } finally {
            setLoading(false);
        }
    }, [departmentId]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const toggleFunctionality = useCallback((functionality: Functionality) => {
        setSelectedMap((prev) => {
            const next = { ...prev };
            if (next[functionality.id]) {
                delete next[functionality.id];
            } else {
                next[functionality.id] = {
                    functionality,
                    itemLabel: "Item",
                    isInactive: !functionality.isActive,
                };
            }
            return next;
        });
        setLabelErrors((prev) => {
            if (prev[functionality.id]) {
                const next = { ...prev };
                delete next[functionality.id];
                return next;
            }
            return prev;
        });
    }, []);

    const removeFunctionality = useCallback((functionalityId: number) => {
        setSelectedMap((prev) => {
            const next = { ...prev };
            delete next[functionalityId];
            return next;
        });
        setLabelErrors((prev) => {
            if (prev[functionalityId]) {
                const next = { ...prev };
                delete next[functionalityId];
                return next;
            }
            return prev;
        });
    }, []);

    const updateItemLabel = useCallback((functionalityId: number, itemLabel: string) => {
        setSelectedMap((prev) => {
            const current = prev[functionalityId];
            if (!current) return prev;
            return {
                ...prev,
                [functionalityId]: {
                    ...current,
                    itemLabel,
                },
            };
        });
        if (itemLabel.trim().length > 0) {
            setLabelErrors((prev) => {
                if (prev[functionalityId]) {
                    const next = { ...prev };
                    delete next[functionalityId];
                    return next;
                }
                return prev;
            });
        }
    }, []);

    const selectAll = useCallback((subset?: Functionality[]) => {
        const targetList = subset && subset.length > 0 ? subset : functionalities;
        setSelectedMap((prev) => {
            const next = { ...prev };
            for (const func of targetList) {
                if (!next[func.id]) {
                    next[func.id] = {
                        functionality: func,
                        itemLabel: "Item",
                        isInactive: !func.isActive,
                    };
                }
            }
            return next;
        });
    }, [functionalities]);

    const clearAll = useCallback((subset?: Functionality[]) => {
        const targetList = subset && subset.length > 0 ? subset : functionalities;
        const targetIds = new Set(targetList.map((f) => f.id));
        setSelectedMap((prev) => {
            const next: SelectedFunctionalityMap = {};
            for (const [idStr, item] of Object.entries(prev)) {
                const id = Number(idStr);
                if (!targetIds.has(id)) {
                    next[id] = item;
                }
            }
            return next;
        });
        setLabelErrors((prev) => {
            const next = { ...prev };
            for (const id of targetIds) {
                delete next[id];
            }
            return next;
        });
    }, [functionalities]);

    const validate = useCallback((): boolean => {
        const errors: Record<number, string> = {};
        let isValid = true;

        for (const [idStr, item] of Object.entries(selectedMap)) {
            const id = Number(idStr);
            const trimmed = item.itemLabel.trim();
            if (!trimmed) {
                errors[id] = "Enter a label";
                isValid = false;
            }
        }

        setLabelErrors(errors);
        return isValid;
    }, [selectedMap]);

    const buildPayload = useCallback((): DepartmentFunctionalityItemAssignment[] => {
        const payload: DepartmentFunctionalityItemAssignment[] = [];
        const selectedIds = new Set<number>();

        for (const [idStr, item] of Object.entries(selectedMap)) {
            const id = Number(idStr);
            selectedIds.add(id);
            payload.push({
                functionalityId: id,
                isEnabled: true,
                itemLabel: item.itemLabel.trim() || "Item",
            });
        }

        for (const [idStr, initial] of Object.entries(initialEnabledMap)) {
            const id = Number(idStr);
            if (initial.isEnabled && !selectedIds.has(id)) {
                payload.push({
                    functionalityId: id,
                    isEnabled: false,
                    itemLabel: initial.itemLabel || "Item",
                });
            }
        }

        return payload;
    }, [initialEnabledMap, selectedMap]);

    const hasSelection = useMemo(() => Object.keys(selectedMap).length > 0, [selectedMap]);

    const isDirty = useMemo(() => {
        const currentIds = Object.keys(selectedMap).map(Number);
        const initialActiveIds = Object.entries(initialEnabledMap)
            .filter(([, v]) => v.isEnabled)
            .map(([k]) => Number(k));

        if (currentIds.length !== initialActiveIds.length) return true;
        for (const id of currentIds) {
            if (!initialActiveIds.includes(id)) return true;
            const currentLabel = selectedMap[id]?.itemLabel.trim();
            const initialLabel = initialEnabledMap[id]?.itemLabel.trim();
            if (currentLabel !== initialLabel) return true;
        }
        return false;
    }, [initialEnabledMap, selectedMap]);

    return {
        loading,
        error,
        isForbidden,
        functionalities,
        selectedMap,
        labelErrors,
        hasSelection,
        isDirty,
        setSelectedMap,
        toggleFunctionality,
        removeFunctionality,
        updateItemLabel,
        selectAll,
        clearAll,
        validate,
        buildPayload,
        reload: loadData,
    };
}

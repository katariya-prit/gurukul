import { useCallback, useEffect, useState } from "react";
import { functionalityManagerService } from "../services/functionalityManagerService";
import type { DepartmentAssignmentInput, DepartmentFunctionality, DepartmentOption } from "../types";

export function useDepartmentFunctionalities(functionalityId: number) {
    const [departments, setDepartments] = useState<DepartmentOption[]>([]);
    const [assignments, setAssignments] = useState<DepartmentFunctionality[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [allDepartments, enabledDepartments] = await Promise.all([
                functionalityManagerService.getDepartments(),
                functionalityManagerService.getDepartmentFunctionalities(functionalityId),
            ]);
            setDepartments(allDepartments);
            setAssignments(enabledDepartments);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Could not load department assignments.");
        } finally {
            setLoading(false);
        }
    }, [functionalityId]);

    useEffect(() => {
        void reload();
    }, [reload]);

    const save = async (values: DepartmentAssignmentInput[]) => {
        setSaving(true);
        try {
            const result = await functionalityManagerService.setDepartmentFunctionalities(functionalityId, values);
            setAssignments(result);
            return result;
        } finally {
            setSaving(false);
        }
    };

    return { departments, assignments, setAssignments, loading, saving, error, reload, save };
}

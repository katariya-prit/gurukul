import { useCallback, useEffect, useState } from "react";
import { functionalityManagerService } from "../services/functionalityManagerService";
import type {
    DepartmentFunctionality,
    Functionality,
    FunctionalityItem,
    ItemLevel,
    ItemPermissions,
    ItemRubric,
    PermissionOption,
} from "../types";

export interface ItemSummary {
    item: FunctionalityItem;
    rubric: ItemRubric | null;
    levels: ItemLevel[];
    permissions: ItemPermissions;
    allowedRoles: string[];
    allowedSections: string[];
    allowedUsers: string[];
}

export function useItemSummaries() {
    const [functionalities, setFunctionalities] = useState<Functionality[]>([]);
    const [assignments, setAssignments] = useState<DepartmentFunctionality[]>([]);
    const [summaries, setSummaries] = useState<ItemSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [functionalityRows, items, permissionOptions] = await Promise.all([
                functionalityManagerService.getFunctionalities(),
                functionalityManagerService.getItems(),
                functionalityManagerService.getPermissionOptions(),
            ]);
            const [assignmentRows, summaryRows] = await Promise.all([
                Promise.all(functionalityRows.map((entry) => functionalityManagerService.getDepartmentFunctionalities(entry.id))),
                Promise.all(items.map(async (item) => {
                    const [rubrics, levels, permissions] = await Promise.all([
                        functionalityManagerService.getRubrics(item.id),
                        functionalityManagerService.getLevels(item.id),
                        functionalityManagerService.getItemPermissions(item.id),
                    ]);
                    return {
                        item,
                        rubric: rubrics.find((entry) => entry.isCurrent) ?? rubrics[0] ?? null,
                        levels,
                        permissions,
                        allowedRoles: resolveLabels(permissionOptions.roles, permissions.roleCodes),
                        allowedSections: resolveLabels(permissionOptions.sections, permissions.sectionIds),
                        allowedUsers: resolveLabels(permissionOptions.users, permissions.userSuids),
                    };
                })),
            ]);
            setFunctionalities(functionalityRows);
            setAssignments(assignmentRows.flat());
            setSummaries(summaryRows);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Could not load item summaries.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void Promise.resolve().then(reload);
    }, [reload]);

    return { functionalities, assignments, summaries, loading, error, reload };
}

function resolveLabels(options: PermissionOption[], selected: Array<string | number>): string[] {
    return selected.map((value) =>
        options.find((option) => String(option.id) === String(value))?.label ?? String(value)
    );
}

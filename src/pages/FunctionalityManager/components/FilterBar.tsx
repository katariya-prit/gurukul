import { useEffect, useState, useMemo } from "react";
import { LuSearch, LuX } from "react-icons/lu";
import SearchableDropdown from "../../../components/common/SearchableDropdown";
import { useTheme } from "../../../components/theme/ThemeContext";
import type { DepartmentFunctionality, Functionality, FunctionalityItem } from "../types";

interface FilterBarProps {
    functionalities: Functionality[];
    assignments: DepartmentFunctionality[];
    items?: FunctionalityItem[];
    functionalityId: number | "";
    departmentId: number | "";
    itemId?: number | "";
    search: string;
    onFunctionalityChange: (id: number | "") => void;
    onDepartmentChange: (id: number | "") => void;
    onItemChange?: (id: number | "") => void;
    onSearchChange: (value: string) => void;
    showItem?: boolean;
}

export default function FilterBar({
    functionalities,
    assignments,
    items = [],
    functionalityId,
    departmentId,
    itemId = "",
    search,
    onFunctionalityChange,
    onDepartmentChange,
    onItemChange,
    onSearchChange,
    showItem = true,
}: FilterBarProps) {
    const { theme } = useTheme();
    const [inputValue, setInputValue] = useState(search);

    useEffect(() => {
        setInputValue(search);
    }, [search]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (inputValue !== search) {
                onSearchChange(inputValue);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [inputValue, onSearchChange, search]);

    const departments = useMemo(() => {
        return assignments
            .filter(
                (assignment) =>
                    assignment.isEnabled && (!functionalityId || assignment.functionalityId === functionalityId)
            )
            .filter(
                (assignment, index, list) =>
                    list.findIndex((entry) => entry.departmentId === assignment.departmentId) === index
            );
    }, [assignments, functionalityId]);

    const visibleItems = useMemo(() => {
        return items.filter(
            (item) =>
                (!functionalityId || item.functionalityId === functionalityId) &&
                (!departmentId || item.departmentId === departmentId)
        );
    }, [departmentId, functionalityId, items]);

    const selectedDepartment = useMemo(() => {
        return assignments.find(
            (assignment) =>
                assignment.departmentId === departmentId &&
                (!functionalityId || assignment.functionalityId === functionalityId)
        );
    }, [assignments, departmentId, functionalityId]);

    const itemLabel = selectedDepartment?.itemLabel ?? "Item";
    const itemLabelLower = itemLabel.toLowerCase();
    const itemLabelPlural = itemLabelLower.endsWith("s") ? itemLabelLower : `${itemLabelLower}s`;

    const labelClass = `block text-xs font-semibold uppercase tracking-wider mb-1.5 truncate ${
        theme ? "text-gray-300" : "text-neutral-700"
    }`;

    const handleClearSearch = () => {
        setInputValue("");
        onSearchChange("");
    };

    return (
        <div
            className={`mb-6 grid gap-3 grid-cols-1 sm:grid-cols-2 ${
                showItem ? "lg:grid-cols-4" : "lg:grid-cols-3"
            } items-end`}
        >
            <div className="flex min-w-0 flex-col">
                <label className={labelClass}>Functionality</label>
                <SearchableDropdown
                    placeholder="All functionalities"
                    triggerClassName="h-11 min-h-11"
                    options={[
                        { value: "", label: "All functionalities" },
                        ...functionalities.map((entry) => ({ value: entry.id, label: entry.name })),
                    ]}
                    selectedValue={functionalityId}
                    onSelect={(value) => onFunctionalityChange(value === "" ? "" : Number(value))}
                />
            </div>

            <div className="flex min-w-0 flex-col">
                <label className={labelClass}>Department</label>
                <SearchableDropdown
                    placeholder="All departments"
                    triggerClassName="h-11 min-h-11"
                    options={[
                        { value: "", label: "All departments" },
                        ...departments.map((entry) => ({ value: entry.departmentId, label: entry.departmentName })),
                    ]}
                    selectedValue={departmentId}
                    onSelect={(value) => onDepartmentChange(value === "" ? "" : Number(value))}
                />
            </div>

            {showItem && (
                <div className="flex min-w-0 flex-col">
                    <label className={labelClass}>{itemLabel}</label>
                    <SearchableDropdown
                        placeholder={`All ${itemLabelPlural}`}
                        triggerClassName="h-11 min-h-11"
                        options={[
                            { value: "", label: `All ${itemLabelPlural}` },
                            ...visibleItems.map((item) => ({
                                value: item.id,
                                label: `${item.itemLabel}: ${item.name}`,
                            })),
                        ]}
                        selectedValue={itemId}
                        onSelect={(value) => (onItemChange ? onItemChange(value === "" ? "" : Number(value)) : undefined)}
                    />
                </div>
            )}

            <div className="flex min-w-0 flex-col">
                <label className={labelClass}>Search</label>
                <div className="relative flex h-11 w-full items-center">
                    <LuSearch
                        className={`pointer-events-none absolute left-3.5 text-base ${
                            theme ? "text-gray-400" : "text-neutral-400"
                        }`}
                        aria-hidden="true"
                    />
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(event) => setInputValue(event.target.value)}
                        placeholder={`Search ${itemLabelPlural}...`}
                        aria-label={`Search ${itemLabelPlural}`}
                        className={`h-11 w-full rounded-xl border pl-10 pr-9 text-base transition-all duration-200 outline-none sm:text-sm ${
                            theme
                                ? "bg-gray-800 text-white border-gray-700 hover:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                                : "bg-neutral-50 text-neutral-900 border-neutral-200 hover:border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        }`}
                    />
                    {inputValue && (
                        <button
                            type="button"
                            onClick={handleClearSearch}
                            aria-label="Clear search"
                            className={`absolute right-3 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs transition ${
                                theme ? "text-gray-400 hover:text-white" : "text-neutral-400 hover:text-neutral-900"
                            }`}
                        >
                            <LuX className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

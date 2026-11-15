import { useMemo, useState } from "react";
import { LuPlus, LuX } from "react-icons/lu";
import { toast } from "sonner";
import type { DepartmentAssignmentInput, DepartmentFunctionality, DepartmentOption } from "../types";
import { useTheme } from "../../../components/theme/ThemeContext";
import Button from "../../../components/common/Button";
import Input from "../../../components/common/Input";
import { fieldClass, mutedTextClass, surfaceClass } from "./styles";

interface DepartmentAssignPanelProps {
    functionalityId: number;
    departments: DepartmentOption[];
    assignments: DepartmentFunctionality[];
    originalAssignments: DepartmentFunctionality[];
    onChange: (assignments: DepartmentFunctionality[]) => void;
    onSave: (assignments: DepartmentAssignmentInput[]) => Promise<void>;
    saving: boolean;
}

export default function DepartmentAssignPanel({
    functionalityId,
    departments,
    assignments,
    originalAssignments,
    onChange,
    onSave,
    saving,
}: DepartmentAssignPanelProps) {
    const { theme } = useTheme();
    const [query, setQuery] = useState("");
    const [mobileTab, setMobileTab] = useState<"available" | "enabled">("available");

    const assignmentKey = JSON.stringify(
        assignments.map(({ departmentId, itemLabel, isEnabled }) => ({ departmentId, itemLabel, isEnabled }))
    );
    const originalKey = JSON.stringify(
        originalAssignments.map(({ departmentId, itemLabel, isEnabled }) => ({ departmentId, itemLabel, isEnabled }))
    );
    const unsaved = assignmentKey !== originalKey;
    const assignedIds = new Set(assignments.map((entry) => entry.departmentId));

    const available = useMemo(
        () =>
            departments.filter(
                (department) =>
                    !assignedIds.has(department.id) &&
                    department.name.toLowerCase().includes(query.toLowerCase())
            ),
        [assignedIds, departments, query]
    );

    const add = (department: DepartmentOption) => {
        onChange([
            ...assignments,
            {
                id: Date.now(),
                departmentId: department.id,
                departmentName: department.name,
                functionalityId,
                itemLabel: "Item",
                isEnabled: true,
            },
        ]);
    };

    const save = async () => {
        try {
            const values = assignments.map(({ departmentId, itemLabel, isEnabled }) => ({
                departmentId,
                itemLabel,
                isEnabled,
            }));
            await onSave(values);
            toast.success("Department assignments saved.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not save department assignments.");
        }
    };

    return (
        <div className="space-y-4">
            {unsaved && (
                <p
                    role="status"
                    className={`text-sm font-semibold ${theme ? "text-amber-300" : "text-amber-700"}`}
                >
                    Unsaved changes
                </p>
            )}

            <div className="flex gap-2 border-b border-inherit pb-2 lg:hidden">
                <button
                    type="button"
                    onClick={() => setMobileTab("available")}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                        mobileTab === "available"
                            ? theme
                                ? "bg-blue-600 text-white"
                                : "bg-red-600 text-white"
                            : theme
                                ? "bg-slate-800 text-slate-300"
                                : "bg-slate-100 text-slate-600"
                    }`}
                >
                    Available ({available.length})
                </button>
                <button
                    type="button"
                    onClick={() => setMobileTab("enabled")}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                        mobileTab === "enabled"
                            ? theme
                                ? "bg-blue-600 text-white"
                                : "bg-red-600 text-white"
                            : theme
                                ? "bg-slate-800 text-slate-300"
                                : "bg-slate-100 text-slate-600"
                    }`}
                >
                    Enabled ({assignments.length})
                </button>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
                <section
                    className={`rounded-2xl border p-4 sm:p-5 ${surfaceClass(theme)} ${
                        mobileTab === "available" ? "block" : "hidden lg:block"
                    }`}
                >
                    <h2 className="mb-3 text-base font-bold">Available departments</h2>
                    <Input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search departments..."
                        aria-label="Search departments"
                    />
                    <div className="mt-4 space-y-2">
                        {available.length ? (
                            available.map((department) => (
                                <div
                                    key={department.id}
                                    className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${
                                        theme ? "border-slate-800" : "border-slate-100"
                                    }`}
                                >
                                    <span className="truncate text-sm font-medium">{department.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => add(department)}
                                        aria-label={`Add ${department.name}`}
                                        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition ${
                                            theme ? "text-blue-300 hover:bg-slate-800" : "text-red-700 hover:bg-red-50"
                                        }`}
                                    >
                                        <LuPlus className="text-lg" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className={`py-6 text-center text-sm ${mutedTextClass(theme)}`}>
                                No departments available.
                            </p>
                        )}
                    </div>
                </section>

                <section
                    className={`rounded-2xl border p-4 sm:p-5 ${surfaceClass(theme)} ${
                        mobileTab === "enabled" ? "block" : "hidden lg:block"
                    }`}
                >
                    <h2 className="mb-3 text-base font-bold">Enabled departments</h2>
                    <div className="space-y-3">
                        {assignments.length ? (
                            assignments.map((assignment) => (
                                <div
                                    key={assignment.departmentId}
                                    className={`flex flex-col gap-3 rounded-xl border p-3 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end ${
                                        theme ? "border-slate-800" : "border-slate-100"
                                    }`}
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="mb-2 truncate text-sm font-semibold">
                                                {assignment.departmentName}
                                            </p>
                                            <button
                                                type="button"
                                                aria-label={`Remove ${assignment.departmentName}`}
                                                onClick={() =>
                                                    onChange(
                                                        assignments.filter(
                                                            (entry) => entry.departmentId !== assignment.departmentId
                                                        )
                                                    )
                                                }
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-500 hover:bg-red-500/10 sm:hidden"
                                            >
                                                <LuX />
                                            </button>
                                        </div>
                                        <label className={`block text-xs ${mutedTextClass(theme)}`}>
                                            Item label
                                            <input
                                                value={assignment.itemLabel}
                                                onChange={(event) =>
                                                    onChange(
                                                        assignments.map((entry) =>
                                                            entry.departmentId === assignment.departmentId
                                                                ? { ...entry, itemLabel: event.target.value }
                                                                : entry
                                                        )
                                                    )
                                                }
                                                className={`${fieldClass(theme)} mt-1 min-h-[44px] text-base sm:text-sm`}
                                                aria-label={`${assignment.departmentName} item label`}
                                            />
                                        </label>
                                    </div>
                                    <button
                                        type="button"
                                        aria-label={`Remove ${assignment.departmentName}`}
                                        onClick={() =>
                                            onChange(
                                                assignments.filter(
                                                    (entry) => entry.departmentId !== assignment.departmentId
                                                )
                                            )
                                        }
                                        className="hidden rounded-lg p-2 text-red-500 hover:bg-red-500/10 sm:inline-flex"
                                    >
                                        <LuX />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className={`py-6 text-center text-sm ${mutedTextClass(theme)}`}>
                                No departments enabled.
                            </p>
                        )}
                    </div>
                </section>
            </div>

            <div
                className={`sticky bottom-0 z-20 -mx-4 -mb-4 flex items-center justify-end gap-3 border-t p-4 backdrop-blur-md sm:static sm:mx-0 sm:mb-0 sm:border-t-0 sm:p-0 ${
                    theme ? "border-slate-800 bg-[#060a12]/90" : "border-slate-200 bg-[#f4f7fb]/90"
                }`}
            >
                <Button
                    onClick={() => void save()}
                    isLoading={saving}
                    disabled={!unsaved}
                    className="min-h-[44px] w-full sm:w-auto"
                >
                    Save assignments
                </Button>
            </div>
        </div>
    );
}

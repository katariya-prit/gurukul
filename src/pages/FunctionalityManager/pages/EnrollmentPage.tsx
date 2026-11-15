import { useMemo, useState } from "react";
import { toast } from "sonner";
import Button from "../../../components/common/Button";
import SearchableDropdown from "../../../components/common/SearchableDropdown";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import PageHeader from "../components/PageHeader";
import SkeletonList from "../components/SkeletonList";
import { useEnrollment } from "../hooks/useEnrollment";
import { useFunctionalities } from "../hooks/useFunctionalities";
import { useItems } from "../hooks/useItems";
import { useTheme } from "../../../components/theme/ThemeContext";
import { fieldClass, surfaceClass } from "../components/styles";

export default function EnrollmentPage() {
    const { theme } = useTheme();
    const { functionalities, loading: functionalitiesLoading, error: functionalitiesError, reload: reloadFunctionalities } = useFunctionalities();
    const [functionalityId, setFunctionalityId] = useState<number | "">("");
    const { items, loading: itemsLoading, error: itemsError, reload: reloadItems } = useItems({ functionalityId: functionalityId || undefined });
    const [itemId, setItemId] = useState<number | null>(null);
    const { students, loading, saving, error, reload, update } = useEnrollment(itemId);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [search, setSearch] = useState("");
    const [sectionId, setSectionId] = useState<number | "">("");
    const item = items.find((entry) => entry.id === itemId);

    const filteredStudents = useMemo(() => students.filter((student) =>
        (!item || student.departmentId === item.departmentId)
        && (!sectionId || student.sectionId === sectionId)
        && student.name.toLowerCase().includes(search.toLowerCase())
    ), [item, search, sectionId, students]);

    const sectionOptions = useMemo(() => {
        const sections = students
            .filter((student) => !item || student.departmentId === item.departmentId)
            .flatMap((student) => student.sectionId === null
                ? []
                : [{ id: student.sectionId, name: student.sectionName ?? `Section ${student.sectionId}` }]);
        return sections.filter((section, index, list) => list.findIndex((entry) => entry.id === section.id) === index);
    }, [item, students]);

    const pageError = functionalitiesError ?? itemsError ?? error;
    const pageLoading = functionalitiesLoading || itemsLoading || loading;

    const performUpdate = async (enrolled: boolean) => {
        const targetIds = selectedIds.filter((id) =>
            students.find((student) => student.suid === id)?.enrolled !== enrolled
        );
        if (!itemId || targetIds.length === 0) return;
        try {
            await update(targetIds, enrolled);
            setSelectedIds([]);
            toast.success(enrolled ? "Students enrolled." : "Students unenrolled.");
        } catch (updateError) {
            toast.error(updateError instanceof Error ? updateError.message : "Could not update enrollment.");
        }
    };

    return (
        <div className="w-full min-w-0">
            <PageHeader
                title="Student Enrollment"
                description="Enroll students into an item. The server must enforce department and section scope for every change."
            />
            <div className="mb-6 grid gap-3 grid-cols-1 sm:grid-cols-2">
                <SearchableDropdown
                    label="Functionality"
                    placeholder="Choose a functionality"
                    triggerClassName="h-11 min-h-11"
                    options={functionalities.map((entry) => ({ value: entry.id, label: entry.name }))}
                    selectedValue={functionalityId}
                    onSelect={(value) => { setFunctionalityId(Number(value)); setItemId(null); setSelectedIds([]); }}
                />
                <SearchableDropdown
                    label="Item"
                    placeholder="Choose an item"
                    triggerClassName="h-11 min-h-11"
                    options={items.map((entry) => ({ value: entry.id, label: `${entry.departmentName} · ${entry.itemLabel}: ${entry.name}` }))}
                    selectedValue={itemId ?? ""}
                    onSelect={(value) => { setItemId(value === "" ? null : Number(value)); setSelectedIds([]); }}
                    disabled={!functionalityId}
                />
            </div>
            {pageLoading && itemId ? (
                <SkeletonList rows={2} />
            ) : pageError ? (
                <ErrorState message={pageError} onRetry={() => { void reloadFunctionalities(); void reloadItems(); void reload(); }} />
            ) : !itemId ? (
                <EmptyState title="Choose an item" description="Select a functionality and item to manage its enrolled students." />
            ) : (
                <section className={`rounded-2xl border p-4 sm:p-5 ${surfaceClass(theme)}`}>
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <label className="w-full max-w-md text-sm font-medium">
                            Search students
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                className={`${fieldClass(theme)} mt-1.5 min-h-[44px] text-base sm:text-sm`}
                                placeholder="Search by name..."
                            />
                        </label>
                        <div className="w-full sm:max-w-xs">
                            <SearchableDropdown
                                label="Section"
                                placeholder="All sections"
                                triggerClassName="h-11 min-h-11"
                                options={[{ value: "", label: "All sections" }, ...sectionOptions.map((section) => ({ value: section.id, label: section.name }))]}
                                selectedValue={sectionId}
                                onSelect={(value) => setSectionId(value === "" ? "" : Number(value))}
                            />
                        </div>
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                            <Button
                                disabled={selectedIds.length === 0}
                                isLoading={saving}
                                onClick={() => void performUpdate(true)}
                                className="min-h-[44px] w-full sm:w-auto"
                            >
                                Enroll selected
                            </Button>
                            <button
                                type="button"
                                disabled={selectedIds.length === 0 || saving}
                                onClick={() => void performUpdate(false)}
                                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-500/10 disabled:opacity-50 sm:w-auto"
                            >
                                Unenroll selected
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {filteredStudents.map((student) => (
                            <label
                                key={student.suid}
                                className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                                    theme ? "border-slate-800 hover:bg-slate-800/60" : "border-slate-100 hover:bg-slate-50"
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(student.suid)}
                                    onChange={(event) =>
                                        setSelectedIds((current) =>
                                            event.target.checked
                                                ? [...current, student.suid]
                                                : current.filter((id) => id !== student.suid)
                                        )
                                    }
                                    className="h-4 w-4 accent-blue-600 rounded"
                                />
                                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{student.name}</span>
                                <span className="text-right text-xs opacity-70">
                                    {student.sectionName ?? "No section"} · {student.enrolled ? "Enrolled" : "Not enrolled"}
                                </span>
                            </label>
                        ))}
                        {filteredStudents.length === 0 && (
                            <p className="py-6 text-center text-sm opacity-70">No students in this department match the search.</p>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { LuPlus } from "react-icons/lu";
import Button from "../../../components/common/Button";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import ItemFormModal from "../components/ItemFormModal";
import ItemsTable from "../components/ItemsTable";
import PageHeader from "../components/PageHeader";
import SkeletonList from "../components/SkeletonList";
import FilterBar from "../components/FilterBar";
import { useFunctionalities } from "../hooks/useFunctionalities";
import { useItems } from "../hooks/useItems";
import { functionalityManagerService } from "../services/functionalityManagerService";
import type { DepartmentFunctionality, FunctionalityItem, ItemInput } from "../types";

export default function ItemsPage() {
    const [searchParams] = useSearchParams();
    const [functionalityId, setFunctionalityId] = useState<number | "">(
        Number(searchParams.get("functionalityId")) || ""
    );
    const [departmentId, setDepartmentId] = useState<number | "">("");
    const [itemId, setItemId] = useState<number | "">("");
    const [search, setSearch] = useState("");
    const [assignments, setAssignments] = useState<DepartmentFunctionality[]>([]);
    const [assignmentError, setAssignmentError] = useState<string | null>(null);
    const [assignmentLoading, setAssignmentLoading] = useState(false);
    const [editing, setEditing] = useState<FunctionalityItem | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const {
        functionalities,
        loading: functionalitiesLoading,
        error: functionalitiesError,
        reload: reloadFunctionalities,
    } = useFunctionalities();

    const { items, loading, error, reload, save, setActive } = useItems({
        functionalityId: functionalityId || undefined,
        departmentId: departmentId || undefined,
    });

    useEffect(() => {
        let cancelled = false;
        void Promise.resolve()
            .then(() => {
                if (cancelled) return [];
                setAssignmentLoading(true);
                setAssignmentError(null);
                return Promise.all(
                    functionalities.map((entry) =>
                        functionalityManagerService.getDepartmentFunctionalities(entry.id)
                    )
                );
            })
            .then((results) => {
                if (!cancelled) setAssignments(results.flat());
            })
            .catch((loadError: unknown) => {
                if (!cancelled) {
                    setAssignmentError(
                        loadError instanceof Error
                            ? loadError.message
                            : "Could not load department assignments."
                    );
                }
            })
            .finally(() => {
                if (!cancelled) setAssignmentLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [functionalities]);

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const matchesItem = !itemId || item.id === itemId;
            const matchesSearch =
                !search ||
                `${item.name} ${item.departmentName} ${item.functionalityName}`
                    .toLowerCase()
                    .includes(search.toLowerCase());
            return matchesItem && matchesSearch;
        });
    }, [itemId, items, search]);

    const saveItem = async (input: ItemInput) => {
        try {
            await save(input, editing?.id);
            toast.success(editing ? "Item updated." : "Item created.");
        } catch (saveError) {
            toast.error(saveError instanceof Error ? saveError.message : "Could not save item.");
            throw saveError;
        }
    };

    const allLoadError = functionalitiesError || error || assignmentError;
    const isLoading = functionalitiesLoading || loading || assignmentLoading;

    return (
        <div className="w-full min-w-0">
            <PageHeader
                title="Items"
                description="Create and maintain department-specific items. Rubrics, levels and permissions have separate pages."
                actions={
                    <Button
                        leftIcon={<LuPlus />}
                        onClick={() => {
                            setEditing(null);
                            setModalOpen(true);
                        }}
                        className="w-full sm:w-auto"
                    >
                        Add item
                    </Button>
                }
            />
            <FilterBar
                functionalities={functionalities}
                assignments={assignments}
                items={items}
                functionalityId={functionalityId}
                departmentId={departmentId}
                itemId={itemId}
                search={search}
                onFunctionalityChange={(id) => {
                    setFunctionalityId(id);
                    setDepartmentId("");
                    setItemId("");
                }}
                onDepartmentChange={(id) => {
                    setDepartmentId(id);
                    setItemId("");
                }}
                onItemChange={setItemId}
                onSearchChange={setSearch}
            />
            {isLoading ? (
                <SkeletonList rows={3} />
            ) : allLoadError ? (
                <ErrorState
                    message={allLoadError}
                    onRetry={() => {
                        void reload();
                        void reloadFunctionalities();
                    }}
                />
            ) : filteredItems.length === 0 ? (
                <EmptyState
                    title="No items found"
                    description="Change the filters or create a new item for an enabled department."
                />
            ) : (
                <ItemsTable
                    items={filteredItems}
                    onEdit={(item) => {
                        setEditing(item);
                        setModalOpen(true);
                    }}
                    onToggle={setActive}
                />
            )}
            <ItemFormModal
                open={modalOpen}
                item={editing}
                functionalities={functionalities}
                departments={assignments}
                onClose={() => setModalOpen(false)}
                onSave={saveItem}
            />
        </div>
    );
}

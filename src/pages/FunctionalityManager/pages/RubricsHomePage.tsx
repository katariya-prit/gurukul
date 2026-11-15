import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import FilterBar from "../components/FilterBar";
import ItemSummaryCard from "../components/ItemSummaryCard";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import SkeletonList from "../components/SkeletonList";
import { useItemSummaries } from "../hooks/useItemSummaries";
import { useTheme } from "../../../components/theme/ThemeContext";

export default function RubricsHomePage() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { functionalities, assignments, summaries, loading, error, reload } = useItemSummaries();
    const [functionalityId, setFunctionalityId] = useState<number | "">("");
    const [departmentId, setDepartmentId] = useState<number | "">("");
    const [itemId, setItemId] = useState<number | "">("");
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => summaries.filter(({ item }) =>
        (!functionalityId || item.functionalityId === functionalityId)
        && (!departmentId || item.departmentId === departmentId)
        && (!itemId || item.id === itemId)
        && `${item.name} ${item.departmentName} ${item.functionalityName}`.toLowerCase().includes(search.toLowerCase())
    ), [departmentId, functionalityId, itemId, search, summaries]);

    return (
        <div className="w-full min-w-0">
            <PageHeader
                title="Rubrics"
                description="Review item criteria and save immutable rubric versions."
            />
            <FilterBar
                functionalities={functionalities}
                assignments={assignments}
                items={summaries.map((summary) => summary.item)}
                functionalityId={functionalityId}
                departmentId={departmentId}
                itemId={itemId}
                search={search}
                onFunctionalityChange={(id) => { setFunctionalityId(id); setDepartmentId(""); setItemId(""); }}
                onDepartmentChange={(id) => { setDepartmentId(id); setItemId(""); }}
                onItemChange={(id) => {
                    setItemId(id);
                    if (id) navigate(`/dashboard/functionality-manager/rubrics/${id}`);
                }}
                onSearchChange={setSearch}
            />
            {loading ? <SkeletonList rows={3} /> : error ? (
                <ErrorState message={error} onRetry={() => void reload()} />
            ) : filtered.length === 0 ? (
                <EmptyState title="No items found" description="Change the filters or add an item to see its rubric." />
            ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map(({ item, rubric }) => (
                        <ItemSummaryCard
                            key={item.id}
                            item={item}
                            emptyMessage={!rubric ? "No rubric yet." : undefined}
                            stats={rubric && (
                                <div className={`space-y-2 text-sm ${theme ? "text-slate-300" : "text-slate-600"}`}>
                                    <p>Current version <strong>v{rubric.version}</strong></p>
                                    <p>{rubric.criteria.length} criteria · {rubric.maxPoints} max points</p>
                                </div>
                            )}
                            actionLabel={rubric ? "Edit rubric" : "Create rubric"}
                            onAction={() => navigate(`/dashboard/functionality-manager/rubrics/${item.id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

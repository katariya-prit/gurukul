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

export default function LevelsHomePage() {
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
                title="Levels"
                description="Review level ladders and edit each item's promotion thresholds."
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
                    if (id) navigate(`/dashboard/functionality-manager/levels/${id}`);
                }}
                onSearchChange={setSearch}
            />
            {loading ? <SkeletonList rows={3} /> : error ? (
                <ErrorState message={error} onRetry={() => void reload()} />
            ) : filtered.length === 0 ? (
                <EmptyState title="No items found" description="Change the filters or add an item to configure its levels." />
            ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map(({ item, levels }) => {
                        const promoteModes = new Set(levels.map((level) => level.promoteMode));
                        const promotionSummary = promoteModes.size > 1 ? "Mixed" : levels[0]?.promoteMode === "manual" ? "Manual" : "Auto";
                        return (
                            <ItemSummaryCard
                                key={item.id}
                                item={item}
                                stats={(
                                    <div className="space-y-3">
                                        <div className={`flex flex-wrap gap-2 text-xs ${theme ? "text-slate-300" : "text-slate-600"}`}>
                                            <span>{levels.length} levels</span>
                                            <span>·</span>
                                            <span>{levels[0]?.name ?? "No first level"} → {levels.at(-1)?.name ?? "No last level"}</span>
                                        </div>
                                        <p className={`text-xs ${theme ? "text-slate-400" : "text-slate-500"}`}>Promotion: {promotionSummary}</p>
                                        <div className="flex items-center gap-1 overflow-hidden" aria-label="Level ladder preview">
                                            {levels.map((level) => (
                                                <span key={level.id} title={`${level.name}: ${level.minPoints} points`} className={`min-w-0 flex-1 truncate rounded-lg px-2 py-1 text-center text-[10px] font-semibold ${theme ? "bg-blue-500/10 text-blue-300" : "bg-red-50 text-red-700"}`}>
                                                    {level.name} · {level.minPoints}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                actionLabel="Edit levels"
                                onAction={() => navigate(`/dashboard/functionality-manager/levels/${item.id}`)}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

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

export default function PermissionsHomePage() {
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
                title="Permissions"
                description="Review who can access each item and manage role, section and user rules."
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
                    if (id) navigate(`/dashboard/functionality-manager/permissions/${id}`);
                }}
                onSearchChange={setSearch}
            />
            {loading ? <SkeletonList rows={3} /> : error ? (
                <ErrorState message={error} onRetry={() => void reload()} />
            ) : filtered.length === 0 ? (
                <EmptyState title="No items found" description="Change the filters or add an item to configure permissions." />
            ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map(({ item, permissions, allowedRoles, allowedSections, allowedUsers }) => (
                        <ItemSummaryCard
                            key={item.id}
                            item={item}
                            stats={(
                                <div className="space-y-3">
                                    <p className={`text-sm ${theme ? "text-slate-300" : "text-slate-600"}`}>
                                        {permissions.roleCodes.length} roles · {permissions.sectionIds.length} sections · {permissions.userSuids.length} users allowed
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {[...allowedRoles, ...allowedSections, ...allowedUsers].slice(0, 5).map((label, index) => (
                                            <span key={`${label}-${index}`} className={`max-w-full truncate rounded-full px-2.5 py-1 text-[10px] font-semibold ${theme ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>{label}</span>
                                        ))}
                                        {allowedRoles.length + allowedSections.length + allowedUsers.length === 0 && <span className="text-xs opacity-70">No access rules set</span>}
                                    </div>
                                </div>
                            )}
                            actionLabel="Edit permissions"
                            onAction={() => navigate(`/dashboard/functionality-manager/permissions/${item.id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

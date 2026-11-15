import { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { LuCopy } from "react-icons/lu";
import Button from "../../../components/common/Button";
import PageHeader from "../components/PageHeader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import SkeletonList from "../components/SkeletonList";
import PermissionsEditor from "../components/PermissionsEditor";
import CopyFromItemDialog from "../components/CopyFromItemDialog";
import { useItemPermissions } from "../hooks/useItemPermissions";
import { useItems } from "../hooks/useItems";
import { functionalityManagerService } from "../services/functionalityManagerService";
import { useTheme } from "../../../components/theme/ThemeContext";

export default function PermissionsPage() {
    const params = useParams<{ itemId: string }>();
    const itemId = Number(params.itemId);
    const validId = Number.isInteger(itemId) && itemId > 0;
    const { items, loading: itemsLoading, error: itemsError, reload: reloadItems } = useItems({});
    const { permissions, setPermissions, options, loading, saving, error, reload, save } = useItemPermissions(validId ? itemId : 0);
    const item = items.find((entry) => entry.id === itemId);
    const [copyDialogOpen, setCopyDialogOpen] = useState(false);
    const { theme } = useTheme();

    if (!validId) return <ErrorState message="The item id is invalid." onRetry={() => window.history.back()} />;
    if (loading || itemsLoading) return <SkeletonList rows={2} />;
    if (error || itemsError) return <ErrorState message={error ?? itemsError ?? "Could not load item."} onRetry={() => { void reload(); void reloadItems(); }} />;
    if (!item) return <EmptyState title="Item not found" description="This item may have been removed or is unavailable." />;

    return (
        <div className="w-full min-w-0">
            <PageHeader
                title={`${item.itemLabel} permissions · ${item.name}`}
                description="Choose which roles, sections, and specific users can access this item."
                actions={
                    <Button
                        leftIcon={<LuCopy />}
                        onClick={() => setCopyDialogOpen(true)}
                        className="min-h-[44px] w-full sm:w-auto"
                    >
                        Copy permissions from another item
                    </Button>
                }
            />
            <section className={`mb-5 rounded-2xl border p-4 sm:p-5 ${theme ? "border-slate-800 bg-slate-900/70" : "border-slate-200 bg-white"}`}>
                <h2 className="font-bold text-base">Who can use this item</h2>
                <div className="mt-3 grid gap-4 grid-cols-1 sm:grid-cols-3">
                    {[
                        { label: "Roles", ids: permissions.roleCodes, options: options.roles },
                        { label: "Sections", ids: permissions.sectionIds, options: options.sections },
                        { label: "Users", ids: permissions.userSuids, options: options.users },
                    ].map((group) => (
                        <div key={group.label} className="min-w-0">
                            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider opacity-70">{group.label}</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {group.ids.map((id) => (
                                    <span key={id} className={`max-w-full truncate rounded-full px-2.5 py-1 text-xs font-medium ${theme ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                                        {group.options.find((option) => String(option.id) === String(id))?.label ?? id}
                                    </span>
                                ))}
                                {group.ids.length === 0 && <span className="text-xs opacity-60">None selected</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            <PermissionsEditor
                permissions={permissions}
                options={options}
                onChange={setPermissions}
                saving={saving}
                onSave={async () => {
                    try {
                        await save();
                        toast.success("Item permissions saved.");
                    } catch (saveError) {
                        toast.error(saveError instanceof Error ? saveError.message : "Could not save item permissions.");
                        throw saveError;
                    }
                }}
            />
            <CopyFromItemDialog
                open={copyDialogOpen}
                items={items}
                currentItemId={item.id}
                title="Copy permissions from another item"
                onClose={() => setCopyDialogOpen(false)}
                onCopy={(source) => {
                    void functionalityManagerService.getItemPermissions(source.id).then((sourcePermissions) => {
                        setPermissions({
                            roleCodes: [...sourcePermissions.roleCodes],
                            sectionIds: [...sourcePermissions.sectionIds],
                            userSuids: [...sourcePermissions.userSuids],
                        });
                        toast.success(`Permissions copied from ${source.name}. Save to apply them.`);
                    }).catch((copyError: unknown) => {
                        toast.error(copyError instanceof Error ? copyError.message : "Could not copy permissions.");
                    });
                }}
            />
        </div>
    );
}

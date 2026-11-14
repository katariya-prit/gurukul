import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { LuCopy } from "react-icons/lu";
import Button from "../../../components/common/Button";
import { useTheme } from "../../../components/theme/ThemeContext";
import PageHeader from "../components/PageHeader";
import ErrorState from "../components/ErrorState";
import SkeletonList from "../components/SkeletonList";
import EmptyState from "../components/EmptyState";
import CopyFromItemDialog from "../components/CopyFromItemDialog";
import RubricBuilder from "../components/RubricBuilder";
import RubricVersionHistory from "../components/RubricVersionHistory";
import { useItems } from "../hooks/useItems";
import { useRubric } from "../hooks/useRubric";
import { functionalityManagerService } from "../services/functionalityManagerService";
import type { RubricCriterion } from "../types";

export default function RubricPage() {
    const params = useParams<{ itemId: string }>();
    const itemId = Number(params.itemId);
    const validId = Number.isInteger(itemId) && itemId > 0;
    const { items, loading: itemsLoading, error: itemsError, reload: reloadItems } = useItems({});
    const item = useMemo(() => items.find((entry) => entry.id === itemId), [itemId, items]);
    const { versions, current, loading, saving, error, reload, save } = useRubric(validId ? itemId : 0);
    const { theme } = useTheme();
    const [copyDialogOpen, setCopyDialogOpen] = useState(false);
    const [copiedCriteria, setCopiedCriteria] = useState<RubricCriterion[] | null>(null);
    const [editorRevision, setEditorRevision] = useState(0);
    const criteria = copiedCriteria ?? current?.criteria ?? [];

    if (!validId) return <ErrorState message="The item id is invalid." onRetry={() => window.history.back()} />;
    if (loading || itemsLoading) return <SkeletonList rows={2} />;
    if (error || itemsError) return <ErrorState message={error ?? itemsError ?? "Could not load item."} onRetry={() => { void reload(); void reloadItems(); }} />;
    if (!item) return <EmptyState title="Item not found" description="This item may have been removed or is unavailable." />;

    return (
        <div className="w-full min-w-0">
            <PageHeader
                title={`${item.itemLabel} rubric · ${item.name}`}
                description="Each save creates a new immutable rubric version; previous versions remain available for historical submissions."
                actions={
                    <Button
                        leftIcon={<LuCopy />}
                        onClick={() => setCopyDialogOpen(true)}
                        className="w-full sm:w-auto min-h-[44px]"
                    >
                        Copy rubric from another item
                    </Button>
                }
            />
            <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${theme ? "border-slate-800 bg-slate-900/50 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                Department: <strong>{item.departmentName}</strong> · Functionality: <strong>{item.functionalityName}</strong>
            </div>
            <div className="space-y-6">
                <RubricBuilder
                    key={`${item.id}-${current?.version ?? 0}-${editorRevision}`}
                    initialCriteria={criteria}
                    version={current?.version ?? null}
                    saving={saving}
                    onSave={async (nextCriteria) => {
                        try {
                            await save(nextCriteria);
                            setCopiedCriteria(null);
                            toast.success("New rubric version created.");
                        } catch (saveError) {
                            toast.error(saveError instanceof Error ? saveError.message : "Could not save rubric.");
                            throw saveError;
                        }
                    }}
                />
                <RubricVersionHistory versions={versions} />
            </div>
            <CopyFromItemDialog
                open={copyDialogOpen}
                items={items}
                currentItemId={item.id}
                title="Copy rubric from another item"
                onClose={() => setCopyDialogOpen(false)}
                onCopy={(source) => {
                    void functionalityManagerService.getRubrics(source.id).then((sourceVersions) => {
                        const sourceRubric = sourceVersions.find((version) => version.isCurrent) ?? sourceVersions[0];
                        if (!sourceRubric) {
                            toast.error("The selected item has no rubric to copy.");
                            return;
                        }
                        setCopiedCriteria(sourceRubric.criteria.map((criterion) => ({ ...criterion })));
                        setEditorRevision((revision) => revision + 1);
                        toast.success(`Rubric copied from ${source.name}. Review it before saving.`);
                    }).catch((copyError: unknown) => {
                        toast.error(copyError instanceof Error ? copyError.message : "Could not copy the rubric.");
                    });
                }}
            />
        </div>
    );
}

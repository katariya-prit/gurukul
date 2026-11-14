import { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { LuCopy } from "react-icons/lu";
import Button from "../../../components/common/Button";
import PageHeader from "../components/PageHeader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import SkeletonList from "../components/SkeletonList";
import LevelsEditor from "../components/LevelsEditor";
import DefaultLevelsButton from "../components/DefaultLevelsButton";
import CopyFromItemDialog from "../components/CopyFromItemDialog";
import { useItems } from "../hooks/useItems";
import { useLevels } from "../hooks/useLevels";
import { functionalityManagerService } from "../services/functionalityManagerService";
import type { ItemLevel } from "../types";

const defaultLevels = [
    { levelNo: 1, name: "Beginner", minPoints: 0, promoteMode: "auto" as const },
    { levelNo: 2, name: "Intermediate", minPoints: 100, promoteMode: "auto" as const },
    { levelNo: 3, name: "Advanced", minPoints: 300, promoteMode: "auto" as const },
    { levelNo: 4, name: "Expert", minPoints: 600, promoteMode: "auto" as const },
];

export default function LevelsPage() {
    const params = useParams<{ itemId: string }>();
    const itemId = Number(params.itemId);
    const validId = Number.isInteger(itemId) && itemId > 0;
    const { items, loading: itemsLoading, error: itemsError, reload: reloadItems } = useItems({});
    const { levels, setLevels, loading, saving, error, reload, save } = useLevels(validId ? itemId : 0);
    const item = items.find((entry) => entry.id === itemId);
    const [copyDialogOpen, setCopyDialogOpen] = useState(false);

    if (!validId) return <ErrorState message="The item id is invalid." onRetry={() => window.history.back()} />;
    if (loading || itemsLoading) return <SkeletonList rows={2} />;
    if (error || itemsError) return <ErrorState message={error ?? itemsError ?? "Could not load item."} onRetry={() => { void reload(); void reloadItems(); }} />;
    if (!item) return <EmptyState title="Item not found" description="This item may have been removed or is unavailable." />;

    return (
        <div className="w-full min-w-0">
            <PageHeader
                title={`${item.itemLabel} levels · ${item.name}`}
                description="Set point thresholds and choose automatic or manual promotion. Existing progress records are not changed."
                actions={
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                        <DefaultLevelsButton
                            onApply={() => {
                                setLevels(
                                    defaultLevels.map((level, index) => ({
                                        ...level,
                                        id: Date.now() + index,
                                        itemId,
                                    }))
                                );
                                toast.success("Default levels loaded. Save to apply them.");
                            }}
                        />
                        <Button
                            leftIcon={<LuCopy />}
                            onClick={() => setCopyDialogOpen(true)}
                            className="min-h-[44px] w-full sm:w-auto"
                        >
                            Copy from another item
                        </Button>
                    </div>
                }
            />
            <LevelsEditor
                levels={levels}
                onChange={setLevels}
                saving={saving}
                onSave={async () => {
                    try {
                        await save(
                            levels.map(({ levelNo, name, minPoints, promoteMode }) => ({
                                levelNo,
                                name,
                                minPoints,
                                promoteMode,
                            }))
                        );
                        toast.success("Levels saved.");
                    } catch (saveError) {
                        toast.error(saveError instanceof Error ? saveError.message : "Could not save levels.");
                        throw saveError;
                    }
                }}
            />
            <CopyFromItemDialog
                open={copyDialogOpen}
                items={items}
                currentItemId={item.id}
                title="Copy levels from another item"
                onClose={() => setCopyDialogOpen(false)}
                onCopy={(source) => {
                    void functionalityManagerService
                        .getLevels(source.id)
                        .then((sourceLevels) => {
                            const copied: ItemLevel[] = sourceLevels.map((level, index) => ({
                                ...level,
                                id: Date.now() + index,
                                itemId,
                                levelNo: index + 1,
                            }));
                            setLevels(copied);
                            toast.success(`Levels copied from ${source.name}. Review them before saving.`);
                        })
                        .catch((copyError: unknown) => {
                            toast.error(copyError instanceof Error ? copyError.message : "Could not copy levels.");
                        });
                }}
            />
        </div>
    );
}

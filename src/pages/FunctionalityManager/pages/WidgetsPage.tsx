import { useEffect, useState } from "react";
import { toast } from "sonner";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import PageHeader from "../components/PageHeader";
import SkeletonList from "../components/SkeletonList";
import WidgetList from "../components/WidgetList";
import { useFunctionalities } from "../hooks/useFunctionalities";
import { useItems } from "../hooks/useItems";
import { useWidgets } from "../hooks/useWidgets";
import type { WidgetInput } from "../types";

export default function WidgetsPage() {
    const { functionalities, loading: functionalitiesLoading, error: functionalitiesError, reload: reloadFunctionalities } = useFunctionalities();
    const { items, loading: itemsLoading, error: itemsError, reload: reloadItems } = useItems({});
    const { widgets, loading, error, reload, save, remove } = useWidgets();
    const [mutating, setMutating] = useState(false);

    useEffect(() => {
        if (!mutating) return;
        const timeout = window.setTimeout(() => setMutating(false), 350);
        return () => window.clearTimeout(timeout);
    }, [mutating]);

    const saveWidget = async (input: WidgetInput, id?: number) => {
        try {
            setMutating(true);
            await save(input, id);
            toast.success(id ? "Widget updated." : "Widget created.");
        } catch (saveError) {
            toast.error(saveError instanceof Error ? saveError.message : "Could not save widget.");
            throw saveError;
        }
    };

    const deleteWidget = async (id: number) => {
        if (!window.confirm("Remove this widget? Its configuration will no longer be shown.")) return;
        try {
            await remove(id);
            toast.success("Widget removed.");
        } catch (deleteError) {
            toast.error(deleteError instanceof Error ? deleteError.message : "Could not remove widget.");
        }
    };

    const firstError = error ?? functionalitiesError ?? itemsError;
    const isLoading = loading || functionalitiesLoading || itemsLoading;
    const retry = () => {
        void reload();
        void reloadFunctionalities();
        void reloadItems();
    };

    return (
        <div className="w-full min-w-0">
            <PageHeader title="Dashboard Widgets" description="Configure role-targeted dashboard cards for functionality and item progress." />
            {isLoading ? <SkeletonList /> : firstError ? <ErrorState message={firstError} onRetry={retry} /> : widgets.length === 0 ? (
                <EmptyState title="No widgets configured" description="Add a dashboard widget to define what users see for their functionality items." />
            ) : (
                <WidgetList widgets={widgets} functionalities={functionalities} items={items} onSave={saveWidget} onDelete={deleteWidget} />
            )}
        </div>
    );
}

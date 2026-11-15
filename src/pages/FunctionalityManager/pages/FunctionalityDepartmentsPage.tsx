import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { LuArrowLeft } from "react-icons/lu";
import Button from "../../../components/common/Button";
import PageHeader from "../components/PageHeader";
import DepartmentAssignPanel from "../components/DepartmentAssignPanel";
import ErrorState from "../components/ErrorState";
import SkeletonList from "../components/SkeletonList";
import { useDepartmentFunctionalities } from "../hooks/useDepartmentFunctionalities";
import { useFunctionalities } from "../hooks/useFunctionalities";
import type { DepartmentFunctionality } from "../types";

export default function FunctionalityDepartmentsPage() {
    const params = useParams<{ id: string }>();
    const functionalityId = Number(params.id);
    const validId = Number.isInteger(functionalityId) && functionalityId > 0;
    const { functionalities } = useFunctionalities();
    const functionality = functionalities.find((entry) => entry.id === functionalityId);
    const { departments, assignments, setAssignments, loading, saving, error, reload, save } = useDepartmentFunctionalities(validId ? functionalityId : 0);
    const [originalAssignments, setOriginalAssignments] = useState<DepartmentFunctionality[]>([]);

    useEffect(() => {
        if (!loading) setOriginalAssignments(assignments);
    }, [loading]);

    const saveAssignments = async (values: Array<{ departmentId: number; itemLabel: string; isEnabled: boolean }>) => {
        try {
            setOriginalAssignments(await save(values));
        } catch (saveError) {
            toast.error(saveError instanceof Error ? saveError.message : "Could not save department assignments.");
            throw saveError;
        }
    };

    if (!validId) return <ErrorState message="The functionality id is invalid." onRetry={() => window.history.back()} />;

    return (
        <div className="w-full min-w-0">
            <PageHeader
                title={`${functionality?.name ?? "Functionality"} departments`}
                description="Choose which departments can use this functionality and configure their item labels."
                actions={
                    <Link to="/dashboard/functionality-manager/functionalities" className="w-full sm:w-auto">
                        <Button leftIcon={<LuArrowLeft />} className="min-h-[44px] w-full sm:w-auto">
                            Back to functionalities
                        </Button>
                    </Link>
                }
            />
            {loading ? (
                <SkeletonList rows={2} />
            ) : error ? (
                <ErrorState message={error} onRetry={() => void reload()} />
            ) : (
                <DepartmentAssignPanel
                    functionalityId={functionalityId}
                    departments={departments}
                    assignments={assignments}
                    originalAssignments={originalAssignments}
                    onChange={setAssignments}
                    onSave={saveAssignments}
                    saving={saving}
                />
            )}
        </div>
    );
}

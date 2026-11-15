import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../../../components/theme/ThemeContext";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import DescriptionInput from "../../../components/common/DescriptionInput";
import { HiOutlineOfficeBuilding } from "react-icons/hi";
import { FaBuilding } from "react-icons/fa";
import { toast } from "sonner";
import DepartmentFunctionalitiesSelect from "./components/DepartmentFunctionalitiesSelect";
import { useDepartmentFunctionalitiesSelect } from "./hooks/useDepartmentFunctionalitiesSelect";
import { functionalityManagerService } from "../../FunctionalityManager/services/functionalityManagerService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

export interface DepartmentCreate {
    departmentName: string;
    description: string;
}

export default function CreateDepartment() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { departmentId } = useParams<{ departmentId: string }>();
    const [currentDepartmentId, setCurrentDepartmentId] = useState<string | undefined>(departmentId);
    const isEditMode = Boolean(currentDepartmentId);
    const [loading, setLoading] = useState<boolean>(false);

    const [formData, setFormData] = useState<DepartmentCreate>({
        departmentName: "",
        description: "",
    });

    const {
        loading: loadingFuncs,
        error: funcsError,
        isForbidden: funcsForbidden,
        functionalities,
        selectedMap,
        labelErrors,
        setSelectedMap,
        validate: validateFuncs,
        buildPayload: buildFuncsPayload,
        reload: reloadFuncs,
    } = useDepartmentFunctionalitiesSelect(currentDepartmentId ? Number(currentDepartmentId) : undefined);

    useEffect(() => {
        if (!currentDepartmentId) return;
        const loadDepartment = async () => {
            try {
                const response = await fetch(`${API_URL}/departments/${currentDepartmentId}`, {
                    credentials: "include",
                });
                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.message || "Department not found");
                }
                setFormData({
                    departmentName: result.data.departmentName || "",
                    description: result.data.description || "",
                });
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to load department");
                navigate("/dashboard/departments/list");
            }
        };
        void loadDepartment();
    }, [currentDepartmentId, navigate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateFuncs()) {
            toast.error("Please provide an item label for each selected functionality.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                isEditMode ? `${API_URL}/departments/${currentDepartmentId}` : `${API_URL}/departments/create`,
                {
                    method: isEditMode ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify(formData),
                }
            );

            const result = await response.json();

            if (!result.success) {
                toast.error(result.message || "Failed to save department");
                setLoading(false);
                return;
            }

            const savedDeptId = isEditMode
                ? Number(currentDepartmentId)
                : Number(result.data?.departmentId ?? result.data?.id ?? result.data?.department_id);

            const funcsPayload = buildFuncsPayload();

            if (funcsPayload.length > 0 && savedDeptId && !funcsForbidden) {
                try {
                    await functionalityManagerService.setFunctionalitiesByDepartment(savedDeptId, funcsPayload);
                } catch {
                    if (!isEditMode) {
                        setCurrentDepartmentId(String(savedDeptId));
                        window.history.replaceState(null, "", `/dashboard/departments/edit/${savedDeptId}`);
                    }
                    toast.error("Department saved, but functionalities could not be assigned. You can retry from Edit.");
                    setLoading(false);
                    return;
                }
            }

            toast.success(isEditMode ? "Department updated successfully!" : "Department created successfully!");
            setFormData({
                departmentName: "",
                description: "",
            });
            navigate("/dashboard/departments/list");
        } catch {
            toast.error("Something went wrong with the server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-white/8 dark:border-white/8">
                <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${
                        theme
                            ? "bg-linear-to-br from-blue-500 to-indigo-700 text-white shadow-blue-500/20"
                            : "bg-linear-to-br from-red-600 to-rose-700 text-white shadow-red-500/20"
                    }`}
                >
                    <FaBuilding size={24} />
                </div>
                <div>
                    <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${theme ? "text-white" : "text-slate-900"}`}>
                        {isEditMode ? "Update Department" : "Create Department"}
                    </h1>
                    <p className={`text-xs sm:text-sm mt-1 ${theme ? "text-gray-400" : "text-slate-500"}`}>
                        Fill in the details below to register a new department.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div
                    className={`rounded-2xl border p-6 sm:p-8 space-y-4 sm:space-y-5 transition-all ${
                        theme ? "bg-white/2 border-white/8" : "bg-white border-slate-200 shadow-sm"
                    }`}
                >
                    {/* Department Identity */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5 pb-2.5 border-b border-white/6 dark:border-white/6">
                            <span
                                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                    theme ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-600"
                                }`}
                            >
                                <HiOutlineOfficeBuilding size={16} />
                            </span>
                            <h2 className={`text-xs font-bold uppercase tracking-wider ${theme ? "text-gray-400" : "text-slate-400"}`}>
                                Department Identity
                            </h2>
                        </div>

                        <div>
                            <label className={`block text-xs font-semibold mb-1.5 ${theme ? "text-gray-300" : "text-slate-700"}`}>
                                Department Name *
                            </label>
                            <Input
                                type="text"
                                name="departmentName"
                                value={formData.departmentName}
                                onChange={handleInputChange}
                                icon={<HiOutlineOfficeBuilding className="text-lg" />}
                                placeholder="Enter department name"
                                required
                            />
                        </div>
                    </div>

                    {/* Functionalities */}
                    <DepartmentFunctionalitiesSelect
                        value={selectedMap}
                        onChange={setSelectedMap}
                        disabled={loading}
                        mode={isEditMode ? "edit" : "create"}
                        errors={labelErrors}
                        functionalities={functionalities}
                        loading={loadingFuncs}
                        error={funcsError}
                        isForbidden={funcsForbidden}
                        onRetry={() => void reloadFuncs()}
                    />

                    {/* Description */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5 pb-2.5 border-b border-white/6 dark:border-white/6">
                            <span
                                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                    theme ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-600"
                                }`}
                            >
                                <HiOutlineOfficeBuilding size={16} />
                            </span>
                            <h2 className={`text-xs font-bold uppercase tracking-wider ${theme ? "text-gray-400" : "text-slate-400"}`}>
                                Description
                            </h2>
                        </div>

                        <div>
                            <DescriptionInput
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                maxLength={300}
                                placeholder="Enter department description or core details..."
                                label="Description"
                                required={false}
                            />
                        </div>
                    </div>

                    {/* Submit Section */}
                    <div className="pt-3 border-t border-white/6 dark:border-white/6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className={`text-xs ${theme ? "text-gray-400" : "text-slate-500"}`}>
                            Fields marked with <strong className="text-red-500">*</strong> are required.
                        </p>

                        <Button
                            type="submit"
                            disabled={loading}
                            className={`w-full sm:w-auto min-w-40 text-xs font-semibold ${
                                theme ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"
                            }`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                    Saving...
                                </span>
                            ) : isEditMode ? (
                                "Update Department"
                            ) : (
                                "Create Department"
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
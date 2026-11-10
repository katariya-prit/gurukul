import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../../../components/theme/ThemeContext";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import DescriptionInput from "../../../components/common/DescriptionInput";
import {
    HiOutlineOfficeBuilding,
    HiOutlineArrowLeft,
    HiOutlineSparkles,
    HiOutlineInformationCircle,
    HiOutlineCheck,
} from "react-icons/hi";
import { FaBuilding, FaLayerGroup, FaUsers } from "react-icons/fa";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

export interface DepartmentCreate {
    departmentName: string;
    description: string;
}

export default function CreateDepartment() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { departmentId } = useParams<{ departmentId: string }>();
    const isEditMode = Boolean(departmentId);
    const [loading, setLoading] = useState<boolean>(false);

    const [formData, setFormData] = useState<DepartmentCreate>({
        departmentName: "",
        description: "",
    });

    useEffect(() => {
        if (!departmentId) return;
        const loadDepartment = async () => {
            try {
                const response = await fetch(`${API_URL}/departments/${departmentId}`, {
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
    }, [departmentId, navigate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(
                isEditMode ? `${API_URL}/departments/${departmentId}` : `${API_URL}/departments/create`,
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

            if (result.success) {
                toast.success(isEditMode ? "Department updated successfully!" : "Department created successfully!");
                setFormData({
                    departmentName: "",
                    description: "",
                });
                navigate("/dashboard/departments/list");
            } else {
                toast.error(result.message || "Failed to save department");
            }
        } catch {
            toast.error("Something went wrong with the server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08] dark:border-white/[0.08]">
                <div className="flex items-center gap-3.5">
                    <button
                        type="button"
                        onClick={() => navigate("/dashboard/departments/list")}
                        className={`p-2.5 rounded-xl border transition-colors ${
                            theme
                                ? "bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-gray-300"
                                : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-sm"
                        }`}
                        title="Back to departments"
                    >
                        <HiOutlineArrowLeft size={18} />
                    </button>
                    <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                            theme
                                ? "bg-linear-to-br from-blue-500 to-indigo-700 text-white shadow-blue-500/20"
                                : "bg-linear-to-br from-red-600 to-rose-700 text-white shadow-red-500/20"
                        }`}
                    >
                        <FaBuilding size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${theme ? "text-white" : "text-slate-900"}`}>
                                {isEditMode ? "Update Department" : "Create Department"}
                            </h1>
                            <span
                                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                                    theme ? "bg-blue-500/10 text-blue-300 border border-blue-500/20" : "bg-red-50 text-red-700 border border-red-200"
                                }`}
                            >
                                {isEditMode ? `ID #${departmentId}` : "New Department"}
                            </span>
                        </div>
                        <p className={`text-xs sm:text-sm mt-0.5 ${theme ? "text-gray-400" : "text-slate-500"}`}>
                            Configure academic or operational department details for your institution.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div
                            className={`rounded-2xl border p-5 sm:p-7 transition-all ${
                                theme ? "bg-white/[0.02] border-white/[0.08]" : "bg-white border-slate-200 shadow-sm"
                            }`}
                        >
                            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-white/[0.06] dark:border-white/[0.06]">
                                <span
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                        theme ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-600"
                                    }`}
                                >
                                    <HiOutlineOfficeBuilding size={16} />
                                </span>
                                <h2 className={`text-sm font-bold uppercase tracking-wider ${theme ? "text-gray-300" : "text-slate-800"}`}>
                                    Department Information
                                </h2>
                            </div>

                            <div className="space-y-5">
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
                                        placeholder="e.g. Science, Mathematics, Sanskrit"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className={`block text-xs font-semibold mb-1.5 ${theme ? "text-gray-300" : "text-slate-700"}`}>
                                        Description & Details
                                    </label>
                                    <DescriptionInput
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        maxLength={300}
                                        placeholder="Enter core details, educational vision or scope for this department..."
                                        label="Description"
                                        required={false}
                                    />
                                </div>
                            </div>
                        </div>

                        <div
                            className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border ${
                                theme ? "bg-white/[0.02] border-white/[0.08]" : "bg-white border-slate-200 shadow-sm"
                            }`}
                        >
                            <p className={`text-xs ${theme ? "text-gray-400" : "text-slate-500"}`}>
                                Fields marked with <strong className="text-red-500">*</strong> are required.
                            </p>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => navigate("/dashboard/departments/list")}
                                    disabled={loading}
                                    className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                                        theme
                                            ? "bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 border-white/10"
                                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                                    }`}
                                >
                                    Cancel
                                </button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className={`flex-1 sm:flex-none min-w-40 text-xs font-semibold ${
                                        theme ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"
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

                <div className="lg:col-span-5 space-y-6">
                    <div
                        className={`rounded-2xl border p-5 sm:p-6 transition-all ${
                            theme ? "bg-white/[0.02] border-white/[0.08]" : "bg-white border-slate-200 shadow-sm"
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06] dark:border-white/[0.06]">
                            <HiOutlineSparkles className={theme ? "text-blue-400" : "text-red-600"} size={16} />
                            <h3 className={`text-xs font-bold uppercase tracking-wider ${theme ? "text-gray-300" : "text-slate-800"}`}>
                                Live Preview
                            </h3>
                        </div>

                        <div
                            className={`p-5 rounded-xl border transition-all ${
                                theme ? "bg-black/30 border-white/10" : "bg-slate-50 border-slate-200"
                            }`}
                        >
                            <div className="flex items-start gap-3.5">
                                <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                                        theme
                                            ? "bg-linear-to-br from-blue-500 to-indigo-700 text-white shadow-blue-500/20"
                                            : "bg-linear-to-br from-red-600 to-rose-700 text-white shadow-red-500/20"
                                    }`}
                                >
                                    <FaBuilding size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`text-base font-bold truncate ${theme ? "text-white" : "text-slate-900"}`}>
                                        {formData.departmentName.trim() || "Department Name Preview"}
                                    </h4>
                                    <span
                                        className={`inline-block mt-0.5 text-[10px] font-mono font-medium px-2 py-0.5 rounded ${
                                            theme ? "bg-white/[0.06] text-gray-400" : "bg-slate-200 text-slate-600"
                                        }`}
                                    >
                                        {isEditMode ? `ID #${departmentId}` : "ID: Auto-generated"}
                                    </span>
                                </div>
                            </div>

                            <p
                                className={`text-xs mt-3.5 line-clamp-3 leading-relaxed ${
                                    theme ? "text-gray-400" : "text-slate-600"
                                }`}
                            >
                                {formData.description.trim() ||
                                    "Provide a description to explain the courses, scope and vision of this department."}
                            </p>

                            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                                <span className="flex items-center gap-1.5 opacity-70">
                                    <FaLayerGroup size={11} /> 0 Sections
                                </span>
                                <span className="flex items-center gap-1.5 opacity-70">
                                    <FaUsers size={11} /> 0 Students
                                </span>
                                <span className={`font-semibold ${theme ? "text-blue-400" : "text-red-600"}`}>
                                    Active
                                </span>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`rounded-2xl border p-5 sm:p-6 transition-all ${
                            theme ? "bg-white/[0.02] border-white/[0.08]" : "bg-white border-slate-200 shadow-sm"
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/[0.06] dark:border-white/[0.06]">
                            <HiOutlineInformationCircle className={theme ? "text-blue-400" : "text-red-600"} size={16} />
                            <h3 className={`text-xs font-bold uppercase tracking-wider ${theme ? "text-gray-300" : "text-slate-800"}`}>
                                Setup Guidelines
                            </h3>
                        </div>

                        <ul className="space-y-2.5 text-xs">
                            <li className="flex items-start gap-2">
                                <span className={`p-0.5 rounded-full mt-0.5 ${theme ? "bg-blue-500/20 text-blue-400" : "bg-red-100 text-red-600"}`}>
                                    <HiOutlineCheck size={12} />
                                </span>
                                <span className={theme ? "text-gray-400" : "text-slate-600"}>
                                    Use clear, unique names like <strong>Mathematics</strong> or <strong>Primary Wing</strong>.
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className={`p-0.5 rounded-full mt-0.5 ${theme ? "bg-blue-500/20 text-blue-400" : "bg-red-100 text-red-600"}`}>
                                    <HiOutlineCheck size={12} />
                                </span>
                                <span className={theme ? "text-gray-400" : "text-slate-600"}>
                                    Sections can be created under this department once registered.
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className={`p-0.5 rounded-full mt-0.5 ${theme ? "bg-blue-500/20 text-blue-400" : "bg-red-100 text-red-600"}`}>
                                    <HiOutlineCheck size={12} />
                                </span>
                                <span className={theme ? "text-gray-400" : "text-slate-600"}>
                                    Department Head can be assigned from the User Management pipeline.
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../../../components/theme/ThemeContext";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import SearchableDropdown from "../../../components/common/SearchableDropdown";
import { departmentService } from "../../../services/departmentService";
import { sectionService } from "../../../services/sectionService";
import { SECTION_HEAD_ROLE_CODE } from "../../../Types/Section-create";
import {
    HiOutlineOfficeBuilding,
    HiOutlineClipboardList,
    HiOutlineArrowLeft,
    HiOutlineSparkles,
    HiOutlineInformationCircle,
    HiOutlineCheck,
} from "react-icons/hi";
import { FaLayerGroup, FaUserTie, FaUsers } from "react-icons/fa";
import { toast } from "sonner";

export interface SectionCreate {
    sectionName: string;
    sectionHead: string;
    departmentId: string;
    description: string;
}

interface DropdownOption {
    value: string | number;
    label: string;
}

export default function CreateSection() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { sectionId } = useParams<{ sectionId: string }>();
    const isEditMode = Boolean(sectionId);
    const [loading, setLoading] = useState<boolean>(false);

    const [deptOptions, setDeptOptions] = useState<DropdownOption[]>([]);
    const [userOptions, setUserOptions] = useState<DropdownOption[]>([]);
    const [headsLoading, setHeadsLoading] = useState<boolean>(false);

    const [formData, setFormData] = useState<SectionCreate>({
        sectionName: "",
        sectionHead: "",
        departmentId: "",
        description: "",
    });

    useEffect(() => {
        if (!sectionId) return;
        const loadSection = async () => {
            try {
                const result = await sectionService.getSectionById(Number(sectionId));
                if (!result.success || !result.data) {
                    throw new Error(result.message || "Section not found");
                }
                setFormData({
                    sectionName: result.data.name,
                    sectionHead: result.data.sectionHeadId ? String(result.data.sectionHeadId) : "",
                    departmentId: String(result.data.departmentId),
                    description: result.data.description || "",
                });
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to load section");
                navigate("/dashboard/sections/list");
            }
        };
        void loadSection();
    }, [navigate, sectionId]);

    const fetchSectionHeadsForDepartment = async (departmentId: number) => {
        try {
            setHeadsLoading(true);
            const userData = await departmentService.getUsersByDepartment(departmentId);

            if (userData.success && Array.isArray(userData.data)) {
                const sectionHeadUsers = userData.data.filter(
                    (u: { roleCode?: string; role_code?: string }) =>
                        (u.roleCode || u.role_code) === SECTION_HEAD_ROLE_CODE
                );

                const mapped = sectionHeadUsers.map((u: { suid: number; name: string }) => ({
                    value: u.suid,
                    label: u.name,
                }));

                setUserOptions(mapped);

                if (sectionHeadUsers.length === 0) {
                    toast.info("No users with Section Head role found in this department.");
                }
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to load department users");
        } finally {
            setHeadsLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const deptData = await departmentService.getAllDepartments();
            if (deptData.success && Array.isArray(deptData.data)) {
                const mappedDepts = deptData.data.map((d: { departmentId: number; departmentName: string }) => ({
                    value: d.departmentId,
                    label: d.departmentName,
                }));
                setDeptOptions(mappedDepts);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to load departments");
        }
    };

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void fetchDepartments();
        }, 0);

        return () => window.clearTimeout(timer);
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            if (formData.departmentId) {
                void fetchSectionHeadsForDepartment(Number(formData.departmentId));
            } else {
                setUserOptions([]);
            }
            if (!isEditMode) {
                setFormData((prev) => ({ ...prev, sectionHead: "" }));
            }
        }, 0);

        return () => window.clearTimeout(timer);
    }, [formData.departmentId, isEditMode]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string | number) => {
        setFormData((prev) => ({ ...prev, [name]: String(value) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.departmentId) {
            toast.error("Please select a department");
            return;
        }
        if (!formData.sectionName.trim()) {
            toast.error("Please enter section name");
            return;
        }

        setLoading(true);

        try {
            const result = isEditMode
                ? await sectionService.updateSection(Number(sectionId), {
                      name: formData.sectionName,
                      description: formData.description || undefined,
                      sectionHead: formData.sectionHead ? Number(formData.sectionHead) : null,
                  })
                : await sectionService.createSection({
                      name: formData.sectionName,
                      departmentId: Number(formData.departmentId),
                      description: formData.description || undefined,
                      sectionHead: formData.sectionHead ? Number(formData.sectionHead) : null,
                  });

            if (result.success) {
                toast.success(isEditMode ? "Section updated successfully" : "Section created successfully");
                setFormData({
                    sectionName: "",
                    sectionHead: "",
                    departmentId: "",
                    description: "",
                });
                setUserOptions([]);
                navigate("/dashboard/sections/list");
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error creating section");
        } finally {
            setLoading(false);
        }
    };

    const selectedDeptLabel = deptOptions.find((d) => String(d.value) === String(formData.departmentId))?.label;
    const selectedHeadLabel = userOptions.find((u) => String(u.value) === String(formData.sectionHead))?.label;

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08] dark:border-white/[0.08]">
                <div className="flex items-center gap-3.5">
                    <button
                        type="button"
                        onClick={() => navigate("/dashboard/sections/list")}
                        className={`p-2.5 rounded-xl border transition-colors ${
                            theme
                                ? "bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-gray-300"
                                : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-sm"
                        }`}
                        title="Back to sections"
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
                        <HiOutlineClipboardList size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${theme ? "text-white" : "text-slate-900"}`}>
                                {isEditMode ? "Edit Section" : "Create Section"}
                            </h1>
                            <span
                                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                                    theme ? "bg-blue-500/10 text-blue-300 border border-blue-500/20" : "bg-red-50 text-red-700 border border-red-200"
                                }`}
                            >
                                {isEditMode ? `Section #${sectionId}` : "New Section"}
                            </span>
                        </div>
                        <p className={`text-xs sm:text-sm mt-0.5 ${theme ? "text-gray-400" : "text-slate-500"}`}>
                            Organize students, teachers, and lessons under a department.
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
                                    Section Hierarchy & Details
                                </h2>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className={`block text-xs font-semibold mb-1.5 ${theme ? "text-gray-300" : "text-slate-700"}`}>
                                        Department *
                                    </label>
                                    <SearchableDropdown
                                        placeholder="Select department..."
                                        searchPlaceholder="Search departments..."
                                        options={deptOptions}
                                        selectedValue={formData.departmentId}
                                        onSelect={(val) => handleSelectChange("departmentId", val)}
                                        disabled={isEditMode}
                                    />
                                </div>

                                <div>
                                    <label className={`block text-xs font-semibold mb-1.5 ${theme ? "text-gray-300" : "text-slate-700"}`}>
                                        Section Name *
                                    </label>
                                    <Input
                                        type="text"
                                        name="sectionName"
                                        value={formData.sectionName}
                                        onChange={handleInputChange}
                                        icon={<HiOutlineClipboardList className="text-lg" />}
                                        placeholder="e.g. Grade 10 - Division A, Batch 2026"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className={`block text-xs font-semibold mb-1.5 ${theme ? "text-gray-300" : "text-slate-700"}`}>
                                        Section Head <span className="opacity-60 font-normal">(Optional)</span>
                                    </label>
                                    <SearchableDropdown
                                        placeholder={
                                            headsLoading
                                                ? "Loading section heads..."
                                                : !formData.departmentId
                                                ? "Select department first..."
                                                : userOptions.length === 0
                                                ? "No Section Heads in this department"
                                                : "Assign section head..."
                                        }
                                        searchPlaceholder="Search section heads..."
                                        options={userOptions}
                                        selectedValue={formData.sectionHead}
                                        onSelect={(val) => handleSelectChange("sectionHead", val)}
                                        disabled={headsLoading || !formData.departmentId || userOptions.length === 0}
                                    />
                                </div>

                                <div>
                                    <label className={`block text-xs font-semibold mb-1.5 ${theme ? "text-gray-300" : "text-slate-700"}`}>
                                        Description & Notes <span className="opacity-60 font-normal">(Optional)</span>
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={3}
                                        placeholder="Enter details, room location, or batch notes for this section..."
                                        className={`w-full px-4 py-2.5 text-sm rounded-xl border outline-none transition-all ${
                                            theme
                                                ? "bg-black/30 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500"
                                                : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-red-500"
                                        }`}
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
                                    onClick={() => navigate("/dashboard/sections/list")}
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
                                    className={`flex-1 sm:flex-none min-w-36 text-xs font-semibold ${
                                        theme ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"
                                    }`}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                            Saving...
                                        </span>
                                    ) : isEditMode ? (
                                        "Update Section"
                                    ) : (
                                        "Create Section"
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
                                Live Section Preview
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
                                    <FaLayerGroup size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`text-base font-bold truncate ${theme ? "text-white" : "text-slate-900"}`}>
                                        {formData.sectionName.trim() || "Section Name Preview"}
                                    </h4>
                                    <span
                                        className={`inline-block mt-0.5 text-[10px] font-medium px-2 py-0.5 rounded ${
                                            theme ? "bg-white/[0.06] text-gray-400" : "bg-slate-200 text-slate-600"
                                        }`}
                                    >
                                        {selectedDeptLabel || "No Department Selected"}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 opacity-70">
                                        <FaUserTie size={12} /> Section Head:
                                    </span>
                                    <span className="font-semibold">
                                        {selectedHeadLabel || "Unassigned"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 opacity-70">
                                        <FaUsers size={12} /> Enrolled Students:
                                    </span>
                                    <span className="font-semibold">0</span>
                                </div>
                            </div>

                            <p
                                className={`text-xs mt-3.5 line-clamp-3 leading-relaxed ${
                                    theme ? "text-gray-400" : "text-slate-600"
                                }`}
                            >
                                {formData.description.trim() ||
                                    "Provide notes, room number or timing details for this section."}
                            </p>
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
                                Section Guidelines
                            </h3>
                        </div>

                        <ul className="space-y-2.5 text-xs">
                            <li className="flex items-start gap-2">
                                <span className={`p-0.5 rounded-full mt-0.5 ${theme ? "bg-blue-500/20 text-blue-400" : "bg-red-100 text-red-600"}`}>
                                    <HiOutlineCheck size={12} />
                                </span>
                                <span className={theme ? "text-gray-400" : "text-slate-600"}>
                                    Sections subdivide departments into classrooms or batches.
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className={`p-0.5 rounded-full mt-0.5 ${theme ? "bg-blue-500/20 text-blue-400" : "bg-red-100 text-red-600"}`}>
                                    <HiOutlineCheck size={12} />
                                </span>
                                <span className={theme ? "text-gray-400" : "text-slate-600"}>
                                    Only users with <strong>Section Head</strong> role appear in the head selector.
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className={`p-0.5 rounded-full mt-0.5 ${theme ? "bg-blue-500/20 text-blue-400" : "bg-red-100 text-red-600"}`}>
                                    <HiOutlineCheck size={12} />
                                </span>
                                <span className={theme ? "text-gray-400" : "text-slate-600"}>
                                    Students can be enrolled under this section after creation.
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

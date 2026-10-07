/* eslint-disable @typescript-eslint/no-explicit-any */
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
    HiOutlineUser,
    HiOutlineClipboardList,
} from "react-icons/hi";
import { toast } from "sonner";

function SectionHeading({
    icon,
    title,
    theme,
}: {
    icon: React.ReactNode;
    title: string;
    theme: boolean;
}) {
    return (
        <div className="flex items-center gap-2 mb-4">
            <span
                className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${theme ? "bg-blue-500/10 text-blue-300" : "bg-red-500/10 text-red-600"
                    }`}
            >
                {icon}
            </span>
            <h3
                className={`text-xs font-semibold uppercase tracking-wider ${theme ? "text-gray-400" : "text-neutral-500"
                    }`}
            >
                {title}
            </h3>
            <div className={`flex-1 h-px ${theme ? "bg-gray-800" : "bg-neutral-200"}`} />
        </div>
    );
}

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

    // 🎯 FIX: backend camelCase mokle chhe (sectionHeadId, departmentId), snake_case nahi
    useEffect(() => {
        if (!sectionId) return;
        const loadSection = async () => {
            try {
                const result = await sectionService.getSectionById(Number(sectionId));
                if (!result.success || !result.data) throw new Error(result.message || "Section not found");
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

    // 🎯 Aa j real fix che: /departments/:id/users API vaparo (role_code sathe aave che)
    // ane sirf SECTION_HEAD role wala users j dropdown ma batavo
    const fetchSectionHeadsForDepartment = async (departmentId: number) => {
        try {
            setHeadsLoading(true);
            const userData = await departmentService.getUsersByDepartment(departmentId);

            if (userData.success && Array.isArray(userData.data)) {
                // 🎯 FIX: backend camelCase mokle chhe (roleCode), role_code nahi
                const sectionHeadUsers = userData.data.filter(
                    (u: any) => u.roleCode === SECTION_HEAD_ROLE_CODE
                );

                const mapped = sectionHeadUsers.map((u: any) => ({
                    value: u.suid,
                    label: u.name,
                }));

                setUserOptions(mapped);

                if (sectionHeadUsers.length === 0) {
                    toast.info("આ Department માં હાલ કોઈ Section Head role વાળો User નથી.");
                }
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to load department users");
        } finally {
            setHeadsLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const deptData = await departmentService.getAllDepartments();
            if (deptData.success && Array.isArray(deptData.data)) {
                // 🎯 FIX: backend camelCase mokle chhe (departmentId, departmentName), snake_case nahi
                const mappedDepts = deptData.data.map((d: any) => ({
                    value: d.departmentId,
                    label: d.departmentName,
                }));
                setDeptOptions(mappedDepts);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to load departments");
        }
    };

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void fetchDepartments();
        }, 0);

        return () => window.clearTimeout(timer);
    }, []);

    // 🎯 Jyare department badlay, tyare tya na "Section Head" role wala users j fetch karo
    useEffect(() => {
        const timer = window.setTimeout(() => {
            if (formData.departmentId) {
                void fetchSectionHeadsForDepartment(Number(formData.departmentId));
            } else {
                setUserOptions([]);
            }
            setFormData((prev) => ({ ...prev, sectionHead: "" }));
        }, 0);

        return () => window.clearTimeout(timer);
    }, [formData.departmentId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string | number) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
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
            // sectionHead ek alag field tarike jay che, description ma nahi
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
                if (isEditMode) navigate("/dashboard/sections/list");
            }
        } catch (error: any) {
            toast.error(error.message || "Error creating section");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className={`max-w-7xl mx-auto p-6 sm:p-8 rounded-2xl shadow-sm mt-6 border transition-all duration-200 ${theme
                ? "bg-gray-900 border-gray-800 text-white"
                : "bg-white border-neutral-200 text-neutral-900"
                }`}
        >
            <div className="mb-8 pb-6 border-b flex flex-col items-center text-center gap-2 border-neutral-200 dark:border-gray-800">
                <div
                    className={`w-16 h-16 text-white rounded-full shadow-lg ${theme
                        ? "bg-linear-to-bl from-blue-300 to-blue-900 shadow-blue-950/40"
                        : "bg-linear-to-bl from-red-300 to-red-900 shadow-red-950/20"
                        } flex items-center justify-center mb-1`}
                >
                    <HiOutlineClipboardList size={24} />
                </div>
                <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight ${theme ? "text-blue-200" : "text-red-600"}`}>
                    {isEditMode ? "Edit Section" : "Create Section"}
                </h2>
                <p className={`text-sm max-w-md ${theme ? "text-gray-400" : "text-neutral-500"}`}>
                    Fill in the details below to register a new section under a department.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                    <SectionHeading icon={<HiOutlineOfficeBuilding size={15} />} title="Select Department" theme={theme} />
                    <SearchableDropdown
                        label="Department"
                        placeholder="Select a department"
                        searchPlaceholder="Search departments..."
                        options={deptOptions}
                        selectedValue={formData.departmentId}
                        onSelect={(val) => handleSelectChange("departmentId", val)}
                        required={true}
                    />
                </div>

                <div>
                    <SectionHeading icon={<HiOutlineOfficeBuilding size={15} />} title="Section Identity" theme={theme} />
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Section Name *</label>
                            <Input
                                type="text"
                                name="sectionName"
                                value={formData.sectionName}
                                onChange={handleInputChange}
                                icon={<HiOutlineOfficeBuilding className="text-lg" />}
                                placeholder="Enter section name"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Optional description about this section"
                                rows={3}
                                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors ${theme
                                    ? "bg-gray-800/60 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
                                    : "bg-white border-gray-200/80 text-gray-800 placeholder-gray-400 focus:border-red-600"
                                    }`}
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <SectionHeading icon={<HiOutlineUser size={15} />} title="Section Head Assignment (Optional)" theme={theme} />
                    <SearchableDropdown
                        label="Assign Section Head"
                        placeholder={
                            !formData.departmentId
                                ? "Please select a department first"
                                : headsLoading
                                    ? "Loading users..."
                                    : userOptions.length === 0
                                        ? "No Section Head available in this department"
                                        : "Select a user as head (optional)"
                        }
                        searchPlaceholder="Search users..."
                        options={userOptions}
                        selectedValue={formData.sectionHead}
                        onSelect={(val) => handleSelectChange("sectionHead", val)}
                        disabled={!formData.departmentId || headsLoading || userOptions.length === 0}
                        required={false}
                    />
                    <p className={`text-xs mt-1.5 ${theme ? "text-gray-500" : "text-neutral-400"}`}>
                        Only users with "Section Head" role from the selected department are shown here.
                    </p>
                </div>

                <div className="flex justify-end items-center gap-3 pt-6 border-t border-neutral-200 dark:border-gray-800">
                    <p className={`text-xs mr-auto hidden sm:block ${theme ? "text-gray-500" : "text-neutral-400"}`}>
                        Fields marked * are required.
                    </p>
                    <Button
                        type="submit"
                        disabled={loading}
                        className={`${theme ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"
                            } min-w-45 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                Processing...
                            </span>
                        ) : isEditMode ? "Update Section" : "Create Section"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
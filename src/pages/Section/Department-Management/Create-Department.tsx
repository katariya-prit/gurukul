import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../../../components/theme/ThemeContext";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import DescriptionInput from "../../../components/common/DescriptionInput";

import {
    HiOutlineOfficeBuilding,
    HiOutlineDocumentText,
} from "react-icons/hi";
import { FaBuilding } from "react-icons/fa";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

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
                const response = await fetch(`${API_URL}/departments/${departmentId}`);
                const result = await response.json();
                if (!response.ok || !result.success) throw new Error(result.message || "Department not found");
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
            // બેકએન્ડ API કોલ
            const response = await fetch(
                isEditMode ? `${API_URL}/departments/${departmentId}` : `${API_URL}/departments/create`,
                {
                    method: isEditMode ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formData),
                }
            );

            const result = await response.json();

            console.log("Backend Department Response:", result);

            if (result.success) {
                toast.success(isEditMode ? "Department updated successfully!" : "Department created successfully!");

                // ફોર્મ ક્લિયર કરવું
                setFormData({
                    departmentName: "",
                    description: "",
                });
                if (isEditMode) navigate("/dashboard/departments/list");
            } else {
                toast.error(result.message || "Failed to create department");
            }
        } catch {
            toast.error("Something went wrong with the server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className={`max-w-7xl mx-auto p-6 sm:p-8 rounded-2xl shadow-sm mt-6 border transition-all duration-200 ${theme ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-neutral-200 text-neutral-900"
                }`}
        >
            {/* ===== Header ===== */}
            <div className="mb-8 pb-6 border-b flex flex-col items-center text-center gap-2 border-neutral-200 dark:border-gray-800">
                <div
                    className={`w-16 h-16 text-white rounded-full shadow-lg ${theme
                        ? "bg-linear-to-bl from-blue-300 to-blue-900 shadow-blue-950/40"
                        : "bg-linear-to-bl from-red-300 to-red-900 shadow-red-950/20"
                        } flex items-center justify-center mb-1`}
                >
                    <FaBuilding size={24} />
                </div>
                <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight ${theme ? "text-blue-200" : "text-red-600"}`}>
                    {isEditMode ? "Update Department" : "Create Department"}
                </h2>
                <p className={`text-sm max-w-md ${theme ? "text-gray-400" : "text-neutral-500"}`}>
                    Fill in the details below to register a new department.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* ===== Department Identity section ===== */}
                <div>
                    <SectionHeading icon={<HiOutlineOfficeBuilding size={15} />} title="Department Identity" theme={theme} />
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Department Name *</label>
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

                {/* ===== Description section ===== */}
                <div>
                    <SectionHeading icon={<HiOutlineDocumentText size={15} />} title="Description" theme={theme} />
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

                {/* ===== Submit Button ===== */}
                <div className="flex justify-end items-center gap-3 pt-6 border-t border-neutral-200 dark:border-gray-800">
                    <p className={`text-xs mr-auto hidden sm:block ${theme ? "text-gray-500" : "text-neutral-400"}`}>
                        Fields marked * are required.
                    </p>
                    <Button
                        type="submit"
                        disabled={loading}
                        className={`${theme ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"} min-w-45 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                Processing...
                            </span>
                        ) : (
                            "Create Department"
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
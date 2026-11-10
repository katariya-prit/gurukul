import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../../components/theme/ThemeContext";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import SearchableDropdown from "../../../components/common/SearchableDropdown";
import DatePicker from "../../../components/common/Calendar";
import ImageUploader from "../../../components/common/ImageUploader";
import {
    HiOutlineUser,
    HiOutlineIdentification,
    HiOutlineKey,
    HiOutlineOfficeBuilding,
    HiOutlineCalendar,
    HiOutlineShieldCheck,
    HiOutlineArrowLeft,
    HiOutlineSparkles,
} from "react-icons/hi";
import type { UserCreate } from "../../../Types/User-create";
import { FaUserCircle } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

interface RoleOption {
    roleName: string;
    roleCode: string;
}

interface DepartmentOption {
    departmentId: number;
    departmentName: string;
    description?: string;
    departmentHeadId?: number | null;
    departmentHeadName?: string | null;
    created_at?: string;
}

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
                className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${
                    theme ? "bg-blue-500/10 text-blue-300" : "bg-red-500/10 text-red-600"
                }`}
            >
                {icon}
            </span>
            <h3
                className={`text-xs font-semibold uppercase tracking-wider ${
                    theme ? "text-gray-400" : "text-neutral-500"
                }`}
            >
                {title}
            </h3>
            <div className={`flex-1 h-px ${theme ? "bg-gray-800" : "bg-neutral-200"}`} />
        </div>
    );
}

export default function CreateUserForm() {
    const { theme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");

    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [departments, setDepartments] = useState<DepartmentOption[]>([]);

    const incomingData = location.state as {
        id: number;
        applicantName: string;
        requestedRole: string;
        departmentId: number;
    } | null;

    const isUserRole = incomingData?.requestedRole === "USER";

    const [formData, setFormData] = useState<UserCreate>(() => ({
        suid: incomingData?.id ? Number(incomingData.id) : 0,
        avatar: "",
        name: incomingData?.applicantName || "",
        username: "",
        password: "",
        bod: new Date().toISOString().split("T")[0],
        roleCode: "",
        departmentId: incomingData?.departmentId || null,
        sectionId: 0,
        standardId: 0,
        joiningDate: new Date().toISOString().split("T")[0],
        status: isUserRole ? "PENDING" : "APPROVED",
    }));

    const isHeadRole = formData.roleCode === "HEAD100";
    const isFromPipeline = !!incomingData;

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [rolesRes, deptsRes] = await Promise.all([
                    fetch(`${API_URL}/roles`, {
                        credentials: "include",
                    }),
                    fetch(`${API_URL}/departments`, {
                        credentials: "include",
                    }),
                ]);

                const rolesResult = await rolesRes.json();
                const deptsResult = await deptsRes.json();

                if (rolesRes.ok && rolesResult.success) {
                    setRoles(rolesResult.data);

                    if (incomingData) {
                        const matched = rolesResult.data.find(
                            (r: RoleOption) => r.roleCode === incomingData.requestedRole
                        );
                        if (matched) {
                            setFormData((prev) => ({
                                ...prev,
                                roleCode: matched.roleCode,
                            }));
                        }
                    }
                }

                if (deptsRes.ok && deptsResult.success) {
                    setDepartments(deptsResult.data);
                }
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };

        void fetchInitialData();
    }, [incomingData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "suid" ? (value === "" ? 0 : Number(value)) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage("");

        try {
            const finalPayload = {
                ...formData,
                departmentId: formData.roleCode === "HEAD100" ? formData.departmentId : null,
                sectionId: formData.sectionId ? formData.sectionId : null,
                standardId: formData.standardId ? formData.standardId : null,
            };

            const response = await fetch(`${API_URL}/users/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(finalPayload),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Failed to create user from server.");
            }

            if (isFromPipeline && incomingData) {
                const allReqs = localStorage.getItem("admission_requests");
                if (allReqs) {
                    const parsedReqs = JSON.parse(allReqs);
                    const filteredReqs = parsedReqs.filter(
                        (r: { id: number }) => r.id !== incomingData.id
                    );
                    localStorage.setItem("admission_requests", JSON.stringify(filteredReqs));
                }
                navigate(`/dashboard/departments/${formData.departmentId}/student-list`);
            } else {
                navigate("/dashboard/users/list");
            }
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "An error occurred while creating the user.");
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
                        onClick={() => navigate("/dashboard/users/list")}
                        className={`p-2.5 rounded-xl border transition-colors ${
                            theme
                                ? "bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-gray-300"
                                : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-sm"
                        }`}
                        title="Back to users"
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
                        <FaUserCircle size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${theme ? "text-white" : "text-slate-900"}`}>
                                {isFromPipeline ? "Onboard Approved Applicant" : "Create User Profile"}
                            </h1>
                            <span
                                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                                    theme ? "bg-blue-500/10 text-blue-300 border border-blue-500/20" : "bg-red-50 text-red-700 border border-red-200"
                                }`}
                            >
                                {isFromPipeline ? `Applicant #${incomingData?.id}` : "New Account"}
                            </span>
                        </div>
                        <p className={`text-xs sm:text-sm mt-0.5 ${theme ? "text-gray-400" : "text-slate-500"}`}>
                            Configure credentials, role privileges, and department allocation.
                        </p>
                    </div>
                </div>
            </div>

            {errorMessage && (
                <div
                    role="alert"
                    className={`flex items-start gap-2.5 p-3.5 rounded-xl text-xs font-medium border ${
                        theme
                            ? "bg-red-500/10 text-red-300 border-red-500/20"
                            : "bg-red-50 text-red-700 border-red-200"
                    }`}
                >
                    <span className="mt-0.5 shrink-0">⚠</span>
                    <span>{errorMessage}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-4 space-y-6">
                        <div
                            className={`rounded-2xl border p-6 flex flex-col items-center text-center transition-all ${
                                theme ? "bg-white/[0.02] border-white/[0.08]" : "bg-white border-slate-200 shadow-sm"
                            }`}
                        >
                            <span
                                className={`text-xs font-bold uppercase tracking-wider mb-4 ${
                                    theme ? "text-gray-300" : "text-slate-800"
                                }`}
                            >
                                Profile Picture
                            </span>
                            <ImageUploader
                                value={formData.avatar}
                                onChange={(url) => setFormData((prev) => ({ ...prev, avatar: url }))}
                                theme={theme}
                                uploadType="avatar"
                                shape="circle"
                                size={120}
                                label="Profile photo"
                            />
                            <p className={`text-[11px] mt-3 ${theme ? "text-gray-400" : "text-slate-500"}`}>
                                JPEG, PNG or WebP up to 5MB.
                            </p>
                        </div>

                        <div
                            className={`rounded-2xl border p-5 sm:p-6 transition-all ${
                                theme ? "bg-white/[0.02] border-white/[0.08]" : "bg-white border-slate-200 shadow-sm"
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/[0.06] dark:border-white/[0.06]">
                                <HiOutlineSparkles className={theme ? "text-blue-400" : "text-red-600"} size={16} />
                                <h3 className={`text-xs font-bold uppercase tracking-wider ${theme ? "text-gray-300" : "text-slate-800"}`}>
                                    Quick Summary
                                </h3>
                            </div>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                                    <span className="opacity-70">Full Name</span>
                                    <span className="font-semibold">{formData.name || "—"}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                                    <span className="opacity-70">SUID</span>
                                    <span className="font-mono font-semibold">{formData.suid || "—"}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                                    <span className="opacity-70">Role</span>
                                    <span className="font-semibold">{formData.roleCode || "Unselected"}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="opacity-70">Status</span>
                                    <span className={`font-semibold ${theme ? "text-blue-400" : "text-red-600"}`}>
                                        {formData.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-6">
                        <div
                            className={`rounded-2xl border p-5 sm:p-7 transition-all ${
                                theme ? "bg-white/[0.02] border-white/[0.08]" : "bg-white border-slate-200 shadow-sm"
                            }`}
                        >
                            <SectionHeading
                                icon={<HiOutlineIdentification className="text-sm" />}
                                title="Identity & Credentials"
                                theme={theme}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-xs font-semibold mb-1.5 ${theme ? "text-gray-300" : "text-slate-700"}`}>
                                        User ID (SUID) *
                                    </label>
                                    <Input
                                        type="number"
                                        name="suid"
                                        value={formData.suid ? String(formData.suid) : ""}
                                        onChange={handleInputChange}
                                        onWheel={(e) => e.currentTarget.blur()}
                                        icon={<HiOutlineIdentification className="text-lg" />}
                                        placeholder="e.g. 221255"
                                        required
                                        disabled={isFromPipeline}
                                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                </div>

                                <div>
                                    <label className={`block text-xs font-semibold mb-1.5 ${theme ? "text-gray-300" : "text-slate-700"}`}>
                                        Full Name *
                                    </label>
                                    <Input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        icon={<HiOutlineUser className="text-lg" />}
                                        placeholder="Enter full name"
                                        required
                                        disabled={isFromPipeline}
                                    />
                                </div>

                                <div>
                                    <label className={`block text-xs font-semibold mb-1.5 ${theme ? "text-gray-300" : "text-slate-700"}`}>
                                        Username *
                                    </label>
                                    <Input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        icon={<HiOutlineUser className="text-lg" />}
                                        placeholder="e.g. rahul_p"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className={`block text-xs font-semibold mb-1.5 ${theme ? "text-gray-300" : "text-slate-700"}`}>
                                        Password *
                                    </label>
                                    <Input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        icon={<HiOutlineKey className="text-lg" />}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div
                            className={`rounded-2xl border p-5 sm:p-7 transition-all ${
                                theme ? "bg-white/[0.02] border-white/[0.08]" : "bg-white border-slate-200 shadow-sm"
                            }`}
                        >
                            <SectionHeading
                                icon={<HiOutlineShieldCheck className="text-sm" />}
                                title="Role & Department Allocation"
                                theme={theme}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SearchableDropdown
                                    label="Select Role *"
                                    placeholder={roles.length === 0 ? "Loading roles..." : "Choose Role"}
                                    options={roles.map((r) => ({
                                        value: r.roleCode,
                                        label: `${r.roleName} (${r.roleCode})`,
                                    }))}
                                    selectedValue={formData.roleCode || ""}
                                    onSelect={(val) => {
                                        const selectedRole = roles.find((r) => r.roleCode === String(val));
                                        setFormData((prev) => ({
                                            ...prev,
                                            roleCode: selectedRole?.roleCode ?? "",
                                            status: selectedRole?.roleCode === "USER" ? "PENDING" : "APPROVED",
                                            ...(selectedRole?.roleCode !== "HEAD100" && {
                                                departmentId: null,
                                            }),
                                        }));
                                    }}
                                    required
                                    disabled={isFromPipeline || roles.length === 0}
                                />

                                {isHeadRole || isFromPipeline ? (
                                    <SearchableDropdown
                                        label="Assign Department *"
                                        placeholder={departments.length === 0 ? "Loading departments..." : "Choose Department"}
                                        options={departments.map((d) => ({
                                            value: d.departmentId,
                                            label: d.departmentName,
                                        }))}
                                        selectedValue={formData.departmentId || ""}
                                        onSelect={(val) => {
                                            setFormData((prev) => ({ ...prev, departmentId: Number(val) }));
                                        }}
                                        required
                                        disabled={departments.length === 0}
                                    />
                                ) : (
                                    <div
                                        className={`flex items-center gap-2.5 border border-dashed rounded-xl p-3.5 text-xs ${
                                            theme
                                                ? "border-white/10 bg-white/[0.02] text-gray-400"
                                                : "border-slate-200 bg-slate-50 text-slate-500"
                                        }`}
                                    >
                                        <HiOutlineOfficeBuilding className="text-base shrink-0" />
                                        Department allocation is specifically for Department Head roles.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div
                            className={`rounded-2xl border p-5 sm:p-7 transition-all ${
                                theme ? "bg-white/[0.02] border-white/[0.08]" : "bg-white border-slate-200 shadow-sm"
                            }`}
                        >
                            <SectionHeading
                                icon={<HiOutlineCalendar className="text-sm" />}
                                title="Important Dates"
                                theme={theme}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DatePicker
                                    label="Joining Date *"
                                    selectedValue={formData.joiningDate}
                                    onChange={(dateStr) => setFormData((prev) => ({ ...prev, joiningDate: dateStr }))}
                                    required
                                />
                                <DatePicker
                                    label="Birth Date (DOB) *"
                                    selectedValue={formData.bod}
                                    onChange={(dateStr) => setFormData((prev) => ({ ...prev, bod: dateStr }))}
                                    required
                                />
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
                                    onClick={() => navigate("/dashboard/users/list")}
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
                                    disabled={loading || roles.length === 0}
                                    className={`flex-1 sm:flex-none min-w-44 text-xs font-semibold ${
                                        theme ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"
                                    }`}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                            Processing...
                                        </span>
                                    ) : isFromPipeline ? (
                                        "Confirm & Generate User"
                                    ) : (
                                        "Create User Profile"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

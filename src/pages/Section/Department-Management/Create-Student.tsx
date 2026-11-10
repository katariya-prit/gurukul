import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../../../components/theme/ThemeContext";
import {
    User,
    Hash,
    Lock,
    Eye,
    EyeOff,
    Layers,
    ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import Button from "../../../components/common/Button";
import PremiumDateField from "../../../components/Students/PremiumDateField";
import SearchableDropdown from "../../../components/common/SearchableDropdown";
import ImageUploader from "../../../components/common/ImageUploader";
import type { StudentFormData } from "../../../Types/Student";
import { sectionService } from "../../../services/sectionService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

const ROLE_OPTIONS = [
    { value: "STUDENT", label: "Student" },
    { value: "SECHEAD101", label: "Section Head" },
];

const CreateStudent = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { deptId, sectionId } = useParams<{ deptId: string; sectionId: string }>();

    const [formData, setFormData] = useState<StudentFormData>({
        suid: "",
        fullName: "",
        birthdate: new Date().toISOString().split("T")[0],
        joiningDate: new Date().toISOString().split("T")[0],
        username: "",
        password: "",
    });

    const [roleCode, setRoleCode] = useState<string>("STUDENT");

    const [sectionName, setSectionName] = useState<string>("");
    const [departmentName, setDepartmentName] = useState<string>("");
    const [sectionLoading, setSectionLoading] = useState(true);
    const [sectionError, setSectionError] = useState<string | null>(null);

    const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchSectionDetail = async () => {
            const parsedSectionId = Number(sectionId);
            if (!sectionId || Number.isNaN(parsedSectionId)) {
                setSectionLoading(false);
                setSectionError("Invalid or missing section link. Please open this page from a section.");
                return;
            }

            try {
                setSectionLoading(true);
                setSectionError(null);
                const result = await sectionService.getSectionById(parsedSectionId);
                if (result.success && result.data) {
                    setSectionName(result.data.name);
                    setDepartmentName(result.data.departmentName || "");
                } else {
                    setSectionError(result.message || "Section not found.");
                }
            } catch {
                toast.error("Failed to load section details.");
                setSectionError("Failed to load section details.");
            } finally {
                setSectionLoading(false);
            }
        };
        void fetchSectionDetail();
    }, [sectionId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (fieldName: string, dateStr: string) => {
        setFormData((prev) => ({ ...prev, [fieldName]: dateStr }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!deptId || !sectionId || Number.isNaN(Number(sectionId)) || Number.isNaN(Number(deptId))) {
            toast.error("Department/Section missing. Open this page from a section link.");
            return;
        }
        if (
            !formData.suid ||
            !formData.fullName ||
            !formData.username ||
            !formData.password
        ) {
            toast.error("Please fill all required fields.");
            return;
        }
        if (!/^\d+$/.test(formData.suid)) {
            toast.error("SUID must be a valid number.");
            return;
        }
        if (!roleCode) {
            toast.error("Please select a role.");
            return;
        }

        try {
            setLoading(true);

            const payload = {
                suid: Number(formData.suid),
                avatar: profileImagePreview || "",
                name: formData.fullName,
                username: formData.username,
                password: formData.password,
                bod: formData.birthdate,
                departmentId: Number(deptId),
                sectionId: Number(sectionId),
                standardId: roleCode === "STUDENT" ? 1 : null,
                roleCode: roleCode,
                joiningDate: formData.joiningDate,
            };

            const response = await fetch(`${API_URL}/users/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const result = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(result?.message || "Failed to create profile.");
            }

            toast.success(
                roleCode === "SECHEAD101"
                    ? "Section Head created successfully. They are now the head of this section."
                    : "Student profile created successfully."
            );
            setFormData({
                suid: "",
                fullName: "",
                birthdate: new Date().toISOString().split("T")[0],
                joiningDate: new Date().toISOString().split("T")[0],
                username: "",
                password: "",
            });
            setRoleCode("STUDENT");
            setProfileImagePreview(null);
            navigate(-1);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const inputWrapperClasses = "relative group transition-all duration-300";
    const inputClasses = `w-full border rounded-xl py-3 pl-11 pr-4 focus:outline-none transition-all duration-300 ${
        theme
            ? "bg-black/30 border-white/10 text-white placeholder-gray-500 focus:border-blue-500"
            : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-red-500"
    }`;

    const iconClasses = `absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors z-10 ${
        theme ? "text-gray-500 group-focus-within:text-blue-400" : "text-slate-400 group-focus-within:text-red-500"
    }`;

    if (!sectionLoading && sectionError) {
        return (
            <div
                className={`max-w-2xl mx-auto p-8 rounded-2xl border text-center ${
                    theme ? "bg-white/[0.02] border-white/10 text-gray-200" : "bg-white border-slate-200 text-slate-800 shadow-sm"
                }`}
            >
                <p className="text-red-500 font-bold mb-2">{sectionError}</p>
                <p className={`text-sm ${theme ? "text-gray-400" : "text-slate-500"}`}>
                    Please navigate here from Sections list using the "Add Student" button.
                </p>
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08] dark:border-white/[0.08]">
                <div className="flex items-center gap-3.5">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className={`p-2.5 rounded-xl border transition-colors ${
                            theme
                                ? "bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-gray-300"
                                : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-sm"
                        }`}
                        title="Back"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                            theme
                                ? "bg-linear-to-br from-blue-500 to-indigo-700 text-white shadow-blue-500/20"
                                : "bg-linear-to-br from-red-600 to-rose-700 text-white shadow-red-500/20"
                        }`}
                    >
                        <Layers size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${theme ? "text-white" : "text-slate-900"}`}>
                                Create Section Member
                            </h1>
                            {!sectionLoading && sectionId && (
                                <span
                                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                                        theme ? "bg-blue-500/10 text-blue-300 border border-blue-500/20" : "bg-red-50 text-red-700 border border-red-200"
                                    }`}
                                >
                                    {departmentName || `Dept #${deptId}`} → {sectionName || `Section #${sectionId}`}
                                </span>
                            )}
                        </div>
                        <p className={`text-xs sm:text-sm mt-0.5 ${theme ? "text-gray-400" : "text-slate-500"}`}>
                            Provide details to enroll a new student or assign a section head.
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-4 space-y-6">
                        <div
                            className={`rounded-2xl border p-6 flex flex-col items-center text-center transition-all ${
                                theme ? "bg-white/[0.02] border-white/[0.08]" : "bg-white border-slate-200 shadow-sm"
                            }`}
                        >
                            <span className={`text-xs font-bold uppercase tracking-wider mb-4 ${theme ? "text-gray-300" : "text-slate-800"}`}>
                                Profile Avatar
                            </span>
                            <ImageUploader
                                value={profileImagePreview}
                                onChange={setProfileImagePreview}
                                theme={theme}
                                uploadType="avatar"
                                shape="circle"
                                size={120}
                                label="Profile picture"
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
                            <span className={`text-xs font-bold uppercase tracking-wider block mb-3 pb-2 border-b border-white/[0.06] ${theme ? "text-gray-300" : "text-slate-800"}`}>
                                Role Selection
                            </span>
                            <SearchableDropdown
                                options={ROLE_OPTIONS}
                                selectedValue={roleCode}
                                onSelect={(val) => setRoleCode(String(val))}
                                placeholder="Select Role"
                                label="Assign Role *"
                            />
                            <p className={`text-[11px] mt-2 ${theme ? "text-gray-400" : "text-slate-500"}`}>
                                {roleCode === "SECHEAD101"
                                    ? "This user will become the designated Section Head."
                                    : "This user will be enrolled as a student."}
                            </p>
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-6">
                        <div
                            className={`rounded-2xl border p-5 sm:p-7 transition-all ${
                                theme ? "bg-white/[0.02] border-white/[0.08]" : "bg-white border-slate-200 shadow-sm"
                            }`}
                        >
                            <span className={`text-xs font-bold uppercase tracking-wider block mb-5 pb-3 border-b border-white/[0.06] ${theme ? "text-gray-300" : "text-slate-800"}`}>
                                Personal Details
                            </span>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className={`text-xs font-semibold ${theme ? "text-gray-300" : "text-slate-700"}`}>
                                        Unique Student ID (SUID) <span className="text-red-500">*</span>
                                    </label>
                                    <div className={inputWrapperClasses}>
                                        <Hash size={18} className={iconClasses} />
                                        <input
                                            type="text"
                                            name="suid"
                                            value={formData.suid}
                                            onChange={handleInputChange}
                                            placeholder="e.g. 10245"
                                            required
                                            className={inputClasses}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className={`text-xs font-semibold ${theme ? "text-gray-300" : "text-slate-700"}`}>
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className={inputWrapperClasses}>
                                        <User size={18} className={iconClasses} />
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Parth Patel"
                                            required
                                            className={inputClasses}
                                        />
                                    </div>
                                </div>

                                <PremiumDateField
                                    label="Date of Birth"
                                    value={formData.birthdate}
                                    onChange={(val) => handleDateChange("birthdate", val)}
                                    theme={theme}
                                    required
                                />

                                <PremiumDateField
                                    label="Enrollment / Joining Date"
                                    value={formData.joiningDate}
                                    onChange={(val) => handleDateChange("joiningDate", val)}
                                    theme={theme}
                                    required
                                />
                            </div>
                        </div>

                        <div
                            className={`rounded-2xl border p-5 sm:p-7 transition-all ${
                                theme ? "bg-white/[0.02] border-white/[0.08]" : "bg-white border-slate-200 shadow-sm"
                            }`}
                        >
                            <span className={`text-xs font-bold uppercase tracking-wider block mb-5 pb-3 border-b border-white/[0.06] ${theme ? "text-gray-300" : "text-slate-800"}`}>
                                Account Credentials
                            </span>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className={`text-xs font-semibold ${theme ? "text-gray-300" : "text-slate-700"}`}>
                                        Username <span className="text-red-500">*</span>
                                    </label>
                                    <div className={inputWrapperClasses}>
                                        <User size={18} className={iconClasses} />
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            placeholder="e.g. parth_10"
                                            required
                                            className={inputClasses}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className={`text-xs font-semibold ${theme ? "text-gray-300" : "text-slate-700"}`}>
                                        Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className={inputWrapperClasses}>
                                        <Lock size={18} className={iconClasses} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="••••••••"
                                            required
                                            className={`${inputClasses} pr-10`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 z-10"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
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
                                    onClick={() => navigate(-1)}
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
                                    className={`flex-1 sm:flex-none min-w-44 text-xs font-semibold ${
                                        theme ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"
                                    }`}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                            Enrolling...
                                        </span>
                                    ) : (
                                        "Create Member Profile"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreateStudent;

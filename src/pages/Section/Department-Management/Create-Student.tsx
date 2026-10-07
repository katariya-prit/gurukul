import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTheme } from "../../../components/theme/ThemeContext";
import {
    User,
    Hash,
    Lock,
    Calendar,
    BookOpen,
    Eye,
    EyeOff,
    Layers,
    ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import Input from "../../../components/common/Input";
import PremiumDateField from "../../../components/Students/PremiumDateField";
import SearchableDropdown from "../../../components/common/SearchableDropdown";
import ImageUploader from "../../../components/common/ImageUploader";
import type { StudentFormData } from "../../../Types/Student";
import { sectionService } from "../../../services/sectionService";

// 🎯 FIX: typo hatu "VITsE_API_URL", sahi chhe "VITE_API_URL"
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

// Aa form ma have fakt 2 j role select thai shake chhe —
// Section Head (SECHEAD101) ane Student (STUDENT). Role code database
// na "roles" table na role_code sathe exact match hovo joie.
const ROLE_OPTIONS = [
    { value: "STUDENT", label: "Student" },
    { value: "SECHEAD101", label: "Section Head" },
];

const CreateStudent = () => {
    const { theme } = useTheme();
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
    const [sectionError, setSectionError] = useState<string | null>(null); // 🎯 FIX: invalid id na case ma error dekhadva mate

    const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchSectionDetail = async () => {
            // 🎯 FIX: sectionId missing hoy, "undefined" string hoy, ya number na hoy
            // to API call j na karo — URL ma NaN jashe to backend 500 aapshe
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
                    // 🎯 FIX: backend camelCase mokle chhe (departmentName), snake_case nahi
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
        fetchSectionDetail();
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
                standardId: roleCode === "STUDENT" ? 1 : null, // ⚠️ TODO: Standard/Class dropdown add karvani baki che
                roleCode: roleCode,
                joiningDate: formData.joiningDate,
            };

            const token = localStorage.getItem("token"); // 🎯 FIX: register route have auth-protected chhe

            const response = await fetch(`${API_URL}/users/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
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
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const inputWrapperClasses = "relative group transition-all duration-300";
    const inputClasses = `w-full border rounded-xl py-3 pl-11 pr-4 focus:outline-none transition-all duration-500 ease-out transform group-hover:-translate-y-1 focus-within:-translate-y-1 ${theme
        ? "bg-[#1f2937]/80 border-gray-700/60 text-white placeholder-gray-500 group-hover:border-blue-500/50 group-hover:bg-[#1f2937] group-hover:shadow-[0_8px_20px_-5px_rgba(59,130,246,0.15)] focus:border-blue-500 focus:bg-[#1f2937] focus:shadow-[0_8px_25px_-5px_rgba(59,130,246,0.2)] focus:ring-2 focus:ring-blue-500/20"
        : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 group-hover:border-red-400/60 group-hover:bg-white group-hover:shadow-[0_8px_20px_-5px_rgba(239,68,68,0.1)] focus:border-red-500 focus:bg-white focus:shadow-[0_8px_25px_-5px_rgba(239,68,68,0.15)] focus:ring-2 focus:ring-red-500/10"
        }`;

    const iconClasses = `absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-500 z-10 ${theme
        ? "text-gray-500 group-focus-within:text-blue-400 group-hover:text-blue-400"
        : "text-slate-400 group-focus-within:text-red-500 group-hover:text-red-500"
        }`;

    // 🎯 FIX: Invalid section link hoy to form j na dekhado, clear error dekhado
    if (!sectionLoading && sectionError) {
        return (
            <div className={`max-w-2xl mx-auto mt-10 p-8 rounded-2xl border text-center ${theme ? "bg-[#111827]/90 border-gray-800 text-gray-200" : "bg-white border-slate-100 text-slate-800"
                }`}>
                <p className="text-red-500 font-bold mb-2">{sectionError}</p>
                <p className={`text-sm ${theme ? "text-gray-400" : "text-slate-500"}`}>
                    Please navigate here from Sections list using the "Add Student" button.
                </p>
            </div>
        );
    }

    return (
        <div className={`group/maincard max-w-7xl mx-auto p-6 sm:p-8 rounded-3xl mt-6 mb-8 border transition-all duration-700 relative overflow-hidden font-sans backdrop-blur-xl ${theme
            ? "bg-[#111827]/90 border-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.5)] text-gray-200"
            : "bg-white/90 border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] text-slate-800"
            }`}>

            <div className={`absolute -top-32 -right-32 w-80 h-80 rounded-full blur-[90px] pointer-events-none transition-all duration-1000  ${theme ? "bg-blue-600/10 group-hover/maincard:bg-blue-600/15" : "bg-red-500/5 group-hover/maincard:bg-red-500/10"
                }`}></div>
            <div className={`absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-[90px] pointer-events-none transition-all duration-1000 group-hover/maincard:scale-110 ${theme ? "bg-purple-600/10 group-hover/maincard:bg-purple-600/15" : "bg-rose-500/5 group-hover/maincard:bg-rose-500/10"
                }`}></div>

            <div className={`mb-10 pb-6 border-b flex flex-col items-center text-center gap-3 relative z-10 transition-colors duration-500 ${theme ? "border-gray-800 group-hover/maincard:border-gray-700" : "border-slate-100 group-hover/maincard:border-slate-200"
                }`}>
                <div className={`w-16 h-16 text-white rounded-2xl shadow-lg flex items-center justify-center mb-1 transition-all duration-700 transform ${theme
                    ? "bg-linear-to-tr from-blue-600 via-indigo-500 to-purple-500 shadow-[0_8px_25px_-5px_rgba(59,130,246,0.5)]"
                    : "bg-linear-to-tr from-red-600 via-rose-500 to-orange-400 shadow-[0_8px_25px_-5px_rgba(239,68,68,0.4)]"
                    }`}>
                    <BookOpen size={30} className="drop-shadow-lg" />
                </div>

                <h1 className={`text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-linear-to-r tracking-tight transition-all duration-500 ${theme
                    ? "from-white via-blue-100 to-blue-300"
                    : "from-slate-900 via-slate-800 to-red-600"
                    }`}>
                    Create Section Member
                </h1>
                <p className={`text-sm sm:text-base font-medium tracking-wide max-w-md transition-colors duration-300 ${theme ? "text-gray-400" : "text-slate-500"
                    }`}>
                    Provide the required details to enroll a new student or assign a section head.
                </p>

                {!sectionLoading && sectionId && (
                    <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full text-xs font-bold ${theme ? "bg-blue-500/10 text-blue-300" : "bg-red-500/10 text-red-600"}`}>
                        <Layers size={13} />
                        {departmentName || `Dept #${deptId}`} → {sectionName || `Section #${sectionId}`}
                    </span>
                )}
            </div>

            <form onSubmit={handleSubmit} className="relative z-10 space-y-10">

                <div className="mb-6 flex flex-col items-center justify-center">
                    <ImageUploader
                        value={profileImagePreview}
                        onChange={setProfileImagePreview}
                        theme={theme}
                        uploadType="avatar"
                        shape="circle"
                        size={145}
                        label="Profile Photo"
                    />
                </div>

                <div className="space-y-8">

                    <div className="relative">
                        <h2 className={`text-sm font-black uppercase tracking-[0.2em] mb-5 flex items-center gap-2.5 transition-colors ${theme ? "text-gray-400" : "text-slate-500"
                            }`}>
                            <span className={`p-1.5 rounded-lg transition-colors duration-300 ${theme ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-500"}`}>
                                <ShieldCheck size={16} />
                            </span>
                            Role Assignment
                        </h2>
                        <div className="max-w-md">
                            <SearchableDropdown
                                label="Role"
                                placeholder="Select a role"
                                searchPlaceholder="Search role..."
                                options={ROLE_OPTIONS}
                                selectedValue={roleCode}
                                onSelect={(val) => setRoleCode(String(val))}
                                required
                            />
                            {roleCode === "SECHEAD101" && (
                                <p className={`text-xs mt-2 font-medium ${theme ? "text-blue-300" : "text-red-600"}`}>
                                    ⚡ This person will automatically become the Head of "{sectionName || `Section #${sectionId}`}".
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="relative">
                        <h2 className={`text-sm font-black uppercase tracking-[0.2em] mb-5 flex items-center gap-2.5 transition-colors ${theme ? "text-gray-400" : "text-slate-500"
                            }`}>
                            <span className={`p-1.5 rounded-lg transition-colors duration-300 ${theme ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-500"}`}>
                                <User size={16} />
                            </span>
                            Identity Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className={`text-sm font-semibold tracking-wide transition-colors ${theme ? "text-gray-300" : "text-slate-700"}`}>
                                    Student ID (SUID) <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    icon={<Hash />}
                                    type="text"
                                    name="suid"
                                    value={formData.suid}
                                    onChange={handleInputChange}
                                    placeholder="Enter SUID"
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className={`text-sm font-semibold tracking-wide transition-colors ${theme ? "text-gray-300" : "text-slate-700"}`}>
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    icon={<User size={20} />}
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    placeholder="Enter full name"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="relative z-50">
                        <h2 className={`text-sm font-black uppercase tracking-[0.2em] mb-5 flex items-center gap-2.5 transition-colors ${theme ? "text-gray-400" : "text-slate-500"}`}>
                            <span className={`p-1.5 rounded-lg transition-colors duration-300 ${theme ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-500"}`}>
                                <Calendar size={16} />
                            </span>
                            Important Dates
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 group/dates">
                            <PremiumDateField
                                label="Birthdate (BOD)"
                                value={formData.birthdate}
                                onChange={(dateStr) => handleDateChange("birthdate", dateStr)}
                                theme={theme}
                                required
                            />

                            <PremiumDateField
                                label="Joining Date"
                                value={formData.joiningDate}
                                onChange={(dateStr) => handleDateChange("joiningDate", dateStr)}
                                theme={theme}
                                required
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <h2 className={`text-sm font-black uppercase tracking-[0.2em] mb-5 flex items-center gap-2.5 transition-colors ${theme ? "text-gray-400" : "text-slate-500"
                            }`}>
                            <span className={`p-1.5 rounded-lg transition-colors duration-300 ${theme ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-500"}`}>
                                <Lock size={16} />
                            </span>
                            Account Credentials
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className={`text-sm font-semibold tracking-wide transition-colors ${theme ? "text-gray-300" : "text-slate-700"}`}>
                                    Username <span className="text-red-500">*</span>
                                </label>
                                <div className={inputWrapperClasses}>
                                    <User size={20} className={iconClasses} />
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        placeholder="Ex :  Username-123"
                                        required
                                        className={inputClasses}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className={`text-sm font-semibold tracking-wide transition-colors ${theme ? "text-gray-300" : "text-slate-700"}`}>
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <div className={inputWrapperClasses}>
                                    <Lock size={20} className={iconClasses} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="••••••••"
                                        required
                                        className={`${inputClasses} pr-12`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors z-20 ${theme ? "text-gray-400 hover:text-blue-400" : "text-slate-400 hover:text-red-500"
                                            }`}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <div className={`mt-10 border-t pt-7 flex flex-col sm:flex-row items-center justify-between gap-5 transition-colors duration-500 ${theme ? "border-gray-800" : "border-slate-100"
                    }`}>
                    <span className={`text-sm font-medium transition-colors ${theme ? "text-gray-500" : "text-slate-400"}`}>
                        <span className="text-red-500 mr-1">*</span>
                        Indicates required fields.
                    </span>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`group/btn relative overflow-hidden text-white font-bold text-lg py-3 px-8 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] active:scale-95 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none ${theme
                            ? "bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 shadow-[0_8px_15px_-5px_rgba(79,70,229,0.3)] hover:shadow-[0_15px_30px_-10px_rgba(79,70,229,0.5)] border border-blue-500/50 hover:border-blue-400"
                            : "bg-linear-to-r from-red-600 via-rose-600 to-red-700 shadow-[0_8px_15px_-5px_rgba(220,38,38,0.2)] hover:shadow-[0_15px_30px_-10px_rgba(220,38,38,0.4)] border border-red-500/30 hover:border-red-400"
                            }`}
                    >
                        <span className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/20 to-transparent translate-x-[-150%] skew-x-[-30deg] group-hover/btn:translate-x-[150%] transition-transform duration-700 ease-in-out"></span>
                        <span className="relative flex items-center justify-center gap-2">
                            {loading ? (
                                <>
                                    <span className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin"></span>
                                    Processing...
                                </>
                            ) : (
                                "Create Profile"
                            )}
                        </span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateStudent;
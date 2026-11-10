import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../../../components/theme/ThemeContext";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import Checkbox from "../../../components/common/Checkbox";
import {
    HiOutlineShieldCheck,
    HiOutlineDocumentText,
    HiOutlineArrowLeft,
    HiOutlineSearch,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
    HiOutlineSparkles,
} from "react-icons/hi";
import {
    FaShieldAlt,
    FaLayerGroup,
    FaComments,
    FaUsers,
    FaKey,
    FaBookOpen,
    FaUsersCog,
    FaGlobe,
} from "react-icons/fa";
import type { RoleCreate, PermissionRow } from "../../../Types/Role-create";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

interface CategoryMeta {
    category: string;
    icon: React.ReactNode;
    modules: string[];
}

const moduleGroups: CategoryMeta[] = [
    {
        category: "Core",
        icon: <FaLayerGroup className="text-sm" />,
        modules: ["Dashboard", "Permissions", "Progress"],
    },
    {
        category: "Communication",
        icon: <FaComments className="text-sm" />,
        modules: ["Community", "Chat"],
    },
    {
        category: "User Management",
        icon: <FaUsers className="text-sm" />,
        modules: ["Users", "Department", "Section", "Student"],
    },
    {
        category: "Roles",
        icon: <FaKey className="text-sm" />,
        modules: ["RolesPermissions"],
    },
    {
        category: "Lessons",
        icon: <FaBookOpen className="text-sm" />,
        modules: ["Lesson", "MyLessons"],
    },
    {
        category: "Groups",
        icon: <FaUsersCog className="text-sm" />,
        modules: ["Group"],
    },
    {
        category: "Website / Overview",
        icon: <FaGlobe className="text-sm" />,
        modules: ["OverviewEdit", "Activities", "UpcomingEvents", "AmrutNuAachaman", "DailyDarshan"],
    },
];

const allModulesList = moduleGroups.flatMap((g) => g.modules);

export default function CreateRole() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { roleCode: routeRoleCode } = useParams<{ roleCode: string }>();
    const isEditMode = Boolean(routeRoleCode);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [formData, setFormData] = useState<RoleCreate>({
        roleName: "",
        roleCode: "",
        description: "",
        permissions: allModulesList.reduce((acc, module) => {
            acc[module] = { create: false, edit: false, view: false, delete: false };
            return acc;
        }, {} as { [key: string]: PermissionRow }),
    });

    useEffect(() => {
        if (!routeRoleCode) return;

        const loadRole = async () => {
            try {
                const response = await fetch(`${API_URL}/roles`, {
                    credentials: "include",
                });
                const result = await response.json();
                const role = result.success
                    ? result.data.find(
                          (item: RoleCreate & { role_code?: string; roleCode?: string }) =>
                              (item.role_code || item.roleCode) === decodeURIComponent(routeRoleCode)
                      )
                    : null;

                if (!role) {
                    toast.error(result.message || "Role not found.");
                    navigate("/dashboard/permissions/lesson");
                    return;
                }

                setFormData({
                    roleName: role.role_name || role.roleName || "",
                    roleCode: role.role_code || role.roleCode || "",
                    description: role.description || "",
                    permissions: role.permissions || {},
                });
            } catch {
                toast.error("Failed to load role.");
            }
        };

        void loadRole();
    }, [navigate, routeRoleCode]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePermissionChange = (module: string, action: keyof PermissionRow) => {
        setFormData((prev) => {
            const currentPermission: PermissionRow =
                prev.permissions[module] ?? {
                    create: false,
                    edit: false,
                    view: false,
                    delete: false,
                };

            return {
                ...prev,
                permissions: {
                    ...prev.permissions,
                    [module]: {
                        ...currentPermission,
                        [action]: !currentPermission[action],
                    },
                },
            };
        });
    };

    const toggleAllForModule = (module: string, value: boolean) => {
        setFormData((prev) => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [module]: { create: value, edit: value, view: value, delete: value },
            },
        }));
    };

    const toggleAllForCategory = (categoryModules: string[], value: boolean) => {
        setFormData((prev) => {
            const updatedPermissions = { ...prev.permissions };
            categoryModules.forEach((module) => {
                updatedPermissions[module] = { create: value, edit: value, view: value, delete: value };
            });
            return { ...prev, permissions: updatedPermissions };
        });
    };

    const toggleGlobalAll = (value: boolean) => {
        setFormData((prev) => {
            const updatedPermissions = { ...prev.permissions };
            allModulesList.forEach((module) => {
                updatedPermissions[module] = { create: value, edit: value, view: value, delete: value };
            });
            return { ...prev, permissions: updatedPermissions };
        });
    };

    const isCategoryFullyChecked = (categoryModules: string[]) =>
        categoryModules.every((module) => {
            const perm = formData.permissions[module];
            return perm && perm.create && perm.edit && perm.view && perm.delete;
        });

    const getCategoryActiveCount = (categoryModules: string[]) => {
        let count = 0;
        categoryModules.forEach((mod) => {
            const perm = formData.permissions[mod];
            if (!perm) return;
            if (perm.view) count++;
            if (perm.create) count++;
            if (perm.edit) count++;
            if (perm.delete) count++;
        });
        return count;
    };

    const totalActivePermissions = useMemo(() => {
        let total = 0;
        allModulesList.forEach((mod) => {
            const perm = formData.permissions[mod];
            if (!perm) return;
            if (perm.view) total++;
            if (perm.create) total++;
            if (perm.edit) total++;
            if (perm.delete) total++;
        });
        return total;
    }, [formData.permissions]);

    const maxPermissions = allModulesList.length * 4;

    const filteredGroups = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return moduleGroups;
        return moduleGroups
            .map((group) => {
                const matchedModules = group.modules.filter((m) =>
                    m.toLowerCase().includes(query) || group.category.toLowerCase().includes(query)
                );
                return {
                    ...group,
                    modules: matchedModules,
                };
            })
            .filter((group) => group.modules.length > 0);
    }, [searchQuery]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch(
                isEditMode
                    ? `${API_URL}/roles/${encodeURIComponent(formData.roleCode)}`
                    : `${API_URL}/roles/create`,
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

            if (response.ok && result.success) {
                toast.success(isEditMode ? "Role updated successfully!" : "Role created successfully!");
                navigate("/dashboard/permissions/lesson");
            } else {
                toast.error(result.message || (isEditMode ? "Role update failed." : "Role creation failed."));
            }
        } catch {
            toast.error("Server connection failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08] dark:border-white/[0.08]">
                <div className="flex items-center gap-3.5">
                    <button
                        type="button"
                        onClick={() => navigate("/dashboard/permissions/lesson")}
                        className={`p-2.5 rounded-xl border transition-colors ${
                            theme
                                ? "bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-gray-300"
                                : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-sm"
                        }`}
                        title="Back to roles"
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
                        <FaShieldAlt size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${theme ? "text-white" : "text-slate-900"}`}>
                                {isEditMode ? "Edit Role" : "Create New Role"}
                            </h1>
                            <span
                                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                                    theme ? "bg-blue-500/10 text-blue-300 border border-blue-500/20" : "bg-red-50 text-red-700 border border-red-200"
                                }`}
                            >
                                {isEditMode ? formData.roleCode || "Role" : "New Role"}
                            </span>
                        </div>
                        <p className={`text-xs sm:text-sm mt-0.5 ${theme ? "text-gray-400" : "text-slate-500"}`}>
                            Configure permissions and operational privileges across Gurukul modules.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    <div
                        className={`px-3.5 py-2 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                            theme ? "bg-white/[0.03] border-white/[0.08] text-gray-300" : "bg-white border-slate-200 text-slate-700 shadow-sm"
                        }`}
                    >
                        <HiOutlineSparkles className={theme ? "text-blue-400" : "text-red-600"} size={16} />
                        <span>
                            <strong className="font-bold text-sm">{totalActivePermissions}</strong> / {maxPermissions} active
                        </span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div
                    className={`rounded-2xl border p-5 sm:p-7 transition-all ${
                        theme
                            ? "bg-white/[0.02] border-white/[0.08]"
                            : "bg-white border-slate-200 shadow-sm"
                    }`}
                >
                    <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-white/[0.06] dark:border-white/[0.06]">
                        <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                theme ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-600"
                            }`}
                        >
                            <HiOutlineShieldCheck size={16} />
                        </span>
                        <h2 className={`text-sm font-bold uppercase tracking-wider ${theme ? "text-gray-300" : "text-slate-800"}`}>
                            Role Identity
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className={`block text-xs font-semibold mb-1.5 ${theme ? "text-gray-300" : "text-slate-700"}`}>
                                Role Name *
                            </label>
                            <Input
                                type="text"
                                name="roleName"
                                value={formData.roleName}
                                onChange={handleInputChange}
                                icon={<HiOutlineShieldCheck className="text-lg" />}
                                placeholder="e.g. Senior Teacher, Exam Head"
                                disabled={isSubmitting}
                                readOnly={isEditMode}
                                required
                            />
                        </div>

                        <div>
                            <label className={`block text-xs font-semibold mb-1.5 ${theme ? "text-gray-300" : "text-slate-700"}`}>
                                Role Code *
                            </label>
                            <Input
                                type="text"
                                name="roleCode"
                                value={formData.roleCode}
                                onChange={handleInputChange}
                                icon={<HiOutlineDocumentText className="text-lg" />}
                                placeholder="e.g. ROLE_HOD, TEACHER_SR"
                                disabled={isSubmitting || isEditMode}
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={`block text-xs font-semibold mb-1.5 ${theme ? "text-gray-300" : "text-slate-700"}`}>
                                Description <span className="opacity-60 font-normal">(Optional)</span>
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={2}
                                placeholder="Enter role responsibilities and scope..."
                                disabled={isSubmitting}
                                className={`w-full px-4 py-2.5 text-sm rounded-xl border outline-none transition-all ${
                                    theme
                                        ? "bg-black/30 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500"
                                        : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-red-500"
                                } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                            />
                        </div>
                    </div>
                </div>

                <div
                    className={`rounded-2xl border p-5 sm:p-7 transition-all ${
                        theme
                            ? "bg-white/[0.02] border-white/[0.08]"
                            : "bg-white border-slate-200 shadow-sm"
                    }`}
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/[0.06] dark:border-white/[0.06]">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <span
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                        theme ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-600"
                                    }`}
                                >
                                    <FaKey size={14} />
                                </span>
                                <h2 className={`text-sm font-bold uppercase tracking-wider ${theme ? "text-gray-300" : "text-slate-800"}`}>
                                    Module Permissions Matrix
                                </h2>
                            </div>
                            <p className={`text-xs mt-1 ${theme ? "text-gray-400" : "text-slate-500"}`}>
                                Select access rights (View, Create, Edit, Delete) for each system module.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative min-w-48">
                                <HiOutlineSearch
                                    size={16}
                                    className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                                        theme ? "text-gray-500" : "text-slate-400"
                                    }`}
                                />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Filter modules..."
                                    className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border outline-none transition-all ${
                                        theme
                                            ? "bg-black/30 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500"
                                            : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-red-500"
                                    }`}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => toggleGlobalAll(true)}
                                disabled={isSubmitting}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                                    theme
                                        ? "bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border-blue-500/30"
                                        : "bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                                }`}
                            >
                                <HiOutlineCheckCircle size={14} />
                                Grant All
                            </button>
                            <button
                                type="button"
                                onClick={() => toggleGlobalAll(false)}
                                disabled={isSubmitting}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                                    theme
                                        ? "bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 border-white/10"
                                        : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200"
                                }`}
                            >
                                <HiOutlineXCircle size={14} />
                                Revoke All
                            </button>
                        </div>
                    </div>

                    <div className="space-y-5">
                        {filteredGroups.map((group) => {
                            const categoryChecked = isCategoryFullyChecked(group.modules);
                            const activeCount = getCategoryActiveCount(group.modules);
                            const totalPossible = group.modules.length * 4;

                            return (
                                <div
                                    key={group.category}
                                    className={`rounded-xl border overflow-hidden transition-all ${
                                        theme ? "border-white/[0.08] bg-black/20" : "border-slate-200 bg-slate-50/50"
                                    }`}
                                >
                                    <div
                                        className={`px-4 py-3 flex items-center justify-between border-b ${
                                            theme ? "bg-white/[0.03] border-white/[0.06]" : "bg-white border-slate-200"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span className={theme ? "text-blue-400" : "text-red-600"}>
                                                {group.icon}
                                            </span>
                                            <span className={`text-xs font-bold uppercase tracking-wider ${theme ? "text-gray-200" : "text-slate-800"}`}>
                                                {group.category}
                                            </span>
                                            <span
                                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                    activeCount > 0
                                                        ? theme
                                                            ? "bg-blue-500/20 text-blue-300"
                                                            : "bg-red-100 text-red-700"
                                                        : theme
                                                        ? "bg-white/[0.06] text-gray-400"
                                                        : "bg-slate-200 text-slate-600"
                                                }`}
                                            >
                                                {activeCount} / {totalPossible}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => toggleAllForCategory(group.modules, !categoryChecked)}
                                            disabled={isSubmitting}
                                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                                                categoryChecked
                                                    ? theme
                                                        ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                                        : "bg-red-500 text-white border-red-500"
                                                    : theme
                                                    ? "bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 border-white/10"
                                                    : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                                            }`}
                                        >
                                            {categoryChecked ? "Deselect All" : "Select All"}
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto no-scrollbar">
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead>
                                                <tr
                                                    className={`border-b text-[11px] font-semibold uppercase tracking-wider ${
                                                        theme
                                                            ? "border-white/[0.04] text-gray-400 bg-white/[0.01]"
                                                            : "border-slate-200 text-slate-500 bg-slate-100/50"
                                                    }`}
                                                >
                                                    <th className="p-3 font-semibold pl-4">Module Name</th>
                                                    <th className="p-3 text-center w-20">View</th>
                                                    <th className="p-3 text-center w-20">Create</th>
                                                    <th className="p-3 text-center w-20">Edit</th>
                                                    <th className="p-3 text-center w-20">Delete</th>
                                                    <th className="p-3 text-center w-24 pr-4">All</th>
                                                </tr>
                                            </thead>
                                            <tbody
                                                className={`divide-y ${
                                                    theme ? "divide-white/[0.04]" : "divide-slate-200 bg-white"
                                                }`}
                                            >
                                                {group.modules.map((module) => {
                                                    const perm = formData.permissions[module] ?? {
                                                        view: false,
                                                        create: false,
                                                        edit: false,
                                                        delete: false,
                                                    };
                                                    const allChecked = perm.create && perm.edit && perm.view && perm.delete;
                                                    const someChecked = perm.create || perm.edit || perm.view || perm.delete;

                                                    return (
                                                        <tr
                                                            key={module}
                                                            className={`transition-colors ${
                                                                someChecked
                                                                    ? theme
                                                                        ? "bg-blue-500/[0.04] hover:bg-blue-500/[0.08]"
                                                                        : "bg-red-500/[0.03] hover:bg-red-500/[0.06]"
                                                                    : theme
                                                                    ? "hover:bg-white/[0.02]"
                                                                    : "hover:bg-slate-50"
                                                            }`}
                                                        >
                                                            <td className="p-3 pl-4 font-medium">
                                                                <div className="flex items-center gap-2">
                                                                    <span
                                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                                            allChecked
                                                                                ? theme
                                                                                    ? "bg-blue-400"
                                                                                    : "bg-red-600"
                                                                                : someChecked
                                                                                ? "bg-amber-400"
                                                                                : theme
                                                                                ? "bg-gray-600"
                                                                                : "bg-slate-300"
                                                                        }`}
                                                                    />
                                                                    <span className={theme ? "text-gray-200" : "text-slate-800"}>
                                                                        {module}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            {(["view", "create", "edit", "delete"] as const).map((action) => (
                                                                <td key={action} className="p-3 text-center">
                                                                    <div className="flex justify-center items-center">
                                                                        <Checkbox
                                                                            checked={perm[action]}
                                                                            onChange={() => handlePermissionChange(module, action)}
                                                                            disabled={isSubmitting}
                                                                        />
                                                                    </div>
                                                                </td>
                                                            ))}
                                                            <td className="p-3 pr-4 text-center">
                                                                <div className="flex justify-center items-center">
                                                                    <Checkbox
                                                                        checked={allChecked}
                                                                        onChange={() => toggleAllForModule(module, !allChecked)}
                                                                        disabled={isSubmitting}
                                                                    />
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div
                    className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border ${
                        theme ? "bg-white/[0.02] border-white/[0.08]" : "bg-white border-slate-200 shadow-sm"
                    }`}
                >
                    <p className={`text-xs ${theme ? "text-gray-400" : "text-slate-500"}`}>
                        Fields marked with <strong className="text-red-500">*</strong> are required. Users assigned this role must re-login to see updated permissions.
                    </p>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => navigate("/dashboard/permissions/lesson")}
                            disabled={isSubmitting}
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
                            disabled={isSubmitting}
                            className={`flex-1 sm:flex-none min-w-36 text-xs font-semibold ${
                                theme ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"
                            }`}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                    Saving...
                                </span>
                            ) : isEditMode ? (
                                "Update Role"
                            ) : (
                                "Create Role"
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}

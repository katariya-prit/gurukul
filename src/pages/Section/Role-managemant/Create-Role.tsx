import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../../../components/theme/ThemeContext";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import Checkbox from "../../../components/common/Checkbox";
import { HiOutlineShieldCheck, HiOutlineDocumentText } from "react-icons/hi";

import type { RoleCreate, PermissionRow } from "../../../Types/Role-create";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

// 🎯 FIX: Navbar.tsx ma hasAccess() thi je-je modules actually check thay chhe e badha (16 total)
// category-wise group karya, jethi Create Role form ma badha modules ni permission set kari shakay
const moduleGroups: { category: string; modules: string[] }[] = [
    { category: "Core", modules: ["Dashboard", "Permissions", "Progress"] },
    { category: "User Management", modules: ["Users", "Department", "Section", "Student"] },
    { category: "Roles", modules: ["RolesPermissions"] },
    { category: "Lessons", modules: ["Lesson", "MyLessons"] },
    { category: "Groups", modules: ["Group"] },
    { category: "Website / Overview", modules: ["OverviewEdit", "Activities", "UpcomingEvents", "AmrutNuAachaman", "DailyDarshan"] },
];

// 🎯 Flat list — formData initialize karva mate
const modules = moduleGroups.flatMap((g) => g.modules);

export default function CreateRole() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { roleCode: routeRoleCode } = useParams<{ roleCode: string }>();
    const isEditMode = Boolean(routeRoleCode);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState<RoleCreate>({
        roleName: "",
        roleCode: "",
        description: "",
        permissions: modules.reduce((acc, module) => {
            acc[module] = { create: false, edit: false, view: false, delete: false };
            return acc;
        }, {} as { [key: string]: PermissionRow }),
    });

    useEffect(() => {
        if (!routeRoleCode) return;

        const loadRole = async () => {
            try {
                const response = await fetch(`${API_URL}/roles`);
                const result = await response.json();
                const role = result.success
                    ? result.data.find((item: RoleCreate & { role_code: string }) => item.role_code === decodeURIComponent(routeRoleCode))
                    : null;

                if (!role) {
                    toast.error(result.message || "Role not found.");
                    navigate("/dashboard/permissions/lesson");
                    return;
                }

                setFormData({
                    roleName: role.role_name,
                    roleCode: role.role_code,
                    description: role.description || "",
                    permissions: role.permissions,
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

    const handlePermissionChange = (
        module: string,
        action: keyof PermissionRow
    ) => {
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

    // 🎯 "બધા Select" ટૉગલ — module ની બધી actions એક સાથે on/off કરવા
    const toggleAllForModule = (module: string, value: boolean) => {
        setFormData((prev) => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [module]: { create: value, edit: value, view: value, delete: value },
            },
        }));
    };

    // 🎯 NAVU: Category level "select all" — ek j click ma aakhi category ni badhi modules
    // ni badhi actions on/off kari shakay (jem "Lessons" category ma Lesson + MyLessons banne)
    const toggleAllForCategory = (categoryModules: string[], value: boolean) => {
        setFormData((prev) => {
            const updatedPermissions = { ...prev.permissions };
            categoryModules.forEach((module) => {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                isEditMode
                    ? `${API_URL}/roles/${encodeURIComponent(formData.roleCode)}`
                    : `${API_URL}/roles/create`,
                {
                method: isEditMode ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
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
        } catch (error) {
            console.error("API Error:", error);
            toast.error("Server connection failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`max-w-full mx-auto p-6 rounded-2xl shadow-md mt-6 transition-all duration-200 border ${theme ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-neutral-200 text-neutral-900"
            }`}>
                <h2 className={`text-2xl font-bold mb-6 border-b pb-3 ${theme ? "border-gray-800 text-blue-200" : "border-neutral-200 text-red-600"
                }`}>
                {isEditMode ? "Edit Role" : "Create New Role"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={`block text-sm font-medium mb-1.5 ${theme ? "text-gray-300" : "text-neutral-700"}`}>Role Name</label>
                        <Input
                            type="text"
                            name="roleName"
                            value={formData.roleName}
                            onChange={handleInputChange}
                            icon={<HiOutlineShieldCheck className="text-lg" />}
                            placeholder="Ex: HOD, Class Teacher"
                            disabled={isSubmitting}
                            readOnly={isEditMode}
                            required
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-medium mb-1.5 ${theme ? "text-gray-300" : "text-neutral-700"}`}>Role Code</label>
                        <Input
                            type="text"
                            name="roleCode"
                            value={formData.roleCode}
                            onChange={handleInputChange}
                            icon={<HiOutlineDocumentText className="text-lg" />}
                            placeholder="Ex: ROLE_HOD"
                            disabled={isSubmitting}
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className={`block text-sm font-medium mb-1.5 ${theme ? "text-gray-300" : "text-neutral-700"}`}>Description (Optional)</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Enter role details or responsibilities..."
                        disabled={isSubmitting}
                        className={`w-full px-4 py-2.5 text-sm rounded-xl border outline-none transition-all ${theme
                                ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                                : "bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-red-500"
                            } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                    />
                </div>

                <div>
                    <label className={`block text-sm font-bold mb-3 ${theme ? "text-gray-200" : "text-neutral-800"}`}>
                        Module Permissions
                    </label>

                    <div className="space-y-5">
                        {moduleGroups.map((group) => {
                            const categoryChecked = isCategoryFullyChecked(group.modules);
                            return (
                                <div key={group.category} className={`overflow-x-auto border rounded-xl ${theme ? "border-gray-800" : "border-neutral-200"}`}>
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className={`text-xs font-bold uppercase tracking-wider ${theme ? "bg-gray-800 text-gray-300" : "bg-[#9b001c] text-white"}`}>
                                                <th className="p-3.5 whitespace-nowrap">
                                                    <span className="flex items-center gap-2">
                                                        {group.category}
                                                        <span className={`text-[10px] font-normal px-2 py-0.5 rounded-full ${theme ? "bg-gray-700 text-gray-300" : "bg-white/20 text-white"}`}>
                                                            {group.modules.length}
                                                        </span>
                                                    </span>
                                                </th>
                                                <th className="p-3.5 text-center">Create</th>
                                                <th className="p-3.5 text-center">Edit</th>
                                                <th className="p-3.5 text-center">View</th>
                                                <th className="p-3.5 text-center">Delete</th>
                                                <th className="p-3.5 text-center whitespace-nowrap">
                                                    <span className="flex items-center justify-center gap-1.5">
                                                        All
                                                        <Checkbox
                                                            checked={categoryChecked}
                                                            onChange={() => toggleAllForCategory(group.modules, !categoryChecked)}
                                                            disabled={isSubmitting}
                                                        />
                                                    </span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className={`divide-y text-sm ${theme ? "divide-gray-800 bg-gray-800/20" : "divide-neutral-100 bg-white"}`}>
                                            {group.modules.map((module) => {
                                                const perm = formData.permissions[module];
                                                const allChecked = perm.create && perm.edit && perm.view && perm.delete;
                                                return (
                                                    <tr key={module} className={theme ? "hover:bg-gray-800/40" : "hover:bg-neutral-50"}>
                                                        <td className="p-3.5 font-semibold whitespace-nowrap">{module}</td>
                                                        {(["create", "edit", "view", "delete"] as const).map((action) => (
                                                            <td key={action} className="p-3.5 text-center">
                                                                <Checkbox
                                                                    checked={perm[action]}
                                                                    onChange={() => handlePermissionChange(module, action)}
                                                                    disabled={isSubmitting}
                                                                />
                                                            </td>
                                                        ))}
                                                        <td className="p-3.5 text-center">
                                                            <Checkbox
                                                                checked={allChecked}
                                                                onChange={() => toggleAllForModule(module, !allChecked)}
                                                                disabled={isSubmitting}
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-neutral-200 dark:border-gray-800">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className={theme ? "bg-blue-600 hover:bg-blue-700" : "bg-red-500 hover:bg-red-600"}
                    >
                        {isSubmitting ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update Role" : "Create Role")}
                    </Button>
                </div>
            </form>
        </div>
    );
}
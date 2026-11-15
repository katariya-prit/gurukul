import { useState } from "react";
import { LuX } from "react-icons/lu";
import type { ItemPermissions, PermissionOption } from "../types";
import { useTheme } from "../../../components/theme/ThemeContext";
import Button from "../../../components/common/Button";
import { fieldClass, mutedTextClass } from "./styles";

interface PermissionsEditorProps {
    permissions: ItemPermissions;
    options: { roles: PermissionOption[]; sections: PermissionOption[]; users: PermissionOption[] };
    onChange: (permissions: ItemPermissions) => void;
    onSave: () => Promise<void>;
    saving: boolean;
}

export default function PermissionsEditor({ permissions, options, onChange, onSave, saving }: PermissionsEditorProps) {
    const { theme } = useTheme();
    const [queries, setQueries] = useState({ roles: "", sections: "", users: "" });
    const categories = [
        { key: "roles" as const, label: "Role codes", values: options.roles, selected: permissions.roleCodes, permissionKey: "roleCodes" as const },
        { key: "sections" as const, label: "Sections", values: options.sections, selected: permissions.sectionIds.map(String), permissionKey: "sectionIds" as const },
        { key: "users" as const, label: "Users", values: options.users, selected: permissions.userSuids.map(String), permissionKey: "userSuids" as const },
    ];

    const toggle = (permissionKey: "roleCodes" | "sectionIds" | "userSuids", value: string) => {
        const values = permissions[permissionKey].map(String);
        const updated = values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
        onChange({
            ...permissions,
            [permissionKey]: permissionKey === "roleCodes" ? updated : updated.map(Number),
        });
    };

    const selectedLabel = (category: typeof categories[number], value: string) =>
        category.values.find((option) => String(option.id) === value)?.label ?? value;

    const submit = async () => {
        await onSave();
    };

    return (
        <div className="space-y-6">
            {categories.map((category) => {
                const filtered = category.values.filter((option) =>
                    `${option.label} ${option.id}`.toLowerCase().includes(queries[category.key].toLowerCase())
                );
                return (
                    <section key={category.key} className="space-y-2">
                        <label className="block text-sm font-semibold">{category.label}</label>
                        <input
                            type="search"
                            value={queries[category.key]}
                            onChange={(event) =>
                                setQueries((current) => ({ ...current, [category.key]: event.target.value }))
                            }
                            placeholder={`Search ${category.label.toLowerCase()}...`}
                            className={`${fieldClass(theme)} min-h-[44px] text-base sm:text-sm`}
                        />
                        <div
                            className={`max-h-48 overflow-y-auto rounded-xl border p-2 ${
                                theme ? "border-slate-700 bg-slate-900/40" : "border-slate-200 bg-slate-50/50"
                            }`}
                        >
                            {filtered.length ? (
                                filtered.map((option) => (
                                    <label
                                        key={option.id}
                                        className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                                            theme ? "hover:bg-slate-800" : "hover:bg-slate-100"
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={category.selected.includes(String(option.id))}
                                            onChange={() => toggle(category.permissionKey, String(option.id))}
                                            className="h-4 w-4 accent-blue-600 rounded"
                                        />
                                        <span className="font-medium">{option.label}</span>
                                        <span className={`ml-auto text-xs ${mutedTextClass(theme)}`}>{option.id}</span>
                                    </label>
                                ))
                            ) : (
                                <p className="p-3 text-sm opacity-70">No matches found.</p>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {category.selected.map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => toggle(category.permissionKey, value)}
                                    className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                        theme ? "border-slate-700 bg-slate-800 hover:bg-slate-700" : "border-slate-200 bg-slate-100 hover:bg-slate-200"
                                    }`}
                                >
                                    <span>{selectedLabel(category, value)}</span>
                                    <LuX aria-label="Remove" className="text-sm" />
                                </button>
                            ))}
                        </div>
                    </section>
                );
            })}

            <div
                className={`sticky bottom-0 z-20 -mx-4 -mb-4 flex items-center justify-end gap-3 border-t p-4 backdrop-blur-md sm:static sm:mx-0 sm:mb-0 sm:border-t-0 sm:p-0 ${
                    theme ? "border-slate-800 bg-[#060a12]/90" : "border-slate-200 bg-[#f4f7fb]/90"
                }`}
            >
                <Button
                    onClick={() => void submit()}
                    isLoading={saving}
                    className="min-h-[44px] w-full sm:w-auto"
                >
                    Save permissions
                </Button>
            </div>
        </div>
    );
}

import { useEffect, useState } from "react";
import type { DashboardWidget, Functionality, FunctionalityItem, WidgetInput, WidgetType } from "../types";
import { validateJsonConfig } from "../utils/validators";
import { WIDGET_TYPES } from "../utils/constants";
import { useTheme } from "../../../components/theme/ThemeContext";
import SearchableDropdown from "../../../components/common/SearchableDropdown";
import Button from "../../../components/common/Button";
import Modal from "./Modal";
import { fieldClass } from "./styles";

interface WidgetFormModalProps {
    open: boolean;
    widget: DashboardWidget | null;
    functionalities: Functionality[];
    items: FunctionalityItem[];
    onClose: () => void;
    onSave: (input: WidgetInput) => Promise<void>;
}

const roles = ["SUPER_ADMIN", "HEAD100", "SECHEAD101", "STUDENT", "USER"];

export default function WidgetFormModal({
    open,
    widget,
    functionalities,
    items,
    onClose,
    onSave,
}: WidgetFormModalProps) {
    const { theme } = useTheme();
    const [functionalityId, setFunctionalityId] = useState<number | "">("");
    const [itemId, setItemId] = useState<number | "">("");
    const [widgetType, setWidgetType] = useState<WidgetType>("levelBadge");
    const [title, setTitle] = useState("");
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [sortOrder, setSortOrder] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const [configText, setConfigText] = useState("{}");
    const [saving, setSaving] = useState(false);
    const configError = validateJsonConfig(configText);
    const filteredItems = items.filter((item) => item.functionalityId === functionalityId);

    useEffect(() => {
        if (!open) return;
        setFunctionalityId(widget?.functionalityId ?? functionalities[0]?.id ?? "");
        setItemId(widget?.itemId ?? "");
        setWidgetType(widget?.widgetType ?? "levelBadge");
        setTitle(widget?.title ?? "");
        setSelectedRoles(widget?.roles ?? []);
        setSortOrder(widget?.sortOrder ?? 0);
        setIsActive(widget?.isActive ?? true);
        setConfigText(JSON.stringify(widget?.config ?? {}, null, 2));
    }, [functionalities, open, widget]);

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!functionalityId || configError) return;
        setSaving(true);
        try {
            await onSave({
                functionalityId,
                itemId: itemId === "" ? null : itemId,
                widgetType,
                title: title.trim(),
                config: JSON.parse(configText) as Record<string, unknown>,
                roles: selectedRoles,
                sortOrder,
                isActive,
            });
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={widget ? "Edit dashboard widget" : "Add dashboard widget"}
            size="lg"
        >
            <form onSubmit={(event) => void submit(event)} className="space-y-4">
                <label className="block text-sm font-medium">
                    Title
                    <input
                        required
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        className={`${fieldClass(theme)} mt-1.5 min-h-[44px] text-base sm:text-sm`}
                    />
                </label>
                <SearchableDropdown
                    label="Functionality"
                    triggerClassName="h-11 min-h-11"
                    options={functionalities.map((entry) => ({ value: entry.id, label: entry.name }))}
                    selectedValue={functionalityId}
                    onSelect={(value) => {
                        setFunctionalityId(Number(value));
                        setItemId("");
                    }}
                />
                <SearchableDropdown
                    label="Item (optional)"
                    triggerClassName="h-11 min-h-11"
                    options={[
                        { value: "", label: "All items" },
                        ...filteredItems.map((item) => ({
                            value: item.id,
                            label: `${item.departmentName}: ${item.name}`,
                        })),
                    ]}
                    selectedValue={itemId}
                    onSelect={(value) => setItemId(value === "" ? "" : Number(value))}
                />
                <label className="block text-sm font-medium">
                    Widget type
                    <select
                        value={widgetType}
                        onChange={(event) => setWidgetType(event.target.value as WidgetType)}
                        className={`${fieldClass(theme)} mt-1.5 min-h-[44px] text-base sm:text-sm`}
                    >
                        {WIDGET_TYPES.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
                <fieldset>
                    <legend className="mb-2 text-sm font-medium">Roles</legend>
                    <div className="flex flex-wrap gap-2">
                        {roles.map((role) => (
                            <label
                                key={role}
                                className={`flex min-h-[38px] cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                                    theme ? "border-slate-700 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-50"
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedRoles.includes(role)}
                                    onChange={(event) =>
                                        setSelectedRoles((current) =>
                                            event.target.checked
                                                ? [...current, role]
                                                : current.filter((entry) => entry !== role)
                                        )
                                    }
                                    className="h-4 w-4 accent-blue-600 rounded"
                                />
                                {role}
                            </label>
                        ))}
                    </div>
                </fieldset>
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium">
                        Sort order
                        <input
                            type="number"
                            value={sortOrder}
                            onChange={(event) => setSortOrder(Number(event.target.value))}
                            className={`${fieldClass(theme)} mt-1.5 min-h-[44px] text-base sm:text-sm`}
                        />
                    </label>
                    <label className="flex items-center gap-3 pt-2 text-sm font-medium sm:pt-7">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(event) => setIsActive(event.target.checked)}
                            className="h-5 w-5 accent-blue-600 rounded"
                        />
                        Active
                    </label>
                </div>
                <label className="block text-sm font-medium">
                    Config JSON
                    <textarea
                        rows={6}
                        value={configText}
                        onChange={(event) => setConfigText(event.target.value)}
                        className={`${fieldClass(theme)} mt-1.5 font-mono text-base sm:text-sm`}
                    />
                </label>
                {configError && <p role="alert" className="text-sm text-red-500">{configError}</p>}
                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-inherit px-4 py-2.5 text-sm font-semibold transition hover:bg-black/5 dark:hover:bg-white/5"
                    >
                        Cancel
                    </button>
                    <Button
                        type="submit"
                        isLoading={saving}
                        disabled={Boolean(configError)}
                        className="min-h-[44px]"
                    >
                        Save widget
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

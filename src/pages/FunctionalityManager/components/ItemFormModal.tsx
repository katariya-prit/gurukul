import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { DepartmentFunctionality, Functionality, FunctionalityItem, ItemInput } from "../types";
import SearchableDropdown from "../../../components/common/SearchableDropdown";
import Button from "../../../components/common/Button";
import { useTheme } from "../../../components/theme/ThemeContext";
import { fieldClass } from "./styles";
import Modal from "./Modal";
import IconPicker from "./IconPicker";

interface ItemFormModalProps {
    open: boolean;
    item: FunctionalityItem | null;
    functionalities: Functionality[];
    departments: DepartmentFunctionality[];
    onClose: () => void;
    onSave: (input: ItemInput) => Promise<void>;
}

export default function ItemFormModal({
    open,
    item,
    functionalities,
    departments,
    onClose,
    onSave,
}: ItemFormModalProps) {
    const { theme } = useTheme();
    const [functionalityId, setFunctionalityId] = useState<number | "">("");
    const [departmentId, setDepartmentId] = useState<number | "">("");
    const [name, setName] = useState("");
    const [icon, setIcon] = useState("layers");
    const [isActive, setIsActive] = useState(true);
    const [saving, setSaving] = useState(false);
    const allowedDepartments = departments.filter(
        (assignment) => assignment.functionalityId === functionalityId && assignment.isEnabled
    );

    useEffect(() => {
        if (!open) return;
        setFunctionalityId(item?.functionalityId ?? functionalities[0]?.id ?? "");
        setDepartmentId(item?.departmentId ?? "");
        setName(item?.name ?? "");
        setIcon(item?.icon ?? "layers");
        setIsActive(item?.isActive ?? true);
    }, [functionalities, item, open]);

    useEffect(() => {
        if (departmentId && !allowedDepartments.some((entry) => entry.departmentId === departmentId)) {
            setDepartmentId("");
        }
    }, [allowedDepartments, departmentId]);

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!functionalityId || !departmentId) {
            toast.error("Choose a functionality and enabled department.");
            return;
        }
        setSaving(true);
        try {
            await onSave({ functionalityId, departmentId, name: name.trim(), icon, isActive });
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={item ? "Edit item" : "Add item"}
            size="lg"
        >
            <form onSubmit={(event) => void submit(event)} className="space-y-4">
                <SearchableDropdown
                    label="Functionality"
                    triggerClassName="h-11 min-h-11"
                    options={functionalities.map((entry) => ({ value: entry.id, label: entry.name }))}
                    selectedValue={functionalityId}
                    onSelect={(value) => setFunctionalityId(Number(value))}
                />
                <SearchableDropdown
                    label="Department"
                    triggerClassName="h-11 min-h-11"
                    options={allowedDepartments.map((entry) => ({
                        value: entry.departmentId,
                        label: `${entry.departmentName} · ${entry.itemLabel}`,
                    }))}
                    selectedValue={departmentId}
                    onSelect={(value) => setDepartmentId(Number(value))}
                    disabled={allowedDepartments.length === 0}
                />
                <label className="block text-sm font-medium">
                    Name
                    <input
                        required
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className={`${fieldClass(theme)} mt-1.5 min-h-[44px] text-base sm:text-sm`}
                    />
                </label>
                <IconPicker value={icon} onChange={setIcon} />
                <label className="flex items-center gap-3 text-sm font-medium">
                    <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(event) => setIsActive(event.target.checked)}
                        className="h-5 w-5 accent-blue-600 rounded"
                    />
                    Active
                </label>
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
                        className="min-h-[44px]"
                    >
                        Save item
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

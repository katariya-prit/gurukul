import { useEffect, useState } from "react";
import type { Functionality, FunctionalityInput } from "../types";
import { slugify } from "../utils/slugify";
import { fieldClass } from "./styles";
import { useTheme } from "../../../components/theme/ThemeContext";
import DescriptionInput from "../../../components/common/DescriptionInput";
import Button from "../../../components/common/Button";
import Modal from "./Modal";
import IconPicker from "./IconPicker";
import ColorPicker from "./ColorPicker";
import EvaluatorSegmented from "./EvaluatorSegmented";

interface FunctionalityFormModalProps {
    open: boolean;
    functionality: Functionality | null;
    onClose: () => void;
    onSave: (input: FunctionalityInput) => Promise<void>;
}

const initialForm: FunctionalityInput = {
    name: "",
    key: "",
    description: "",
    icon: "puzzle",
    themeColor: "#6366f1",
    evaluatorType: "teacher",
    isActive: true,
};

export default function FunctionalityFormModal({
    open,
    functionality,
    onClose,
    onSave,
}: FunctionalityFormModalProps) {
    const { theme } = useTheme();
    const [form, setForm] = useState<FunctionalityInput>(initialForm);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;
        setForm(
            functionality
                ? {
                    name: functionality.name,
                    key: functionality.key,
                    description: functionality.description,
                    icon: functionality.icon,
                    themeColor: functionality.themeColor,
                    evaluatorType: functionality.evaluatorType,
                    isActive: functionality.isActive,
                }
                : initialForm
        );
    }, [functionality, open]);

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        try {
            await onSave(form);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            title={functionality ? "Edit functionality" : "Add functionality"}
            open={open}
            onClose={onClose}
            size="lg"
        >
            <form className="space-y-5" onSubmit={(event) => void submit(event)}>
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-medium">
                        Name
                        <input
                            required
                            value={form.name}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    name: event.target.value,
                                    ...(!functionality ? { key: slugify(event.target.value) } : {}),
                                }))
                            }
                            className={`${fieldClass(theme)} mt-1.5 min-h-[44px] text-base sm:text-sm`}
                        />
                    </label>
                    <label className="text-sm font-medium">
                        Key
                        <input
                            required
                            pattern="[a-z0-9_]+"
                            value={form.key}
                            readOnly={Boolean(functionality)}
                            onChange={(event) =>
                                setForm((current) => ({ ...current, key: slugify(event.target.value) }))
                            }
                            className={`${fieldClass(theme)} mt-1.5 min-h-[44px] text-base sm:text-sm ${
                                functionality ? "opacity-70" : ""
                            }`}
                        />
                    </label>
                </div>
                <DescriptionInput
                    label="Description"
                    value={form.description ?? ""}
                    onChange={(event) =>
                        setForm((current) => ({ ...current, description: event.target.value }))
                    }
                    rows={3}
                />
                <IconPicker
                    value={form.icon ?? ""}
                    onChange={(icon) => setForm((current) => ({ ...current, icon }))}
                />
                <ColorPicker
                    value={form.themeColor ?? "#6366f1"}
                    onChange={(themeColor) => setForm((current) => ({ ...current, themeColor }))}
                />
                <EvaluatorSegmented
                    value={form.evaluatorType}
                    onChange={(evaluatorType) => setForm((current) => ({ ...current, evaluatorType }))}
                />
                <label className="flex items-center gap-3 text-sm font-medium">
                    <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(event) =>
                            setForm((current) => ({ ...current, isActive: event.target.checked }))
                        }
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
                        loadingText="Saving..."
                        className="min-h-[44px]"
                    >
                        {functionality ? "Save changes" : "Create functionality"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

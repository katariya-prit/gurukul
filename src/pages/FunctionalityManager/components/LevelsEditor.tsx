import { useMemo } from "react";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import { toast } from "sonner";
import type { ItemLevel, PromoteMode } from "../types";
import { validateLevels } from "../utils/validators";
import { useTheme } from "../../../components/theme/ThemeContext";
import Button from "../../../components/common/Button";
import { fieldClass } from "./styles";

interface LevelsEditorProps {
    levels: ItemLevel[];
    onChange: (levels: ItemLevel[]) => void;
    onSave: () => Promise<void>;
    saving: boolean;
}

export default function LevelsEditor({ levels, onChange, onSave, saving }: LevelsEditorProps) {
    const { theme } = useTheme();
    const validation = useMemo(() => validateLevels(levels), [levels]);

    const update = (index: number, patch: Partial<ItemLevel>) => {
        onChange(levels.map((level, row) => row === index ? { ...level, ...patch } : level));
    };

    const submit = async () => {
        if (validation) {
            toast.error(validation);
            return;
        }
        await onSave();
        toast.success("Levels saved.");
    };

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                {levels.map((level, index) => (
                    <div
                        key={level.id}
                        className={`flex flex-col gap-3 rounded-2xl border p-4 sm:grid sm:grid-cols-[5rem_1.2fr_1fr_1fr_auto] sm:items-end ${
                            theme ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50/60"
                        }`}
                    >
                        <div className="flex items-center justify-between sm:block">
                            <label className="text-xs font-semibold">
                                Level
                                <input
                                    readOnly
                                    value={index + 1}
                                    className={`${fieldClass(theme)} mt-1 min-h-[44px] text-base sm:text-sm`}
                                />
                            </label>
                            <button
                                type="button"
                                aria-label={`Remove ${level.name || "level"}`}
                                onClick={() =>
                                    onChange(
                                        levels
                                            .filter((_, row) => row !== index)
                                            .map((entry, row) => ({ ...entry, levelNo: row + 1 }))
                                    )
                                }
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-500 hover:bg-red-500/10 sm:hidden"
                            >
                                <LuTrash2 />
                            </button>
                        </div>

                        <label className="text-xs font-semibold">
                            Name
                            <input
                                required
                                value={level.name}
                                onChange={(event) => update(index, { name: event.target.value, levelNo: index + 1 })}
                                className={`${fieldClass(theme)} mt-1 min-h-[44px] text-base sm:text-sm`}
                            />
                        </label>

                        <label className="text-xs font-semibold">
                            Minimum points
                            <input
                                type="number"
                                min="0"
                                value={level.minPoints}
                                onChange={(event) =>
                                    update(index, { minPoints: Number(event.target.value), levelNo: index + 1 })
                                }
                                className={`${fieldClass(theme)} mt-1 min-h-[44px] text-base sm:text-sm`}
                            />
                        </label>

                        <label className="text-xs font-semibold">
                            Promotion
                            <select
                                value={level.promoteMode}
                                onChange={(event) => update(index, { promoteMode: event.target.value as PromoteMode })}
                                className={`${fieldClass(theme)} mt-1 min-h-[44px] text-base sm:text-sm`}
                            >
                                <option value="auto">Auto</option>
                                <option value="manual">Manual</option>
                            </select>
                        </label>

                        <button
                            type="button"
                            aria-label={`Remove ${level.name || "level"}`}
                            onClick={() =>
                                onChange(
                                    levels
                                        .filter((_, row) => row !== index)
                                        .map((entry, row) => ({ ...entry, levelNo: row + 1 }))
                                )
                            }
                            className="hidden rounded-lg p-2 text-red-500 hover:bg-red-500/10 sm:inline-flex"
                        >
                            <LuTrash2 />
                        </button>

                        {index === 0 && level.minPoints !== 0 && (
                            <p className="text-xs text-red-500 sm:col-span-5">The first level must start at 0 points.</p>
                        )}
                        {index > 0 && level.minPoints <= levels[index - 1].minPoints && (
                            <p className="text-xs text-red-500 sm:col-span-5">
                                Minimum points must be greater than the previous level.
                            </p>
                        )}
                        {!level.name.trim() && (
                            <p className="text-xs text-red-500 sm:col-span-5">Level name is required.</p>
                        )}
                    </div>
                ))}
            </div>

            {validation && <p role="alert" className="text-sm text-red-500">{validation}</p>}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                    type="button"
                    onClick={() =>
                        onChange([
                            ...levels,
                            {
                                id: Date.now(),
                                itemId: levels[0]?.itemId ?? 0,
                                levelNo: levels.length + 1,
                                name: "",
                                minPoints: (levels.at(-1)?.minPoints ?? -1) + 100,
                                promoteMode: "auto",
                            },
                        ])
                    }
                    className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                        theme ? "border-slate-700 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-50"
                    }`}
                >
                    <LuPlus /> Add level
                </button>
            </div>

            <div
                className={`sticky bottom-0 z-20 -mx-4 -mb-4 flex items-center justify-end gap-3 border-t p-4 backdrop-blur-md sm:static sm:mx-0 sm:mb-0 sm:border-t-0 sm:p-0 ${
                    theme ? "border-slate-800 bg-[#060a12]/90" : "border-slate-200 bg-[#f4f7fb]/90"
                }`}
            >
                <Button
                    onClick={() => void submit()}
                    isLoading={saving}
                    disabled={Boolean(validation)}
                    className="min-h-[44px] w-full sm:w-auto"
                >
                    Save levels
                </Button>
            </div>
        </div>
    );
}

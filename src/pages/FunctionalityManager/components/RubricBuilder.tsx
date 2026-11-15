import { useState } from "react";
import { LuGripVertical, LuPlus, LuTrash2, LuArrowUp, LuArrowDown } from "react-icons/lu";
import { toast } from "sonner";
import type { RubricCriterion } from "../types";
import { slugify } from "../utils/slugify";
import { validateRubric } from "../utils/validators";
import { useTheme } from "../../../components/theme/ThemeContext";
import Button from "../../../components/common/Button";
import { fieldClass } from "./styles";
import WeightIndicator from "./WeightIndicator";

interface RubricBuilderProps {
    initialCriteria: RubricCriterion[];
    version: number | null;
    saving: boolean;
    onSave: (criteria: RubricCriterion[]) => Promise<void>;
}

export default function RubricBuilder({ initialCriteria, version, saving, onSave }: RubricBuilderProps) {
    const { theme } = useTheme();
    const [criteria, setCriteria] = useState(initialCriteria);
    const [dragging, setDragging] = useState<number | null>(null);
    const total = criteria.reduce((sum, criterion) => sum + Number(criterion.weight || 0), 0);
    const validation = validateRubric(criteria);

    const update = (index: number, patch: Partial<RubricCriterion>) => {
        setCriteria((current) => current.map((criterion, row) => row === index ? { ...criterion, ...patch } : criterion));
    };

    const move = (from: number, to: number) => {
        if (from === to || to < 0 || to >= criteria.length) return;
        setCriteria((current) => {
            const next = [...current];
            const [row] = next.splice(from, 1);
            next.splice(to, 0, row);
            return next;
        });
    };

    const submit = async () => {
        if (validation) {
            toast.error(validation);
            return;
        }
        await onSave(criteria);
        toast.success("A new rubric version was saved.");
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${theme ? "bg-blue-500/10 text-blue-300" : "bg-blue-50 text-blue-700"}`}>
                    {version ? `Current version v${version}` : "No rubric yet"}
                </span>
                <WeightIndicator total={total} />
            </div>

            <div className="space-y-3">
                {criteria.map((criterion, index) => (
                    <div
                        key={`${criterion.key}-${index}`}
                        draggable
                        onDragStart={() => setDragging(index)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => {
                            if (dragging !== null) move(dragging, index);
                            setDragging(null);
                        }}
                        onDragEnd={() => setDragging(null)}
                        className={`flex flex-col gap-3 rounded-2xl border p-4 sm:grid sm:grid-cols-[auto_1.2fr_1fr_0.7fr_0.7fr_auto] sm:items-end ${
                            theme ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50/60"
                        } ${dragging === index ? "opacity-50" : ""}`}
                    >
                        <div className="flex items-center justify-between border-b pb-2 sm:border-b-0 sm:pb-0">
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    aria-label={`Reorder criterion ${criterion.label}`}
                                    className="hidden cursor-grab pb-2 text-xl opacity-60 focus-visible:outline-2 sm:block"
                                >
                                    <LuGripVertical />
                                </button>
                                <div className="flex items-center gap-1 sm:hidden">
                                    <button
                                        type="button"
                                        disabled={index === 0}
                                        onClick={() => move(index, index - 1)}
                                        aria-label="Move criterion up"
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-inherit text-sm disabled:opacity-30"
                                    >
                                        <LuArrowUp />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={index === criteria.length - 1}
                                        onClick={() => move(index, index + 1)}
                                        aria-label="Move criterion down"
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-inherit text-sm disabled:opacity-30"
                                    >
                                        <LuArrowDown />
                                    </button>
                                </div>
                            </div>
                            <button
                                type="button"
                                aria-label={`Remove ${criterion.label || "criterion"}`}
                                onClick={() => setCriteria((current) => current.filter((_, row) => row !== index))}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-500 hover:bg-red-500/10 sm:hidden"
                            >
                                <LuTrash2 />
                            </button>
                        </div>

                        <label className="text-xs font-semibold">
                            Label
                            <input
                                value={criterion.label}
                                onChange={(event) => update(index, { label: event.target.value, key: slugify(event.target.value) })}
                                className={`${fieldClass(theme)} mt-1 min-h-[44px] text-base sm:text-sm`}
                            />
                        </label>
                        <label className="text-xs font-semibold">
                            Key
                            <input
                                value={criterion.key}
                                onChange={(event) => update(index, { key: slugify(event.target.value) })}
                                className={`${fieldClass(theme)} mt-1 min-h-[44px] text-base sm:text-sm`}
                            />
                        </label>
                        <label className="text-xs font-semibold">
                            Weight
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={criterion.weight}
                                onChange={(event) => update(index, { weight: Number(event.target.value) })}
                                className={`${fieldClass(theme)} mt-1 min-h-[44px] text-base sm:text-sm`}
                            />
                        </label>
                        <label className="text-xs font-semibold">
                            Max points
                            <input
                                type="number"
                                min="1"
                                value={criterion.maxPoints}
                                onChange={(event) => update(index, { maxPoints: Number(event.target.value) })}
                                className={`${fieldClass(theme)} mt-1 min-h-[44px] text-base sm:text-sm`}
                            />
                        </label>
                        <button
                            type="button"
                            aria-label={`Remove ${criterion.label || "criterion"}`}
                            onClick={() => setCriteria((current) => current.filter((_, row) => row !== index))}
                            className="hidden rounded-lg p-2 text-red-500 hover:bg-red-500/10 sm:inline-flex"
                        >
                            <LuTrash2 />
                        </button>
                    </div>
                ))}
            </div>

            {validation && <p role="alert" className="text-sm text-amber-600">{validation}</p>}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                    type="button"
                    onClick={() => setCriteria((current) => [...current, { key: "", label: "", weight: 0, maxPoints: 1 }])}
                    className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                        theme ? "border-slate-700 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-50"
                    }`}
                >
                    <LuPlus /> Add criterion
                </button>
            </div>

            <div
                className={`sticky bottom-0 z-20 -mx-4 -mb-4 flex items-center justify-between gap-3 border-t p-4 backdrop-blur-md sm:static sm:mx-0 sm:mb-0 sm:border-t-0 sm:p-0 ${
                    theme ? "border-slate-800 bg-[#060a12]/90" : "border-slate-200 bg-[#f4f7fb]/90"
                }`}
            >
                <div className="sm:hidden">
                    <WeightIndicator total={total} />
                </div>
                <Button
                    onClick={() => void submit()}
                    isLoading={saving}
                    disabled={Boolean(validation)}
                    className="min-h-[44px] w-full sm:w-auto"
                >
                    Save as new version
                </Button>
            </div>
        </div>
    );
}

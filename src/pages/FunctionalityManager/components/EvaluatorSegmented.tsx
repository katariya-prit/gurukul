import type { EvaluatorType } from "../types";
import { EVALUATOR_OPTIONS } from "../utils/constants";
import { useTheme } from "../../../components/theme/ThemeContext";

export default function EvaluatorSegmented({ value, onChange }: { value: EvaluatorType; onChange: (value: EvaluatorType) => void }) {
    const { theme } = useTheme();
    return (
        <fieldset>
            <legend className="mb-2 text-sm font-medium">Evaluator</legend>
            <div className={`grid grid-cols-3 gap-1 rounded-xl border p-1 ${theme ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-slate-50"}`}>
                {EVALUATOR_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        aria-pressed={value === option.value}
                        onClick={() => onChange(option.value)}
                        className={`rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 ${
                            value === option.value
                                ? theme ? "bg-blue-600 text-white" : "bg-red-700 text-white"
                                : theme ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </fieldset>
    );
}

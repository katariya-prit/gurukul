import { fieldClass } from "./styles";
import { useTheme } from "../../../components/theme/ThemeContext";

const palette = ["#2563eb", "#6366f1", "#8b5cf6", "#d946ef", "#ec4899", "#ef4444", "#f97316", "#f59e0b", "#10b981", "#14b8a6", "#06b6d4", "#64748b"];

export default function ColorPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    const { theme } = useTheme();
    return (
        <fieldset>
            <legend className="mb-2 text-sm font-medium">Theme color</legend>
            <div className="flex flex-wrap items-center gap-2">
                {palette.map((color) => (
                    <button
                        key={color}
                        type="button"
                        aria-label={`Choose ${color}`}
                        aria-pressed={value.toLowerCase() === color}
                        onClick={() => onChange(color)}
                        className={`h-8 w-8 rounded-full border-2 focus-visible:outline-2 focus-visible:outline-offset-2 ${
                            value.toLowerCase() === color ? theme ? "border-white ring-2 ring-blue-400" : "border-slate-900 ring-2 ring-red-500" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                    />
                ))}
                <label className="flex items-center gap-2 text-xs">
                    Custom
                    <input type="color" aria-label="Custom theme color" value={value || "#6366f1"} onChange={(event) => onChange(event.target.value)} className="h-9 w-10 cursor-pointer rounded border-0 bg-transparent" />
                </label>
            </div>
            <input aria-label="Theme color hex value" value={value} onChange={(event) => onChange(event.target.value)} className={`${fieldClass(theme)} mt-2 max-w-40 font-mono`} maxLength={7} />
        </fieldset>
    );
}

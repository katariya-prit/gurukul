import { ICON_OPTIONS } from "../utils/constants";
import { useTheme } from "../../../components/theme/ThemeContext";

export default function IconPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    const { theme } = useTheme();
    return (
        <fieldset>
            <legend className="mb-2 text-sm font-medium">Icon</legend>
            <div className="grid grid-cols-8 gap-2">
                {ICON_OPTIONS.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        type="button"
                        title={label}
                        aria-label={`Choose ${label} icon`}
                        aria-pressed={value === key}
                        onClick={() => onChange(key)}
                        className={`flex h-10 items-center justify-center rounded-xl border transition focus-visible:outline-2 ${
                            value === key
                                ? theme ? "border-blue-400 bg-blue-500/15 text-blue-300" : "border-red-400 bg-red-50 text-red-700"
                                : theme ? "border-slate-700 text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                    >
                        <Icon className="text-lg" aria-hidden="true" />
                    </button>
                ))}
            </div>
        </fieldset>
    );
}

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTheme } from "../../../components/theme/ThemeContext";

interface ActiveToggleProps {
    active: boolean;
    label: string;
    onChange: (active: boolean) => Promise<void>;
    onDeactivateRequest?: () => void;
}

export default function ActiveToggle({ active, label, onChange, onDeactivateRequest }: ActiveToggleProps) {
    const { theme } = useTheme();
    const [checked, setChecked] = useState(active);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        setChecked(active);
    }, [active]);

    const toggle = async () => {
        if (busy) return;
        const next = !checked;
        if (!next && onDeactivateRequest) {
            onDeactivateRequest();
            return;
        }
        setChecked(next);
        setBusy(true);
        try {
            await onChange(next);
            toast.success(next ? `${label} activated.` : `${label} deactivated. Its data is kept.`);
        } catch (error) {
            setChecked(!next);
            toast.error(error instanceof Error ? error.message : `Could not update ${label}.`);
        } finally {
            setBusy(false);
        }
    };

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={`${label}: ${checked ? "active" : "inactive"}`}
            disabled={busy}
            onClick={() => void toggle()}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 ${
                checked
                    ? theme ? "bg-blue-500 focus-visible:outline-blue-300" : "bg-red-600 focus-visible:outline-red-500"
                    : theme ? "bg-slate-700 focus-visible:outline-slate-400" : "bg-slate-300 focus-visible:outline-slate-500"
            }`}
        >
            <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
        </button>
    );
}

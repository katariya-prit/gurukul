export function RadioRow({
    dark,
    accent,
    label,
    selected,
    onClick,
}: {
    dark: boolean;
    accent: string;
    label: string;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={onClick}
            className={`flex w-full items-center gap-4 px-5 py-3 text-left text-sm font-medium transition-colors ${
                dark ? "hover:bg-slate-800/70" : "hover:bg-slate-50"
            }`}
        >
            <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                style={{ borderColor: selected ? accent : dark ? "#475569" : "#cbd5e1" }}
            >
                {selected && <span className="h-2.5 w-2.5 rounded-full" style={{ background: accent }} />}
            </span>
            {label}
        </button>
    );
}

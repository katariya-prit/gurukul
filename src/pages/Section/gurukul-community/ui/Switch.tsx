export function Switch({ on, dark, accent }: { on: boolean; dark: boolean; accent: string }) {
    return (
        <span
            aria-hidden="true"
            className={`relative inline-block h-6 w-11 shrink-0 rounded-full transition-colors ${
                on ? "" : dark ? "bg-slate-700" : "bg-slate-300"
            }`}
            style={on ? { backgroundColor: accent } : undefined}
        >
            <span
                className="absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                style={{ transform: `translateX(${on ? 22 : 2}px)` }}
            />
        </span>
    );
}

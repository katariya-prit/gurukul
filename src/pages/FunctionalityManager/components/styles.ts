export function surfaceClass(theme: boolean): string {
    return theme
        ? "border-white/10 bg-slate-900/70 text-slate-100"
        : "border-slate-200 bg-white text-slate-800";
}

export function fieldClass(theme: boolean): string {
    return `w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus-visible:ring-2 ${
        theme
            ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-blue-500/30"
            : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus-visible:border-red-400 focus-visible:ring-red-500/20"
    }`;
}

export function mutedTextClass(theme: boolean): string {
    return theme ? "text-slate-400" : "text-slate-500";
}

export function softButtonClass(theme: boolean): string {
    return theme
        ? "border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
}

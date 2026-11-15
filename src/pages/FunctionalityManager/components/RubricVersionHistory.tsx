import type { ItemRubric } from "../types";
import { useTheme } from "../../../components/theme/ThemeContext";

export default function RubricVersionHistory({ versions }: { versions: ItemRubric[] }) {
    const { theme } = useTheme();
    return (
        <section className={`rounded-2xl border p-4 ${theme ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-white"}`}>
            <h2 className="mb-3 font-bold">Version history</h2>
            {versions.length ? (
                <ul className="space-y-2">
                    {versions.map((version) => (
                        <li key={version.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm ${theme ? "bg-slate-800/70" : "bg-slate-50"}`}>
                            <span className="font-semibold">v{version.version}{version.isCurrent ? " · Current" : " · Read only"}</span>
                            <span className={theme ? "text-slate-400" : "text-slate-500"}>{new Date(version.createdAt).toLocaleDateString()}</span>
                            <span className={theme ? "text-slate-400" : "text-slate-500"}>{version.createdBy ?? "Unknown"}</span>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-sm opacity-70">No rubric versions yet.</p>}
        </section>
    );
}

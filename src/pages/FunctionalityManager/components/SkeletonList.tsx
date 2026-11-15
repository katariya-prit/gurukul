import { useTheme } from "../../../components/theme/ThemeContext";

export default function SkeletonList({ rows = 4 }: { rows?: number }) {
    const { theme } = useTheme();
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading" aria-busy="true">
            {Array.from({ length: rows }, (_, index) => (
                <div key={index} className={`animate-pulse rounded-2xl border p-5 ${
                    theme ? "border-slate-800 bg-slate-900/70" : "border-slate-200 bg-white"
                }`}>
                    <div className={`h-4 w-2/3 rounded ${theme ? "bg-slate-700" : "bg-slate-200"}`} />
                    <div className={`mt-4 h-3 w-full rounded ${theme ? "bg-slate-800" : "bg-slate-100"}`} />
                    <div className={`mt-2 h-3 w-4/5 rounded ${theme ? "bg-slate-800" : "bg-slate-100"}`} />
                    <div className={`mt-7 h-9 w-28 rounded-xl ${theme ? "bg-slate-800" : "bg-slate-100"}`} />
                </div>
            ))}
        </div>
    );
}

import { LuInbox } from "react-icons/lu";
import { useTheme } from "../../../components/theme/ThemeContext";

export default function EmptyState({ title, description }: { title: string; description: string }) {
    const { theme } = useTheme();
    return (
        <div className={`flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed px-5 text-center ${
            theme ? "border-slate-700 bg-slate-900/40 text-slate-400" : "border-slate-200 bg-slate-50/70 text-slate-500"
        }`}>
            <LuInbox className="mb-3 text-3xl opacity-70" aria-hidden="true" />
            <h2 className={`font-semibold ${theme ? "text-slate-200" : "text-slate-700"}`}>{title}</h2>
            <p className="mt-1 max-w-md text-sm">{description}</p>
        </div>
    );
}

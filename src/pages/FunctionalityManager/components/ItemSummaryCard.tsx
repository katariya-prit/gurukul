import { LuArrowUpRight } from "react-icons/lu";
import { useTheme } from "../../../components/theme/ThemeContext";
import { ICON_OPTIONS } from "../utils/constants";
import type { FunctionalityItem } from "../types";

interface ItemSummaryCardProps {
    item: FunctionalityItem;
    stats: React.ReactNode;
    actionLabel: string;
    onAction: () => void;
    emptyMessage?: string;
}

export default function ItemSummaryCard({ item, stats, actionLabel, onAction, emptyMessage }: ItemSummaryCardProps) {
    const { theme } = useTheme();
    const Icon = ICON_OPTIONS.find((option) => option.key === item.icon)?.icon ?? ICON_OPTIONS[0].icon;

    return (
        <article className={`flex min-w-0 max-w-full flex-col rounded-2xl border p-4 sm:p-5 shadow-sm ${theme ? "border-slate-800 bg-slate-900/70" : "border-slate-200 bg-white"}`}>
            <div className="flex items-start gap-3">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${theme ? "bg-blue-500/10 text-blue-300" : "bg-red-50 text-red-700"}`}>
                    <Icon className="text-xl" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                    <h2 className="truncate font-bold text-base">{item.name}</h2>
                    <p className={`mt-0.5 truncate text-xs ${theme ? "text-slate-400" : "text-slate-500"}`}>{item.departmentName} · {item.functionalityName}</p>
                    <p className={`text-xs ${theme ? "text-slate-500" : "text-slate-400"}`}>{item.itemLabel}</p>
                </div>
            </div>
            <div className="mt-4 flex-1">
                {emptyMessage
                    ? <p className={`text-sm ${theme ? "text-amber-300" : "text-amber-700"}`}>{emptyMessage}</p>
                    : stats}
            </div>
            <button
                type="button"
                onClick={onAction}
                className={`mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    theme
                        ? "bg-linear-to-r from-blue-600 to-indigo-500 text-white hover:from-blue-500 hover:to-indigo-400 focus-visible:outline-blue-300"
                        : "bg-linear-to-r from-[#e60023] to-[#ff7a8a] text-white hover:from-[#c5001e] hover:to-[#ff6375] focus-visible:outline-red-500"
                }`}
            >
                <span>{actionLabel}</span>
                <LuArrowUpRight aria-hidden="true" className="text-base" />
            </button>
        </article>
    );
}

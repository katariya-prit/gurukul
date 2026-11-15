import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { LuBuilding2, LuLayers } from "react-icons/lu";
import { ICON_OPTIONS } from "../utils/constants";
import type { Functionality } from "../types";
import { useTheme } from "../../../components/theme/ThemeContext";
import ActiveToggle from "./ActiveToggle";
import ConfirmDeactivateDialog from "./ConfirmDeactivateDialog";
import { softButtonClass, surfaceClass } from "./styles";

interface FunctionalityCardProps {
    functionality: Functionality;
    onToggle: (id: number, active: boolean) => Promise<void>;
    onEdit: (functionality: Functionality) => void;
}

export default function FunctionalityCard({ functionality, onToggle, onEdit }: FunctionalityCardProps) {
    const { theme } = useTheme();
    const [confirming, setConfirming] = useState(false);
    const Icon = ICON_OPTIONS.find((option) => option.key === functionality.icon)?.icon ?? ICON_OPTIONS[0].icon;

    return (
        <article className={`flex min-w-0 max-w-full flex-col rounded-2xl border p-4 sm:p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${surfaceClass(theme)}`}>
            <div className="flex items-start gap-3">
                <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                        theme ? "bg-slate-800" : "bg-slate-50"
                    }`}
                    style={{ color: functionality.themeColor ?? undefined }}
                >
                    <Icon className="text-2xl" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-bold">{functionality.name}</h2>
                    <p className={`mt-0.5 truncate font-mono text-xs ${theme ? "text-slate-400" : "text-slate-500"}`}>{functionality.key}</p>
                </div>
                <span className="mt-1 h-3 w-3 shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-transparent" style={{ backgroundColor: functionality.themeColor ?? "#64748b" }} aria-label="Theme color" />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${
                    theme ? "bg-blue-500/10 text-blue-300" : "bg-blue-50 text-blue-700"
                }`}>{functionality.evaluatorType === "ai" ? "AI" : functionality.evaluatorType === "teacher" ? "Teacher" : "Both"}</span>
                <span className={`inline-flex items-center gap-1 text-xs ${theme ? "text-slate-400" : "text-slate-500"}`}><LuBuilding2 /> {functionality.departmentCount} departments</span>
                <span className={`inline-flex items-center gap-1 text-xs ${theme ? "text-slate-400" : "text-slate-500"}`}><LuLayers /> {functionality.itemCount} items</span>
            </div>
            <p className={`mt-3 line-clamp-2 min-h-10 text-sm ${theme ? "text-slate-400" : "text-slate-500"}`}>
                {functionality.description || "No description provided."}
            </p>
            <div className={`mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between ${theme ? "border-slate-800" : "border-slate-100"}`}>
                <div className="flex w-full items-center justify-between gap-2 text-xs font-medium sm:w-auto sm:justify-start">
                    <span>{functionality.isActive ? "Active" : "Inactive"}</span>
                    <ActiveToggle
                        active={functionality.isActive}
                        label={functionality.name}
                        onChange={(active) => onToggle(functionality.id, active)}
                        onDeactivateRequest={() => setConfirming(true)}
                    />
                </div>
                <div className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:flex sm:items-center">
                    <Link
                        to={`/dashboard/functionality-manager/functionalities/${functionality.id}/departments`}
                        className={`inline-flex min-h-[44px] items-center justify-center rounded-xl px-2 py-2 text-center text-xs font-semibold transition sm:min-h-0 sm:rounded-lg sm:px-3 sm:py-2 ${softButtonClass(theme)}`}
                    >
                        Departments
                    </Link>
                    <Link
                        to={`/dashboard/functionality-manager/items?functionalityId=${functionality.id}`}
                        className={`inline-flex min-h-[44px] items-center justify-center rounded-xl px-2 py-2 text-center text-xs font-semibold transition sm:min-h-0 sm:rounded-lg sm:px-3 sm:py-2 ${softButtonClass(theme)}`}
                    >
                        Items
                    </Link>
                    <button
                        type="button"
                        onClick={() => onEdit(functionality)}
                        className={`inline-flex min-h-[44px] items-center justify-center rounded-xl px-2 py-2 text-center text-xs font-semibold transition sm:min-h-0 sm:rounded-lg sm:px-3 sm:py-2 ${softButtonClass(theme)}`}
                    >
                        Edit
                    </button>
                </div>
            </div>
            <ConfirmDeactivateDialog
                name={functionality.name}
                open={confirming}
                onCancel={() => setConfirming(false)}
                onConfirm={() => {
                    setConfirming(false);
                    void onToggle(functionality.id, false)
                        .then(() => toast.success(`${functionality.name} deactivated. Its data is kept.`))
                        .catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Could not deactivate functionality."));
                }}
            />
        </article>
    );
}

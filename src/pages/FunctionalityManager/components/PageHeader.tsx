import { useSyncExternalStore } from "react";
import { useTheme } from "../../../components/theme/ThemeContext";
import { functionalityManagerService } from "../services/functionalityManagerService";

interface PageHeaderProps {
    title: string;
    description: string;
    actions?: React.ReactNode;
}

export default function PageHeader({ title, description, actions }: PageHeaderProps) {
    const { theme } = useTheme();
    const mockMode = useSyncExternalStore(
        functionalityManagerService.subscribe,
        functionalityManagerService.isMockMode,
        functionalityManagerService.isMockMode
    );

    return (
        <div className="mb-6 flex flex-col gap-4 border-b border-inherit pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                    {mockMode && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            theme ? "bg-amber-400/10 text-amber-300" : "bg-amber-50 text-amber-700"
                        }`}>
                            Mock data (backend not connected)
                        </span>
                    )}
                </div>
                <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
                <p className={`mt-1 max-w-3xl text-sm ${theme ? "text-slate-400" : "text-slate-500"}`}>{description}</p>
            </div>
            {actions && (
                <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                    {actions}
                </div>
            )}
        </div>
    );
}

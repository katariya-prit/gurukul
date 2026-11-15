import { useState } from "react";
import { LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
import type { DashboardWidget, Functionality, FunctionalityItem, WidgetInput } from "../types";
import { useTheme } from "../../../components/theme/ThemeContext";
import Button from "../../../components/common/Button";
import ActiveToggle from "./ActiveToggle";
import WidgetFormModal from "./WidgetFormModal";
import { surfaceClass } from "./styles";

interface WidgetListProps {
    widgets: DashboardWidget[];
    functionalities: Functionality[];
    items: FunctionalityItem[];
    onSave: (input: WidgetInput, id?: number) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
}

export default function WidgetList({ widgets, functionalities, items, onSave, onDelete }: WidgetListProps) {
    const { theme } = useTheme();
    const [editing, setEditing] = useState<DashboardWidget | null>(null);
    const [open, setOpen] = useState(false);

    return (
        <>
            <div className="mb-4 flex justify-end">
                <Button
                    leftIcon={<LuPlus />}
                    onClick={() => {
                        setEditing(null);
                        setOpen(true);
                    }}
                    className="w-full sm:w-auto"
                >
                    Add widget
                </Button>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {widgets.map((widget) => (
                    <article
                        key={widget.id}
                        className={`flex min-w-0 max-w-full flex-col rounded-2xl border p-4 sm:p-5 ${surfaceClass(theme)}`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <h2 className="truncate font-bold text-base">{widget.title}</h2>
                                <p className="mt-0.5 truncate text-xs opacity-70">
                                    {widget.widgetType} · {widget.functionalityName}
                                </p>
                                {widget.itemName && (
                                    <p className="mt-0.5 truncate text-xs opacity-70">{widget.itemName}</p>
                                )}
                            </div>
                        </div>

                        <p className="mt-3 text-xs opacity-70">
                            Roles: {widget.roles.join(", ") || "None"} · Order {widget.sortOrder}
                        </p>

                        <div
                            className={`mt-4 flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between ${
                                theme ? "border-slate-800" : "border-slate-100"
                            }`}
                        >
                            <div className="flex w-full items-center justify-between gap-2 text-xs font-medium sm:w-auto">
                                <span>{widget.isActive ? "Active" : "Inactive"}</span>
                                <ActiveToggle
                                    active={widget.isActive}
                                    label={widget.title}
                                    onChange={(active) =>
                                        onSave(
                                            {
                                                functionalityId: widget.functionalityId,
                                                itemId: widget.itemId,
                                                widgetType: widget.widgetType,
                                                title: widget.title,
                                                config: widget.config,
                                                roles: widget.roles,
                                                sortOrder: widget.sortOrder,
                                                isActive: active,
                                            },
                                            widget.id
                                        )
                                    }
                                />
                            </div>

                            <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex sm:items-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditing(widget);
                                        setOpen(true);
                                    }}
                                    aria-label={`Edit ${widget.title}`}
                                    className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition sm:min-h-0 sm:rounded-lg ${
                                        theme
                                            ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                                            : "border-slate-200 text-slate-700 hover:bg-slate-50"
                                    }`}
                                >
                                    <LuPencil />
                                    <span>Edit</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void onDelete(widget.id)}
                                    aria-label={`Remove ${widget.title}`}
                                    className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-500/10 sm:min-h-0 sm:rounded-lg"
                                >
                                    <LuTrash2 />
                                    <span>Remove</span>
                                </button>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            <WidgetFormModal
                open={open}
                widget={editing}
                functionalities={functionalities}
                items={items}
                onClose={() => setOpen(false)}
                onSave={(input) => onSave(input, editing?.id)}
            />
        </>
    );
}

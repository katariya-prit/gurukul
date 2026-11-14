import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LuPencil, LuShieldCheck, LuEllipsis, LuSlidersHorizontal, LuLayers, LuShield } from "react-icons/lu";
import Table from "../../../components/common/Table";
import { ICON_OPTIONS } from "../utils/constants";
import type { FunctionalityItem } from "../types";
import { useTheme } from "../../../components/theme/ThemeContext";
import ActiveToggle from "./ActiveToggle";
import ConfirmDeactivateDialog from "./ConfirmDeactivateDialog";
import Modal from "./Modal";

interface ItemsTableProps {
    items: FunctionalityItem[];
    onEdit: (item: FunctionalityItem) => void;
    onToggle: (id: number, active: boolean) => Promise<void>;
}

export default function ItemsTable({ items, onEdit, onToggle }: ItemsTableProps) {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [confirming, setConfirming] = useState<FunctionalityItem | null>(null);
    const [activeSheetItem, setActiveSheetItem] = useState<FunctionalityItem | null>(null);

    const itemLabels = new Set(items.map((item) => item.itemLabel));
    const itemColumnLabel = itemLabels.size === 1 ? items[0]?.itemLabel ?? "Item" : "Item";

    const desktopActions = (item: FunctionalityItem) => (
        <div className="flex flex-wrap gap-1.5">
            <Link
                to={`/dashboard/functionality-manager/rubrics/${item.id}`}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                    theme
                        ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
            >
                Rubric
            </Link>
            <Link
                to={`/dashboard/functionality-manager/levels/${item.id}`}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                    theme
                        ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
            >
                Levels
            </Link>
            <Link
                to={`/dashboard/functionality-manager/permissions/${item.id}`}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                    theme
                        ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
            >
                Permissions
            </Link>
            <button
                type="button"
                onClick={() => onEdit(item)}
                aria-label={`Edit ${item.name}`}
                className={`inline-flex items-center justify-center rounded-lg border p-1.5 transition ${
                    theme
                        ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
            >
                <LuPencil />
            </button>
            {!item.isActive && (
                <button
                    type="button"
                    onClick={() =>
                        void onToggle(item.id, true).catch((error: unknown) =>
                            toast.error(error instanceof Error ? error.message : "Could not activate item.")
                        )
                    }
                    aria-label={`Activate ${item.name}`}
                    className="inline-flex items-center justify-center rounded-lg border border-emerald-500/30 p-1.5 text-emerald-600 hover:bg-emerald-500/10"
                >
                    <LuShieldCheck />
                </button>
            )}
        </div>
    );

    const columns = [
        {
            header: itemColumnLabel,
            accessor: (item: FunctionalityItem) => {
                const Icon = ICON_OPTIONS.find((option) => option.key === item.icon)?.icon ?? ICON_OPTIONS[0].icon;
                return (
                    <div className="flex items-center gap-2">
                        <Icon className="text-lg shrink-0" aria-hidden="true" />
                        <span className="font-medium">{item.name}</span>
                    </div>
                );
            },
        },
        { header: "Department", accessor: (item: FunctionalityItem) => item.departmentName },
        {
            header: "Current rubric version",
            accessor: (item: FunctionalityItem) =>
                item.currentRubricVersion ? `v${item.currentRubricVersion}` : "Not set",
        },
        { header: "Levels", accessor: (item: FunctionalityItem) => item.levelCount },
        {
            header: "Active",
            accessor: (item: FunctionalityItem) => (
                <ActiveToggle
                    active={item.isActive}
                    label={item.name}
                    onChange={(active) => onToggle(item.id, active)}
                    onDeactivateRequest={() => setConfirming(item)}
                />
            ),
        },
        {
            header: "Actions",
            className: "min-w-60",
            accessor: (item: FunctionalityItem) => desktopActions(item),
        },
    ];

    return (
        <>
            <div className="hidden md:block">
                <Table
                    columns={columns}
                    data={items}
                    keyExtractor={(item) => item.id}
                    emptyMessage="No items match these filters."
                />
            </div>

            <div className="space-y-3 md:hidden">
                {items.map((item) => {
                    const Icon = ICON_OPTIONS.find((option) => option.key === item.icon)?.icon ?? ICON_OPTIONS[0].icon;
                    return (
                        <article
                            key={item.id}
                            className={`flex min-w-0 max-w-full flex-col rounded-2xl border p-4 shadow-sm ${
                                theme ? "border-slate-800 bg-slate-900/70" : "border-slate-200 bg-white"
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <span
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                            theme ? "bg-slate-800" : "bg-slate-100"
                                        }`}
                                    >
                                        <Icon className="text-lg" aria-hidden="true" />
                                    </span>
                                    <div className="min-w-0">
                                        <h2 className="truncate font-bold text-base">{item.name}</h2>
                                        <p className="truncate text-xs opacity-70">
                                            {item.departmentName} · {item.itemLabel}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between text-xs opacity-75">
                                <span>Rubric {item.currentRubricVersion ? `v${item.currentRubricVersion}` : "not set"}</span>
                                <span>{item.levelCount} levels</span>
                            </div>

                            <div
                                className={`mt-4 flex items-center justify-between gap-3 border-t pt-3 ${
                                    theme ? "border-slate-800" : "border-slate-100"
                                }`}
                            >
                                <div className="flex items-center gap-2 text-xs font-medium">
                                    <span>{item.isActive ? "Active" : "Inactive"}</span>
                                    <ActiveToggle
                                        active={item.isActive}
                                        label={item.name}
                                        onChange={(active) => onToggle(item.id, active)}
                                        onDeactivateRequest={() => setConfirming(item)}
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setActiveSheetItem(item)}
                                    className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                                        theme
                                            ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                                            : "border-slate-200 text-slate-700 hover:bg-slate-50"
                                    }`}
                                >
                                    <LuEllipsis className="text-base" />
                                    <span>Actions</span>
                                </button>
                            </div>
                        </article>
                    );
                })}
            </div>

            <Modal
                open={Boolean(activeSheetItem)}
                onClose={() => setActiveSheetItem(null)}
                title={activeSheetItem?.name ?? "Item actions"}
                size="sm"
            >
                {activeSheetItem && (
                    <div className="space-y-2 py-2">
                        <button
                            type="button"
                            onClick={() => {
                                const item = activeSheetItem;
                                setActiveSheetItem(null);
                                onEdit(item);
                            }}
                            className={`flex min-h-[48px] w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                                theme ? "hover:bg-slate-800" : "hover:bg-slate-50"
                            }`}
                        >
                            <LuPencil className="text-lg text-blue-500" />
                            <span>Edit item details</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                const id = activeSheetItem.id;
                                setActiveSheetItem(null);
                                navigate(`/dashboard/functionality-manager/rubrics/${id}`);
                            }}
                            className={`flex min-h-[48px] w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                                theme ? "hover:bg-slate-800" : "hover:bg-slate-50"
                            }`}
                        >
                            <LuSlidersHorizontal className="text-lg text-indigo-500" />
                            <span>Edit rubric</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                const id = activeSheetItem.id;
                                setActiveSheetItem(null);
                                navigate(`/dashboard/functionality-manager/levels/${id}`);
                            }}
                            className={`flex min-h-[48px] w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                                theme ? "hover:bg-slate-800" : "hover:bg-slate-50"
                            }`}
                        >
                            <LuLayers className="text-lg text-emerald-500" />
                            <span>Edit levels</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                const id = activeSheetItem.id;
                                setActiveSheetItem(null);
                                navigate(`/dashboard/functionality-manager/permissions/${id}`);
                            }}
                            className={`flex min-h-[48px] w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                                theme ? "hover:bg-slate-800" : "hover:bg-slate-50"
                            }`}
                        >
                            <LuShield className="text-lg text-amber-500" />
                            <span>Edit permissions</span>
                        </button>
                    </div>
                )}
            </Modal>

            <ConfirmDeactivateDialog
                name={confirming?.name ?? ""}
                open={Boolean(confirming)}
                onCancel={() => setConfirming(null)}
                onConfirm={() => {
                    if (confirming) {
                        void onToggle(confirming.id, false)
                            .then(() => toast.success(`${confirming.name} deactivated. Its data is kept.`))
                            .catch((error: unknown) =>
                                toast.error(
                                    error instanceof Error ? error.message : "Could not deactivate item."
                                )
                            );
                    }
                    setConfirming(null);
                }}
            />
        </>
    );
}

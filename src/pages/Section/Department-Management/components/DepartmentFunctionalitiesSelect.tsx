import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LuPuzzle, LuSearch, LuX, LuCheck } from "react-icons/lu";
import { HiChevronDown } from "react-icons/hi";
import { IoClose } from "react-icons/io5";
import { useTheme } from "../../../../components/theme/ThemeContext";
import { ICON_OPTIONS } from "../../../FunctionalityManager/utils/constants";
import type { Functionality } from "../../../FunctionalityManager/types";
import type { SelectedFunctionalityMap } from "../hooks/useDepartmentFunctionalitiesSelect";

interface DepartmentFunctionalitiesSelectProps {
    value: SelectedFunctionalityMap;
    onChange: (next: SelectedFunctionalityMap) => void;
    disabled?: boolean;
    mode: "create" | "edit";
    errors?: Record<number, string>;
    functionalities: Functionality[];
    loading?: boolean;
    error?: string | null;
    isForbidden?: boolean;
    onRetry?: () => void;
}

const getInitials = (name: string): string => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
};

const getFunctionalityIcon = (iconKey: string | null) => {
    if (!iconKey) return LuPuzzle;
    const found = ICON_OPTIONS.find((item) => item.key === iconKey);
    return found ? found.icon : LuPuzzle;
};

export default function DepartmentFunctionalitiesSelect({
    value,
    onChange,
    disabled = false,
    errors = {},
    functionalities,
    loading = false,
    error = null,
    isForbidden = false,
    onRetry,
}: DepartmentFunctionalitiesSelectProps) {
    const { theme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        if (!isOpen) {
            setSearchInput("");
            setDebouncedSearch("");
            setHighlightedIndex(0);
        } else {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    const filteredFunctionalities = useMemo(() => {
        if (!debouncedSearch.trim()) return functionalities;
        const q = debouncedSearch.toLowerCase().trim();
        return functionalities.filter(
            (f) =>
                f.name.toLowerCase().includes(q) ||
                f.key.toLowerCase().includes(q) ||
                (f.description && f.description.toLowerCase().includes(q))
        );
    }, [debouncedSearch, functionalities]);

    const selectedEntries = useMemo(() => Object.entries(value), [value]);
    const selectedCount = selectedEntries.length;

    const handleToggle = useCallback(
        (func: Functionality) => {
            if (disabled) return;
            const next = { ...value };
            if (next[func.id]) {
                delete next[func.id];
            } else {
                next[func.id] = {
                    functionality: func,
                    itemLabel: "Item",
                    isInactive: !func.isActive,
                };
            }
            onChange(next);
        },
        [disabled, onChange, value]
    );

    const handleRemove = useCallback(
        (id: number) => {
            if (disabled) return;
            const next = { ...value };
            delete next[id];
            onChange(next);
        },
        [disabled, onChange, value]
    );

    const handleLabelChange = useCallback(
        (id: number, itemLabel: string) => {
            if (disabled) return;
            const target = value[id];
            if (!target) return;
            onChange({
                ...value,
                [id]: {
                    ...target,
                    itemLabel,
                },
            });
        },
        [disabled, onChange, value]
    );

    const handleSelectAllFiltered = useCallback(() => {
        if (disabled) return;
        const next = { ...value };
        for (const func of filteredFunctionalities) {
            if (!next[func.id]) {
                next[func.id] = {
                    functionality: func,
                    itemLabel: "Item",
                    isInactive: !func.isActive,
                };
            }
        }
        onChange(next);
    }, [disabled, filteredFunctionalities, onChange, value]);

    const handleClearFiltered = useCallback(() => {
        if (disabled) return;
        const targetIds = new Set(filteredFunctionalities.map((f) => f.id));
        const next: SelectedFunctionalityMap = {};
        for (const [idStr, item] of Object.entries(value)) {
            const id = Number(idStr);
            if (!targetIds.has(id)) {
                next[id] = item;
            }
        }
        onChange(next);
    }, [disabled, filteredFunctionalities, onChange, value]);

    const handleListKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIndex((prev) => Math.min(prev + 1, filteredFunctionalities.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            const target = filteredFunctionalities[highlightedIndex];
            if (target) {
                handleToggle(target);
            }
        } else if (e.key === "Tab") {
            setIsOpen(false);
        }
    };

    if (isForbidden) {
        return null;
    }

    return (
        <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/6 dark:border-white/6">
                <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        theme ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-600"
                    }`}
                >
                    <LuPuzzle size={16} />
                </span>
                <h2 className={`text-xs font-bold uppercase tracking-wider ${theme ? "text-gray-400" : "text-slate-400"}`}>
                    Functionalities
                </h2>
            </div>

            {loading ? (
                <div className="space-y-3 p-4 rounded-2xl border animate-pulse border-inherit">
                    <div className={`h-12 rounded-xl ${theme ? "bg-slate-800/60" : "bg-slate-200"}`} />
                    <div className="flex gap-2">
                        <div className={`h-8 w-28 rounded-full ${theme ? "bg-slate-800/60" : "bg-slate-200"}`} />
                        <div className={`h-8 w-36 rounded-full ${theme ? "bg-slate-800/60" : "bg-slate-200"}`} />
                    </div>
                </div>
            ) : error ? (
                <div
                    className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                        theme ? "bg-red-950/20 border-red-800/50 text-red-300" : "bg-red-50 border-red-200 text-red-700"
                    }`}
                >
                    <span className="text-sm">{error}</span>
                    {onRetry && (
                        <button
                            type="button"
                            onClick={onRetry}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold underline hover:no-underline"
                        >
                            Retry
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    <div>
                        <label className={`block text-xs font-semibold mb-1.5 ${theme ? "text-gray-300" : "text-slate-700"}`}>
                            Functionalities
                        </label>

                        <div ref={containerRef} className="relative w-full" onKeyDown={handleListKeyDown}>
                            <button
                                type="button"
                                disabled={disabled}
                                aria-haspopup="listbox"
                                aria-expanded={isOpen}
                                onClick={() => !disabled && setIsOpen((prev) => !prev)}
                                className={`w-full border rounded-xl py-3 pl-11 pr-10 text-sm min-h-11 flex items-center justify-between cursor-pointer outline-none transition-all duration-300 ${
                                    disabled ? "opacity-60 cursor-not-allowed" : ""
                                } ${
                                    theme
                                        ? "bg-[#1f2937]/80 border-gray-700/60 text-white hover:border-blue-500/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                        : "bg-slate-50 border-slate-200 text-slate-900 hover:border-red-400/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                                }`}
                            >
                                <span
                                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                                        theme ? "text-gray-500" : "text-slate-400"
                                    }`}
                                >
                                    <LuPuzzle className="text-lg" />
                                </span>

                                <span className={selectedCount > 0 ? "font-medium" : "opacity-60"}>
                                    {selectedCount === 0
                                        ? "Select functionalities"
                                        : `${selectedCount} selected`}
                                </span>

                                <span
                                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200 ${
                                        isOpen ? "rotate-180" : ""
                                    } ${theme ? "text-gray-400" : "text-slate-400"}`}
                                >
                                    <HiChevronDown className="text-lg" />
                                </span>
                            </button>

                            {isOpen && (
                                <div
                                    className={`absolute left-0 right-0 top-full mt-2 z-50 flex max-h-90 sm:max-h-105 flex-col overflow-hidden rounded-2xl border shadow-2xl transition-all ${
                                        theme
                                            ? "bg-[#0f172a] border-slate-700/80 text-slate-100 shadow-black/60"
                                            : "bg-white border-slate-200 text-slate-800 shadow-slate-300/50"
                                    }`}
                                >
                                    <div className="p-3 border-b border-inherit">
                                        <div className="relative flex items-center">
                                            <LuSearch
                                                className={`absolute left-3 pointer-events-none text-base ${
                                                    theme ? "text-slate-500" : "text-slate-400"
                                                }`}
                                            />
                                            <input
                                                ref={searchInputRef}
                                                type="text"
                                                value={searchInput}
                                                onChange={(e) => setSearchInput(e.target.value)}
                                                placeholder="Search functionalities..."
                                                className={`w-full rounded-xl pl-9 pr-8 py-2 text-base sm:text-sm border outline-none transition ${
                                                    theme
                                                        ? "bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                                                        : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-red-500"
                                                }`}
                                            />
                                            {searchInput && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSearchInput("")}
                                                    className="absolute right-2.5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                                >
                                                    <LuX className="text-sm" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {filteredFunctionalities.length > 0 && (
                                        <div
                                            className={`flex items-center justify-between px-3 py-2 border-b text-[11px] font-semibold tracking-wide ${
                                                theme ? "border-slate-800 bg-slate-900/50 text-slate-400" : "border-slate-100 bg-slate-50 text-slate-500"
                                            }`}
                                        >
                                            <span>
                                                {filteredFunctionalities.length} available
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={handleSelectAllFiltered}
                                                    className={`hover:underline ${
                                                        theme ? "text-blue-400" : "text-red-600"
                                                    }`}
                                                >
                                                    Select all
                                                </button>
                                                <span className="opacity-30">|</span>
                                                <button
                                                    type="button"
                                                    onClick={handleClearFiltered}
                                                    className="hover:underline opacity-80 hover:opacity-100"
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div
                                        ref={listRef}
                                        role="listbox"
                                        aria-multiselectable="true"
                                        className="flex-1 overflow-y-auto p-2 space-y-1"
                                    >
                                        {filteredFunctionalities.length === 0 ? (
                                            <div className="p-6 text-center">
                                                <p className="text-sm font-semibold">
                                                    {functionalities.length === 0
                                                        ? "No functionalities created yet"
                                                        : "No matching functionalities"}
                                                </p>
                                                <p
                                                    className={`text-xs mt-1 max-w-xs mx-auto ${
                                                        theme ? "text-slate-400" : "text-slate-500"
                                                    }`}
                                                >
                                                    {functionalities.length === 0
                                                        ? "A super admin can create them in Functionality Manager."
                                                        : "Try a different search query."}
                                                </p>
                                            </div>
                                        ) : (
                                            filteredFunctionalities.map((func, index) => {
                                                const isSelected = Boolean(value[func.id]);
                                                const IconComp = getFunctionalityIcon(func.icon);
                                                const isHighlighted = highlightedIndex === index;

                                                return (
                                                    <div
                                                        key={func.id}
                                                        role="option"
                                                        aria-selected={isSelected}
                                                        tabIndex={-1}
                                                        onClick={() => handleToggle(func)}
                                                        onMouseEnter={() => setHighlightedIndex(index)}
                                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                                                            isSelected
                                                                ? theme
                                                                    ? "bg-blue-900/30 text-white"
                                                                    : "bg-red-50 text-slate-900"
                                                                : isHighlighted
                                                                    ? theme
                                                                        ? "bg-slate-800 text-white"
                                                                        : "bg-slate-100 text-slate-900"
                                                                    : theme
                                                                        ? "text-slate-300 hover:bg-slate-800/70"
                                                                        : "text-slate-700 hover:bg-slate-50"
                                                        }`}
                                                    >
                                                        <div
                                                            className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 transition-colors ${
                                                                isSelected
                                                                    ? theme
                                                                        ? "bg-blue-600 border-blue-500 text-white"
                                                                        : "bg-red-600 border-red-500 text-white"
                                                                    : theme
                                                                        ? "border-slate-600 bg-slate-800/80"
                                                                        : "border-slate-300 bg-white"
                                                            }`}
                                                        >
                                                            {isSelected && <LuCheck className="text-xs stroke-3" />}
                                                        </div>

                                                        <div
                                                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                                                theme ? "bg-slate-800" : "bg-slate-100"
                                                            }`}
                                                            style={func.themeColor ? { color: func.themeColor } : undefined}
                                                        >
                                                            <IconComp className="text-base" />
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold text-sm truncate">
                                                                    {func.name}
                                                                </span>
                                                                <span className="font-mono text-[11px] opacity-60 truncate">
                                                                    {func.key}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <span
                                                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                                                theme
                                                                    ? "bg-blue-500/10 text-blue-300"
                                                                    : "bg-red-50 text-red-700"
                                                            }`}
                                                        >
                                                            {func.evaluatorType === "ai"
                                                                ? "AI"
                                                                : func.evaluatorType === "teacher"
                                                                    ? "Teacher"
                                                                    : "Both"}
                                                        </span>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedCount > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1" aria-label="Selected functionalities">
                            {selectedEntries.map(([idStr, item]) => {
                                const id = Number(idStr);
                                const IconComp = getFunctionalityIcon(item.functionality.icon);

                                return (
                                    <span
                                        key={id}
                                        title={item.functionality.name}
                                        className={`flex items-center gap-2 text-[10px] md:text-[11px] pl-1 pr-3 py-1 rounded-full font-medium transition-colors border ${
                                            theme
                                                ? "bg-slate-900/50 border-slate-700/60 text-slate-300 hover:border-slate-600"
                                                : "bg-slate-50 border-slate-200 text-slate-700 shadow-sm hover:border-red-200 hover:bg-red-50/30"
                                        }`}
                                    >
                                        <span
                                            className={`w-7 h-7 rounded-full flex items-center justify-center overflow-hidden text-[9px] font-bold tracking-wider shrink-0 shadow-inner ${
                                                theme
                                                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                                    : "bg-red-50 text-red-600 border border-red-100"
                                            }`}
                                            style={item.functionality.themeColor ? { color: item.functionality.themeColor } : undefined}
                                        >
                                            {IconComp ? (
                                                <IconComp className="text-xs" />
                                            ) : (
                                                getInitials(item.functionality.name)
                                            )}
                                        </span>

                                        <span className="whitespace-normal max-w-44 sm:max-w-60 truncate">
                                            {item.functionality.name}
                                        </span>

                                        {item.isInactive && (
                                            <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-500">
                                                Inactive
                                            </span>
                                        )}

                                        {!disabled && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemove(id)}
                                                aria-label={`Remove ${item.functionality.name}`}
                                                className="ml-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-400 hover:text-red-500 transition"
                                            >
                                                <IoClose className="text-sm" />
                                            </button>
                                        )}
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    <div className="space-y-3 pt-2">
                        <AnimatePresence>
                            {selectedEntries.map(([idStr, item]) => {
                                const id = Number(idStr);
                                const errorMsg = errors[id];
                                const IconComp = getFunctionalityIcon(item.functionality.icon);

                                return (
                                    <motion.div
                                        key={id}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="overflow-hidden"
                                    >
                                        <div
                                            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-colors ${
                                                theme
                                                    ? "bg-slate-900/40 border-slate-800"
                                                    : "bg-slate-50/80 border-slate-200"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <span
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                        theme ? "bg-slate-800" : "bg-white border border-slate-200"
                                                    }`}
                                                    style={item.functionality.themeColor ? { color: item.functionality.themeColor } : undefined}
                                                >
                                                    <IconComp className="text-base" />
                                                </span>
                                                <div className="min-w-0">
                                                    <p
                                                        className={`text-sm font-semibold truncate ${
                                                            theme ? "text-slate-200" : "text-slate-800"
                                                        }`}
                                                    >
                                                        {item.functionality.name}
                                                    </p>
                                                    <p className="text-[11px] font-mono opacity-60 truncate">
                                                        {item.functionality.key}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="w-full sm:w-72 flex flex-col">
                                                <label
                                                    className={`block text-[11px] font-semibold mb-1 uppercase tracking-wider ${
                                                        theme ? "text-slate-400" : "text-slate-500"
                                                    }`}
                                                >
                                                    Item label <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    maxLength={50}
                                                    disabled={disabled}
                                                    value={item.itemLabel}
                                                    onChange={(e) => handleLabelChange(id, e.target.value)}
                                                    placeholder="Instrument, Dance Form, Skill ..."
                                                    className={`w-full min-h-10.5 px-3.5 py-2 rounded-xl text-base sm:text-sm border outline-none transition-all ${
                                                        errorMsg
                                                            ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                                                            : theme
                                                                ? "bg-[#1e293b]/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                                                : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                                    }`}
                                                />
                                                {errorMsg && (
                                                    <span className="text-xs text-red-500 mt-1 font-medium">
                                                        {errorMsg}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
}

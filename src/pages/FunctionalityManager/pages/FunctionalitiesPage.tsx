import { useEffect, useMemo, useState } from "react";
import { LuPlus, LuSearch, LuX } from "react-icons/lu";
import { toast } from "sonner";
import Button from "../../../components/common/Button";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import FunctionalityCard from "../components/FunctionalityCard";
import FunctionalityFormModal from "../components/FunctionalityFormModal";
import PageHeader from "../components/PageHeader";
import SkeletonList from "../components/SkeletonList";
import { useFunctionalities } from "../hooks/useFunctionalities";
import { useTheme } from "../../../components/theme/ThemeContext";
import type { Functionality, FunctionalityInput } from "../types";

export default function FunctionalitiesPage() {
    const { theme } = useTheme();
    const { functionalities, loading, error, reload, save, setActive } = useFunctionalities();
    const [inputValue, setInputValue] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [editing, setEditing] = useState<Functionality | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(inputValue);
        }, 300);
        return () => clearTimeout(timer);
    }, [inputValue]);

    const filtered = useMemo(
        () =>
            functionalities.filter((entry) =>
                `${entry.name} ${entry.key} ${entry.description ?? ""}`
                    .toLowerCase()
                    .includes(debouncedQuery.toLowerCase())
            ),
        [debouncedQuery, functionalities]
    );

    const saveFunctionality = async (input: FunctionalityInput) => {
        try {
            await save(input, editing?.id);
            toast.success(editing ? "Functionality updated." : "Functionality created.");
        } catch (saveError) {
            toast.error(saveError instanceof Error ? saveError.message : "Could not save functionality.");
            throw saveError;
        }
    };

    return (
        <div className="w-full min-w-0">
            <PageHeader
                title="Functionalities"
                description="Create reusable modules and assign them to departments without losing existing data."
                actions={
                    <Button
                        leftIcon={<LuPlus />}
                        onClick={() => {
                            setEditing(null);
                            setModalOpen(true);
                        }}
                        className="w-full sm:w-auto"
                    >
                        Add Functionality
                    </Button>
                }
            />

            <div className="mb-6 max-w-md">
                <div className="relative flex h-11 w-full items-center">
                    <LuSearch
                        className={`pointer-events-none absolute left-3.5 text-base ${
                            theme ? "text-gray-400" : "text-neutral-400"
                        }`}
                        aria-hidden="true"
                    />
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(event) => setInputValue(event.target.value)}
                        placeholder="Search functionalities..."
                        aria-label="Search functionalities"
                        className={`h-11 w-full rounded-xl border pl-10 pr-9 text-base transition-all duration-200 outline-none sm:text-sm ${
                            theme
                                ? "bg-gray-800 text-white border-gray-700 hover:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                                : "bg-neutral-50 text-neutral-900 border-neutral-200 hover:border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        }`}
                    />
                    {inputValue && (
                        <button
                            type="button"
                            onClick={() => {
                                setInputValue("");
                                setDebouncedQuery("");
                            }}
                            aria-label="Clear search"
                            className={`absolute right-3 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs transition ${
                                theme ? "text-gray-400 hover:text-white" : "text-neutral-400 hover:text-neutral-900"
                            }`}
                        >
                            <LuX className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <SkeletonList />
            ) : error ? (
                <ErrorState message={error} onRetry={() => void reload()} />
            ) : filtered.length === 0 ? (
                <EmptyState
                    title={debouncedQuery ? "No matches" : "No functionalities yet"}
                    description={
                        debouncedQuery
                            ? "Try another search."
                            : "Add a functionality to start configuring department-specific learning."
                    }
                />
            ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((functionality) => (
                        <div key={functionality.id} className="relative min-w-0 max-w-full">
                            <FunctionalityCard
                                functionality={functionality}
                                onToggle={setActive}
                                onEdit={(entry) => {
                                    setEditing(entry);
                                    setModalOpen(true);
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}

            <FunctionalityFormModal
                open={modalOpen}
                functionality={editing}
                onClose={() => setModalOpen(false)}
                onSave={saveFunctionality}
            />
        </div>
    );
}

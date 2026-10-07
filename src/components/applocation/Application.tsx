import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../theme/ThemeContext";
import Input from "../common/Input";
import { createPortal } from "react-dom";
import Button from "../common/Button";
import SearchableDropdown from "../common/SearchableDropdown";
import { HiOutlineDocumentText, HiX } from "react-icons/hi";
import type { ApplicationPayload, DropdownOptionLike } from "../../Types/Application";
import { toast } from "sonner";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ApplicationProps {
    onClose?: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

// Defensive helper — normalizes whatever shape the API returns into a plain array.
// Handles: a bare array, { data: [...] }, { departments: [...] }, { sections: [...] },
// or a single object instead of a list.
const toArray = (result: any): any[] => {
    if (Array.isArray(result)) return result;
    if (result && Array.isArray(result.data)) return result.data;
    if (result && Array.isArray(result.departments)) return result.departments;
    if (result && Array.isArray(result.sections)) return result.sections;
    if (result && typeof result === "object") return [result];
    return [];
};

const applicationService = {
    async getDepartments(): Promise<any> {
        const response = await fetch(`${API_URL}/departments`);
        const result: any = await response.json();
        if (!response.ok) {
            throw new Error(result.message || "Departments fetch failed.");
        }
        return result;
    },

    async getSections(): Promise<any> {
        const response = await fetch(`${API_URL}/sections`);
        const result: any = await response.json();
        if (!response.ok) {
            throw new Error(result.message || "Sections fetch failed.");
        }
        return result;
    },

    async createApplication(payload: ApplicationPayload) {
        const response = await fetch(`${API_URL}/applications/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(result.message || "Application submit failed.");
        }
        return result;
    },
};

export default function Application({ onClose }: ApplicationProps) {
    const { theme } = useTheme();
    const [name, setName] = useState<string>("");
    const [suid, setSuid] = useState<string>("");
    const [subject, setSubject] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [departmentId, setDepartmentId] = useState<number | string>("");
    const [sectionId, setSectionId] = useState<number | string>("");

    const [departments, setDepartments] = useState<DropdownOptionLike[]>([]);
    const [sections, setSections] = useState<DropdownOptionLike[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingOptions, setLoadingOptions] = useState(true);

    // Fetch departments + sections once on mount
    useEffect(() => {
        const loadDropdownData = async () => {
            setLoadingOptions(true);
            try {
                const [departmentResult, sectionResult] = await Promise.all([
                    applicationService.getDepartments(),
                    applicationService.getSections(),
                ]);

                const departmentOptions: DropdownOptionLike[] = toArray(departmentResult).map(
                    (d: any) => ({
                        label: d.departmentName,
                        value: d.departmentId,
                    })
                );

                const sectionOptions: DropdownOptionLike[] = toArray(sectionResult).map(
                    (s: any) => ({
                        label: s.sectionName,
                        value: s.sectionId,
                        departmentId: s.departmentId,
                    })
                );

                setDepartments(departmentOptions);
                setSections(sectionOptions);

                if (departmentOptions.length === 0) {
                    toast.error("No departments found.");
                }
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to load form data.");
            } finally {
                setLoadingOptions(false);
            }
        };

        loadDropdownData();
    }, []);

    const filteredSections = useMemo(() => {
        if (!departmentId) return sections;
        return sections.filter((section: any) => Number(section.departmentId) === Number(departmentId));
    }, [departmentId, sections]);

    // Reset section if it no longer belongs to the selected department
    useEffect(() => {
        if (sectionId && !filteredSections.some((s: any) => s.value === sectionId)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSectionId("");
        }
    }, [departmentId, filteredSections, sectionId]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!suid || !subject || !departmentId || !sectionId) {
            toast.error("Please fill all required fields.");
            return;
        }

        const payload: ApplicationPayload = {
            name,
            suid: Number(suid),
            subject,
            departmentId: Number(departmentId),
            sectionId: Number(sectionId),
        };

        setLoading(true);
        try {
            await applicationService.createApplication(payload);
            toast.success("Application submitted successfully.");
            onClose?.();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/80 px-4 py-6 overflow-y-auto backdrop-blur-sm">
            <div className={`relative w-full max-w-4xl overflow-hidden rounded-2xl border shadow-2xl transition-all duration-300 my-auto ${theme ? "border-gray-800 bg-gray-900 text-white" : "border-neutral-200 bg-white text-neutral-900"}`}>

                <button
                    type="button"
                    onClick={onClose}
                    className={`absolute right-4 top-4 rounded-full p-2 transition-all duration-200 z-10 ${theme ? "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900"}`}
                >
                    <HiX size={18} />
                </button>

                <div className="p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4 border-b pb-6">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${theme ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-600"}`}>
                            <HiOutlineDocumentText size={24} />
                        </div>
                        <div>
                            <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${theme ? "text-blue-200" : "text-red-700"}`}>Application Form</h2>
                            <p className={`mt-1 text-xs sm:text-sm ${theme ? "text-gray-400" : "text-neutral-500"}`}>Create a new application with linked user, department, and section details.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className={`text-sm font-semibold ${theme ? "text-gray-300" : "text-neutral-700"}`}>Name</label>
                                <Input
                                    type="text"
                                    placeholder="Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="opacity-75 bg-neutral-100 dark:bg-gray-800"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className={`text-sm font-semibold ${theme ? "text-gray-300" : "text-neutral-700"}`}>SUID</label>
                                <Input
                                    type="number"
                                    placeholder="SUID will auto-fill"
                                    value={suid}
                                    onChange={(e) => setSuid(e.target.value)}
                                    required
                                    className="opacity-75 bg-neutral-100 dark:bg-gray-800"
                                />
                            </div>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="space-y-2">
                                <SearchableDropdown
                                    label="Department"
                                    placeholder={loadingOptions ? "Loading departments..." : "Select department"}
                                    options={departments}
                                    selectedValue={departmentId}
                                    onSelect={(value) => setDepartmentId(value)}
                                    required
                                    disabled={loadingOptions}
                                />
                            </div>

                            <div className="space-y-2">
                                <SearchableDropdown
                                    label="Section"
                                    placeholder={
                                        loadingOptions
                                            ? "Loading sections..."
                                            : departmentId
                                            ? "Select section"
                                            : "Select department first"
                                    }
                                    options={filteredSections}
                                    selectedValue={sectionId}
                                    onSelect={(value) => setSectionId(value)}
                                    required
                                    disabled={!departmentId || loadingOptions}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className={`text-sm font-semibold ${theme ? "text-gray-300" : "text-neutral-700"}`}>Subject</label>
                            <Input
                                type="text"
                                placeholder="Enter application subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className={`text-sm font-semibold ${theme ? "text-gray-300" : "text-neutral-700"}`}>Description</label>
                            <textarea
                                rows={4}
                                placeholder="Describe your application details..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-300 resize-none ${theme ? "border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" : "border-neutral-200 bg-neutral-50 text-neutral-900 placeholder-neutral-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"}`}
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t pt-5 mt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${theme ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                            >
                                Cancel
                            </button>
                            <Button type="submit" isLoading={loading} className="px-6">
                                {loading ? "Submitting..." : "Submit Application"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
}
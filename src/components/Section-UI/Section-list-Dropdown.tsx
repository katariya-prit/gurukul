    import { useState, useEffect } from "react";
    import { useTheme } from "../theme/ThemeContext";
    import DataCruding from "../common/DataCruding";
    import { HiOutlineOfficeBuilding, HiOutlineUserGroup } from "react-icons/hi";
    import { HiSearch, HiFilter, HiChevronDown, HiChevronRight } from "react-icons/hi";
    import { toast } from "sonner";

    interface SectionData {
        id: number;
        sectionName: string;
        sectionHead: number;
        sectionHeadName: string;
        departmentId: number;
        departmentName: string;
    }

    interface StudentData {
        suid: number;
        name: string;
        username: string;
        avatar: string;
        departmentId: number;
        sectionId: number;
        joiningDate: string;
        status: string;
    }

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

    export default function SectionListDropdown() {
        const { theme } = useTheme();
        const [sections, setSections] = useState<SectionData[]>([]);
        const [allStudents, setAllStudents] = useState<StudentData[]>([]);
        const [loading, setLoading] = useState<boolean>(true);
        const [studentsLoading, setStudentsLoading] = useState<boolean>(false);
        const [searchQuery, setSearchQuery] = useState("");
        const [filterType, setFilterType] = useState("all");
        const [isFilterOpen, setIsFilterOpen] = useState(false);
        const [expandedSectionId, setExpandedSectionId] = useState<number | null>(null);

        const filterOptions = [
            { label: "All Fields", value: "all" },
            { label: "Section Name", value: "sectionName" },
            { label: "Section Head", value: "sectionHeadName" },
            { label: "Department", value: "departmentName" },
        ];

        const fetchSections = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_URL}/sections`);
                const result = await response.json();
                if (result.success) {
                    setSections(result.data);
                }
            } catch (error) {
                console.error(error);
                toast.error("Failed to load sections data");
            } finally {
                setLoading(false);
            }
        };

        // Students fetched once, filtered client-side per section on expand
        // (no dedicated /sections/:id/students endpoint exists yet)
        const fetchAllStudents = async () => {
            try {
                setStudentsLoading(true);
                const response = await fetch(`${API_URL}/users`);
                const result = await response.json();
                if (result.success && Array.isArray(result.data)) {
                    setAllStudents(result.data);
                }
            } catch (error) {
                console.error(error);
                toast.error("Failed to load students data");
            } finally {
                setStudentsLoading(false);
            }
        };

        useEffect(() => {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchSections();
            fetchAllStudents();
        }, []);

        const getSearchInputConfig = () => {
            switch (filterType) {
                case "sectionName":
                    return { type: "text", placeholder: "Search Section Name..." };
                case "sectionHeadName":
                    return { type: "text", placeholder: "Search Section Head..." };
                case "departmentName":
                    return { type: "text", placeholder: "Search Department..." };
                default:
                    return { type: "text", placeholder: "Search Across All Records..." };
            }
        };

        const inputConfig = getSearchInputConfig();

        const filteredSections = sections.filter((sec) => {
            const query = searchQuery.toLowerCase().trim();
            if (!query) return true;

            switch (filterType) {
                case "sectionName":
                    return sec.sectionName.toLowerCase().includes(query);
                case "sectionHeadName":
                    return sec.sectionHeadName?.toLowerCase().includes(query);
                case "departmentName":
                    return sec.departmentName?.toLowerCase().includes(query);
                default:
                    return (
                        sec.sectionName.toLowerCase().includes(query) ||
                        sec.sectionHeadName?.toLowerCase().includes(query) ||
                        sec.departmentName?.toLowerCase().includes(query)
                    );
            }
        });

        const handleEditSection = (id: number) => {
            console.log("Edit Section ID:", id);
        };

        const handleDeleteSection = async (id: number) => {
            if (window.confirm("Are you sure you want to delete this section?")) {
                try {
                    const response = await fetch(`${API_URL}/sections/${id}`, {
                        method: "DELETE",
                    });
                    const result = await response.json();
                    if (result.success) {
                        setSections((prev) => prev.filter((sec) => sec.id !== id));
                        toast.success("Section deleted successfully");
                    } else {
                        toast.error(result.message || "Could not delete section");
                    }
                } catch (error) {
                    console.error(error);
                    toast.error("Something went wrong");
                }
            }
        };

        const toggleSection = (id: number) => {
            setExpandedSectionId((prev) => (prev === id ? null : id));
        };

        const getStudentsForSection = (sectionId: number) =>
            allStudents.filter((s) => Number(s.sectionId) === Number(sectionId));

        const rowBase = `border-b transition-colors cursor-pointer ${theme ? "border-gray-800 hover:bg-gray-800/40" : "border-neutral-100 hover:bg-neutral-50"
            }`;
        const cellBase = "px-4 py-3 text-sm align-middle";

        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <span
                            className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 transition-colors ${theme ? "bg-blue-500/10 text-blue-300" : "bg-red-500/10 text-red-600"
                                }`}
                        >
                            <HiOutlineOfficeBuilding size={20} />
                        </span>
                        <div>
                            <h2 className={`text-xl font-bold leading-tight ${theme ? "text-blue-200" : "text-red-600"}`}>
                                Section List
                            </h2>
                            <p className={`text-xs mt-0.5 ${theme ? "text-gray-500" : "text-neutral-400"}`}>
                                Showing {filteredSections.length} of {sections.length} sections — click a row to view students
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-1">
                        <div className="relative group">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center justify-between pl-9 pr-3 py-2.5 w-40 sm:w-44 rounded-xl border text-sm font-medium outline-none transition-all duration-300 ${theme
                                    ? "bg-gray-800/60 border-gray-700 text-gray-200 focus:ring-2 focus:ring-blue-500/50 hover:border-gray-600 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.3)]"
                                    : "bg-white border-gray-200/80 text-gray-700 focus:ring-2 focus:ring-red-500/20 hover:border-gray-300 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]"
                                    }`}
                            >
                                <div className={`absolute left-3 flex items-center pointer-events-none transition-colors ${theme ? "text-gray-400 group-hover:text-blue-400" : "text-gray-500 group-hover:text-red-600"}`}>
                                    <HiFilter className="w-4 h-4" />
                                </div>
                                <span className="truncate mr-2">
                                    {filterOptions.find((opt) => opt.value === filterType)?.label}
                                </span>
                                <HiChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isFilterOpen ? "rotate-180" : ""} ${theme ? "text-gray-400" : "text-gray-500"}`} />
                            </button>

                            {isFilterOpen && (
                                <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)}></div>
                            )}

                            {isFilterOpen && (
                                <div className={`absolute right-0 z-20 mt-2 w-48 rounded-xl border py-1.5 shadow-xl backdrop-blur-md transform transition-all duration-200 origin-top-right ${theme
                                    ? "bg-gray-800/95 border-gray-700 text-gray-200 shadow-black/40"
                                    : "bg-white/95 border-gray-100 text-gray-700 shadow-gray-200/50"
                                    }`}
                                >
                                    {filterOptions.map((option) => (
                                        <div
                                            key={option.value}
                                            onClick={() => {
                                                setFilterType(option.value);
                                                setSearchQuery("");
                                                setIsFilterOpen(false);
                                            }}
                                            className={`px-4 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between ${filterType === option.value
                                                ? theme ? "bg-blue-500/10 text-blue-400 font-bold" : "bg-red-50/50 text-red-600 font-bold"
                                                : theme ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                                                }`}
                                        >
                                            {option.label}
                                            {filterType === option.value && (
                                                <span className={`w-1.5 h-1.5 rounded-full ${theme ? "bg-blue-400" : "bg-red-600"}`}></span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="relative group">
                            <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${theme ? "text-gray-400 group-focus-within:text-blue-400" : "text-gray-400 group-focus-within:text-red-600"}`}>
                                <HiSearch className="w-4 h-4" />
                            </div>
                            <input
                                type={inputConfig.type}
                                placeholder={inputConfig.placeholder}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`pl-10 pr-4 py-2.5 w-full sm:w-48 lg:w-64 xl:w-72 rounded-xl border text-sm outline-none transition-all duration-300 ease-in-out focus:w-full sm:focus:w-56 lg:focus:w-72 xl:focus:w-80 ${theme
                                    ? "bg-gray-800/60 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 hover:border-gray-600 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.3)]"
                                    : "bg-white border-gray-200/80 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 hover:border-gray-300 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]"
                                    }`}
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className={`w-10 h-10 rounded-full border-4 border-t-transparent animate-spin ${theme ? "border-blue-500" : "border-red-600"}`} />
                    </div>
                ) : filteredSections.length === 0 ? (
                    <div className={`text-center py-16 rounded-2xl border ${theme ? "border-gray-800 text-gray-500" : "border-neutral-200 text-neutral-400"}`}>
                        {searchQuery ? `No sections found matching "${searchQuery}"` : "No sections found!"}
                    </div>
                ) : (
                    <div className={`rounded-2xl border overflow-hidden ${theme ? "border-gray-800" : "border-neutral-200"}`}>
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className={`${theme ? "bg-gray-800/60 text-gray-300" : "bg-neutral-50 text-neutral-600"} text-xs uppercase tracking-wider`}>
                                    <th className="px-4 py-3 text-left w-8"></th>
                                    <th className="px-4 py-3 text-left w-20">ID</th>
                                    <th className="px-4 py-3 text-left">Section Name</th>
                                    <th className="px-4 py-3 text-left">Section Head</th>
                                    <th className="px-4 py-3 text-left">Department</th>
                                    <th className="px-4 py-3 text-center w-16">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSections.map((sec) => {
                                    const isExpanded = expandedSectionId === sec.id;
                                    const students = getStudentsForSection(sec.id);

                                    return (
                                        <>
                                            <tr
                                                key={sec.id}
                                                className={rowBase}
                                                onClick={() => toggleSection(sec.id)}
                                            >
                                                <td className={cellBase}>
                                                    {isExpanded ? (
                                                        <HiChevronDown className={theme ? "text-blue-400" : "text-red-600"} />
                                                    ) : (
                                                        <HiChevronRight className={theme ? "text-gray-500" : "text-neutral-400"} />
                                                    )}
                                                </td>
                                                <td className={`${cellBase} font-mono font-bold ${theme ? "text-gray-400" : "text-gray-500"}`}>
                                                    {sec.id}
                                                </td>
                                                <td className={`${cellBase} font-bold`}>{sec.sectionName}</td>
                                                <td className={cellBase}>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-sm">
                                                            {sec.sectionHeadName || "Not Assigned"}
                                                        </span>
                                                        <span className="text-xs text-gray-400 font-mono">
                                                            Head ID: {sec.sectionHead ?? "—"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className={cellBase}>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-sm">{sec.departmentName}</span>
                                                        <span className="text-xs text-gray-400 font-mono">
                                                            Dept ID: {sec.departmentId}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className={`${cellBase} text-center`} onClick={(e) => e.stopPropagation()}>
                                                    <DataCruding
                                                        onEdit={() => handleEditSection(sec.id)}
                                                        onDelete={() => handleDeleteSection(sec.id)}
                                                    />
                                                </td>
                                            </tr>

                                            {isExpanded && (
                                                <tr className={theme ? "bg-gray-900/60" : "bg-neutral-50/70"}>
                                                    <td colSpan={6} className="px-4 py-4">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <HiOutlineUserGroup className={theme ? "text-blue-400" : "text-red-600"} size={16} />
                                                            <span className={`text-xs font-bold uppercase tracking-wider ${theme ? "text-gray-400" : "text-neutral-500"}`}>
                                                                Students in {sec.sectionName} ({students.length})
                                                            </span>
                                                        </div>

                                                        {studentsLoading ? (
                                                            <div className="flex justify-center py-6">
                                                                <div className={`w-6 h-6 rounded-full border-2 border-t-transparent animate-spin ${theme ? "border-blue-500" : "border-red-600"}`} />
                                                            </div>
                                                        ) : students.length === 0 ? (
                                                            <p className={`text-sm py-4 text-center ${theme ? "text-gray-500" : "text-neutral-400"}`}>
                                                                No students assigned to this section yet.
                                                            </p>
                                                        ) : (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                {students.map((student) => (
                                                                    <div
                                                                        key={student.suid}
                                                                        className={`flex items-center gap-3 p-3 rounded-xl border ${theme
                                                                            ? "bg-gray-800/60 border-gray-700"
                                                                            : "bg-white border-neutral-200"
                                                                            }`}
                                                                    >
                                                                        <div
                                                                            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${theme
                                                                                ? "bg-blue-500/10 text-blue-300"
                                                                                : "bg-red-500/10 text-red-600"
                                                                                }`}
                                                                        >
                                                                            {student.name?.charAt(0)?.toUpperCase() || "?"}
                                                                        </div>
                                                                        <div className="flex flex-col min-w-0">
                                                                            <span className="text-sm font-semibold truncate">{student.name}</span>
                                                                            <span className="text-xs text-gray-400 font-mono truncate">
                                                                                SUID: {student.suid} · {student.status}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    }
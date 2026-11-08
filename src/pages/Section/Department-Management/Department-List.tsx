import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Table from "../../../components/common/Table";
import { useTheme } from "../../../components/theme/ThemeContext";
import DataCruding from "../../../components/common/DataCruding";
import { FaBuildingColumns } from "react-icons/fa6";
import { HiSearch, HiFilter, HiChevronDown, HiEye } from "react-icons/hi";
import { toast } from "sonner";
import { getDepartments, deleteDepartment, type DepartmentData } from "../../../action/Department/View";

export default function DepartmentList() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [departments, setDepartments] = useState<DepartmentData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const filterOptions = [
        { label: "All Fields", value: "all" },
        { label: "Department Name", value: "departmentName" },
        { label: "ID", value: "departmentId" },
        { label: "Description", value: "description" },
    ];

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const data = await getDepartments();
            setDepartments(data);
        } catch (error) {
            console.error("Department fetch error:", error);
            toast.error("Failed to fetch departments.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchDepartments();
    }, []);

    const getSearchInputConfig = () => {
        switch (filterType) {
            case "departmentId":
                return { type: "number", placeholder: "Enter Department ID..." };
            case "departmentName":
                return { type: "text", placeholder: "Search Department Name" };
            case "description":
                return { type: "text", placeholder: "Search Description" };
            default:
                return { type: "text", placeholder: "Search Across All Records" };
        }
    };

    const inputConfig = getSearchInputConfig();

    const filteredDepartments = departments.filter((dept) => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;

        switch (filterType) {
            case "departmentName":
                return dept.departmentName.toLowerCase().includes(query);
            case "departmentId":
                return dept.departmentId.toString().includes(query);
            case "description":
                return dept.description?.toLowerCase().includes(query);
            default:
                return (
                    dept.departmentName.toLowerCase().includes(query) ||
                    dept.departmentId.toString().includes(query) ||
                    dept.description?.toLowerCase().includes(query) ||
                    (dept.departmentHeadName && dept.departmentHeadName.toLowerCase().includes(query))
                );
        }
    });

    const handleViewDepartment = (id: number) => {
        navigate(`/dashboard/departments/view/${id}`);
    };

    const handleEditDepartment = (id: number) => {
        navigate(`/dashboard/departments/edit/${id}`);
    };

    const handleDeleteDepartment = async (id: number) => {
        try {
            const isDeleted = await deleteDepartment(id);
            if (isDeleted) {
                setDepartments((prev) => prev.filter((dept) => dept.departmentId !== id));
            }
        } catch (error) {
            console.error("Department delete error:", error);
            toast.error("Something went wrong while deleting.");
        }
    };

    const columns = [
        {
            header: "ID",
            className: `w-20 text-center font-mono font-bold ${theme ? "text-slate-400" : "text-slate-500"
                }`,
            accessor: (dept: DepartmentData) => dept.departmentId,
        },
        {
            header: "Department Name",
            className: `text-left font-bold ${theme ? "text-white" : "text-slate-900"}`,
            accessor: (dept: DepartmentData) => dept.departmentName,
        },
        {
            header: "Department Head",
            className: "text-left",
            accessor: (dept: DepartmentData) => (
                <div className="flex flex-col">
                    <span className={`font-semibold text-sm ${theme ? "text-slate-200" : "text-slate-800"}`}>
                        {dept.departmentHeadName || "Not Assigned"}
                    </span>
                    {dept.departmentHeadId && (
                        <span className={`text-xs font-mono ${theme ? "text-slate-400" : "text-slate-500"}`}>
                            ID: {dept.departmentHeadId}
                        </span>
                    )}
                </div>
            ),
        },
        {
            header: "Description",
            className: `text-left max-w-xs truncate hidden md:table-cell ${theme ? "text-slate-400" : "text-slate-500"
                }`,
            accessor: (dept: DepartmentData) => dept.description || "-",
        },
        {
            header: "Actions",
            className: "w-16 text-center",
            accessor: (dept: DepartmentData) => (
                <DataCruding
                    onView={() => handleViewDepartment(dept.departmentId)}
                    onEdit={() => handleEditDepartment(dept.departmentId)}
                    onDelete={() => void handleDeleteDepartment(dept.departmentId)}
                    viewLabel="View"
                    editLabel="Edit"
                    deleteLabel="Delete"
                />
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Top Header & Actions Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3.5">
                    <span
                        className={`flex items-center justify-center w-11 h-11 rounded-2xl border shrink-0 transition-all backdrop-blur-xl ${theme
                                ? "border-white/15 bg-gradient-to-br from-blue-500/20 to-pink-500/20 text-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                                : "border-[#9b001c]/15 bg-[#9b001c]/10 text-[#9b001c] shadow-sm"
                            }`}
                    >
                        <FaBuildingColumns size={20} />
                    </span>
                    <div>
                        <h2
                            className={`text-xl sm:text-2xl font-black tracking-tight leading-tight ${theme ? "text-white" : "text-[#9b001c]"
                                }`}
                        >
                            Department List
                        </h2>
                        <p className={`text-xs mt-0.5 font-medium ${theme ? "text-slate-400" : "text-slate-500"}`}>
                            Showing {filteredDepartments.length} of {departments.length} departments
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                    <button
                        type="button"
                        onClick={() => navigate("/dashboard/departments/create")}
                        className={`rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition cursor-pointer ${theme
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20"
                                : "bg-[#9b001c] text-white hover:bg-[#7d0017]"
                            }`}
                    >
                        + Add Department
                    </button>

                    {/* Filter Dropdown */}
                    <div className="relative group">
                        <button
                            type="button"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center justify-between pl-9 pr-3 py-2.5 w-40 sm:w-44 rounded-xl border text-sm font-medium outline-none transition-all duration-300 cursor-pointer ${theme
                                    ? "bg-slate-800/70 border-white/10 text-slate-200 focus:ring-2 focus:ring-blue-500/50 hover:border-white/20"
                                    : "bg-white border-gray-200/90 text-gray-700 focus:ring-2 focus:ring-[#9b001c]/20 hover:border-gray-300 shadow-xs"
                                }`}
                        >
                            <div
                                className={`absolute left-3 flex items-center pointer-events-none transition-colors ${theme
                                        ? "text-slate-400 group-hover:text-blue-400"
                                        : "text-gray-500 group-hover:text-[#9b001c]"
                                    }`}
                            >
                                <HiFilter className="w-4 h-4" />
                            </div>
                            <span className="truncate mr-2">
                                {filterOptions.find((opt) => opt.value === filterType)?.label}
                            </span>
                            <HiChevronDown
                                className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isFilterOpen ? "rotate-180" : ""
                                    } ${theme ? "text-slate-400" : "text-gray-500"}`}
                            />
                        </button>

                        {isFilterOpen && (
                            <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                        )}

                        {isFilterOpen && (
                            <div
                                className={`absolute right-0 z-20 mt-2 w-48 rounded-xl border py-1.5 shadow-xl backdrop-blur-xl transform transition-all duration-200 origin-top-right ${theme
                                        ? "bg-slate-900/95 border-white/15 text-slate-200 shadow-black/50"
                                        : "bg-white/95 border-gray-200 text-gray-700 shadow-gray-200/60"
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
                                                ? theme
                                                    ? "bg-blue-500/15 text-blue-400 font-bold"
                                                    : "bg-[#9b001c]/10 text-[#9b001c] font-bold"
                                                : theme
                                                    ? "hover:bg-white/5"
                                                    : "hover:bg-gray-50"
                                            }`}
                                    >
                                        {option.label}
                                        {filterType === option.value && (
                                            <span
                                                className={`w-1.5 h-1.5 rounded-full ${theme ? "bg-blue-400" : "bg-[#9b001c]"
                                                    }`}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Search Input */}
                    <div className="relative group flex-1 sm:flex-initial">
                        <div
                            className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${theme
                                    ? "text-slate-400 group-focus-within:text-blue-400"
                                    : "text-gray-400 group-focus-within:text-[#9b001c]"
                                }`}
                        >
                            <HiSearch className="w-4 h-4" />
                        </div>
                        <input
                            type={inputConfig.type}
                            placeholder={inputConfig.placeholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`pl-10 pr-4 py-2.5 w-full sm:w-48 lg:w-64 xl:w-72 rounded-xl border text-sm outline-none transition-all duration-300 ease-in-out focus:w-full sm:focus:w-56 lg:focus:w-72 xl:focus:w-80 ${theme
                                    ? "bg-slate-800/70 border-white/10 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 hover:border-white/20"
                                    : "bg-white border-gray-200/90 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#9b001c]/20 focus:border-[#9b001c] hover:border-gray-300 shadow-xs"
                                } [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                        />
                    </div>
                </div>
            </div>

            {/* Table Section */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div
                        className={`w-10 h-10 rounded-full border-4 border-t-transparent animate-spin ${theme ? "border-blue-500" : "border-[#9b001c]"
                            }`}
                    />
                </div>
            ) : (
                <div
                    className={`relative overflow-hidden rounded-3xl border backdrop-blur-2xl transition-all duration-300 ${theme
                            ? "border-white/15 bg-slate-900/65 shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
                            : "border-gray-200/80 bg-white/90 shadow-[0_12px_35px_rgba(15,23,42,0.06)]"
                        }`}
                >
                    {/* Single Soft Blurred Blue-Pink Circle in Background */}
                    <div
                        aria-hidden="true"
                        style={{
                            background:
                                "radial-gradient(circle, rgba(59, 130, 246, 0.45) 0%, rgba(236, 72, 153, 0.45) 60%, transparent 100%)",
                            filter: "blur(65px)",
                        }}
                        className={`pointer-events-none absolute -top-16 right-10 h-60 w-60 rounded-full ${theme ? "opacity-45" : "opacity-25"
                            }`}
                    />

                    <div
                        className={`relative z-10 flex items-center justify-between border-b px-5 py-4 ${theme ? "border-white/10" : "border-gray-200/80"
                            }`}
                    >
                        <div
                            className={`flex items-center gap-2 text-sm font-bold ${theme ? "text-slate-200" : "text-slate-800"
                                }`}
                        >
                            <HiEye className={`text-base ${theme ? "text-blue-400" : "text-[#9b001c]"}`} />
                            Department Overview
                        </div>
                    </div>

                    <div className="relative z-10 p-2 sm:p-3">
                        <Table
                            columns={columns}
                            data={filteredDepartments}
                            keyExtractor={(dept) => dept.departmentId}
                            emptyMessage={
                                searchQuery
                                    ? `No departments found matching "${searchQuery}"`
                                    : "No departments found!"
                            }
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
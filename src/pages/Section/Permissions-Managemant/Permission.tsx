import { HiChevronDown, HiFilter, HiSearch } from "react-icons/hi";
import { useTheme } from "../../../components/theme/ThemeContext";
import { AiOutlineFileProtect } from "react-icons/ai";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Table from "../../../components/common/Table";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

interface PendingUser {
    suid: number;
    avatar: string | null;
    name: string;
    username: string;
    roleCode: string;
    role: string | null;
    departmentId: number | null;
    sectionId: number | null;
    joiningDate: string;
    status: "PENDING" | "APPROVED";
}

const getAuthHeaders = (): HeadersInit => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export default function Permission() {
    const { theme } = useTheme();
    const [filterType, setFilterType] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [users, setUsers] = useState<PendingUser[]>([]);

    const fetchPendingUsers = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await fetch(`${API_URL}/users/pending`, {
                headers: getAuthHeaders(),
            });
            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.message || "Failed to load pending users.");
            }

            setUsers(json.data || []);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load pending users.";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const handleApprove = async (suid: number) => {
        try {
            const res = await fetch(`${API_URL}/users/approve/${suid}`, {
                method: "PUT",
                headers: getAuthHeaders(),
            });
            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.message || "Failed to approve user.");
            }

            toast.success("User approved successfully.");
            setUsers((prev) => prev.filter((u) => u.suid !== suid));
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to approve user.");
        }
    };

    const handleDeny = async (suid: number) => {
        const confirmed = window.confirm("Are you sure you want to deny and remove this user?");
        if (!confirmed) return;

        try {
            const res = await fetch(`${API_URL}/users/delete/${suid}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
            });
            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.message || "Failed to deny user.");
            }

            toast.success("User denied and removed.");
            setUsers((prev) => prev.filter((u) => u.suid !== suid));
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to deny user.");
        }
    };

    const getRoleStyle = () => {
        return theme ? "text-gray-300 border-gray-600" : "text-gray-700 border-gray-300";
    };

    const columns = [
        {
            header: "Profile",
            className: "w-16 text-center",
            accessor: (user: PendingUser) => (
                <img
                    src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                    alt={user.name}
                    className={`w-10 h-10 rounded-full object-cover mx-auto border-2 ${theme ? "border-gray-700" : "border-white"} shadow-sm ring-1 ${theme ? "ring-gray-700" : "ring-neutral-200"}`}
                />
            ),
        },
        {
            header: "Sevak Name",
            className: "text-left font-bold",
            accessor: (user: PendingUser) => (
                <span className={theme ? "text-white" : "text-neutral-900"}>{user.name}</span>
            ),
        },
        {
            header: "Role",
            className: "text-center",
            accessor: (user: PendingUser) => (
                <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-md border tracking-wide uppercase ${getRoleStyle()}`}>
                    {user.role || user.roleCode || "N/A"}
                </span>
            ),
        },
        {
            header: "SUID / Code",
            className: "text-center",
            accessor: (user: PendingUser) => (
                <span className={`inline-block px-2.5 py-1 rounded-full font-bold text-xs tabular-nums ${theme ? "bg-blue-950/40 text-blue-400" : "bg-red-50 text-red-600"}`}>
                    #{user.suid}
                </span>
            ),
        },
        {
            header: "Joining Date",
            className: "text-center",
            accessor: (user: PendingUser) => (
                <span className={theme ? "text-gray-300" : "text-neutral-700"}>
                    {user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : "-"}
                </span>
            ),
        },
        {
            header: "Actions",
            className: "text-center",
            accessor: (user: PendingUser) => (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => handleApprove(user.suid)}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 active:scale-95 rounded-md transition-all shadow-sm"
                    >
                        Approve
                    </button>
                    <button
                        onClick={() => handleDeny(user.suid)}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 active:scale-95 rounded-md transition-all shadow-sm"
                    >
                        Deny
                    </button>
                </div>
            )
        }
    ];

    const getSearchInputConfig = () => {
        switch (filterType) {
            case "suid": return { type: "number", placeholder: "Enter SUID number..." };
            case "role": return { type: "text", placeholder: "Search Role..." };
            case "name": return { type: "text", placeholder: "Search Name..." };
            default: return { type: "text", placeholder: "Search Across All Records..." };
        }
    };

    const inputConfig = getSearchInputConfig();

    const filterOptions = [
        { value: "all", label: "All Records" },
        { value: "name", label: "Name" },
        { value: "suid", label: "SUID" },
        { value: "role", label: "Role" },
    ];

    const filteredUsers = users.filter((user) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();

        switch (filterType) {
            case "suid": return user.suid.toString().includes(query);
            case "name": return user.name.toLowerCase().includes(query);
            case "role": return (user.role || user.roleCode || "").toLowerCase().includes(query);
            default:
                return (
                    user.name.toLowerCase().includes(query) ||
                    user.suid.toString().includes(query) ||
                    (user.role || user.roleCode || "").toLowerCase().includes(query)
                );
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <span className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 transition-colors ${theme ? "bg-blue-500/10 text-blue-300" : "bg-[#9b001c]/10 text-[#9b001c]"}`}>
                        <AiOutlineFileProtect size={20} />
                    </span>
                    <div>
                        <h2 className={`text-xl font-bold leading-tight ${theme ? "text-blue-200" : "text-[#9b001c]"}`}>
                            Permission Messages
                        </h2>
                        <p className={`text-xs mt-0.5 ${theme ? "text-gray-500" : "text-neutral-400"}`}>
                            {loading ? "Loading..." : `${filteredUsers.length} pending approval${filteredUsers.length === 1 ? "" : "s"}`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-1">
                    <div className="relative group">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center justify-between pl-9 pr-3 py-2.5 w-36 sm:w-40 rounded-xl border text-sm font-medium outline-none transition-all duration-300 ${theme
                                ? "bg-gray-800/60 border-gray-700 text-gray-200 focus:ring-2 focus:ring-blue-500/50 hover:border-gray-600 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.3)]"
                                : "bg-white border-gray-200/80 text-gray-700 focus:ring-2 focus:ring-[#9b001c]/20 hover:border-gray-300 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]"
                                }`}
                        >
                            <div className={`absolute left-3 flex items-center pointer-events-none transition-colors ${theme ? "text-gray-400 group-hover:text-blue-400" : "text-gray-500 group-hover:text-[#9b001c]"}`}>
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
                            <div className={`absolute right-0 z-20 mt-2 w-44 rounded-xl border py-1.5 shadow-xl backdrop-blur-md transform transition-all duration-200 origin-top-right ${theme
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
                                            ? theme ? "bg-blue-500/10 text-blue-400 font-bold" : "bg-[#9b001c]/5 text-[#9b001c] font-bold"
                                            : theme ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                                            }`}
                                    >
                                        {option.label}
                                        {filterType === option.value && (
                                            <span className={`w-1.5 h-1.5 rounded-full ${theme ? "bg-blue-400" : "bg-[#9b001c]"}`}></span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="relative group">
                        <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${theme ? "text-gray-400 group-focus-within:text-blue-400" : "text-gray-400 group-focus-within:text-[#9b001c]"}`}>
                            <HiSearch className="w-4 h-4" />
                        </div>
                        <input
                            type={inputConfig.type}
                            placeholder={inputConfig.placeholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`pl-10 pr-4 py-2.5 w-full sm:w-48 lg:w-64 xl:w-72 rounded-xl border text-sm outline-none transition-all duration-300 ease-in-out focus:w-full sm:focus:w-56 lg:focus:w-72 xl:focus:w-80 ${theme
                                ? "bg-gray-800/60 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 hover:border-gray-600 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.3)]"
                                : "bg-white border-gray-200/80 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#9b001c]/20 focus:border-[#9b001c] hover:border-gray-300 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]"
                                } [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className={`w-10 h-10 rounded-full border-4 border-t-transparent animate-spin ${theme ? "border-blue-500" : "border-[#9b001c]"}`} />
                    <p className={`text-sm ${theme ? "text-gray-400" : "text-neutral-500"}`}>Loading user data pool...</p>
                </div>
            ) : error ? (
                <div className={`p-4 rounded-xl border text-center text-sm font-medium ${theme ? "bg-red-500/10 border-red-500/20 text-red-300" : "bg-red-50 border-red-100 text-red-700"}`}>
                    ⚠ {error}
                </div>
            ) : (
                <Table
                    columns={columns}
                    data={filteredUsers}
                    keyExtractor={(user: PendingUser) => user.suid.toString()}
                    emptyMessage={
                        searchQuery
                            ? `No users found matching "${searchQuery}"`
                            : "No pending approval requests right now."
                    }
                />
            )}
        </div>
    );
}
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import Table from "../../../components/common/Table";
import { useTheme } from "../../../components/theme/ThemeContext";
import { HiOutlineUsers, HiSearch, HiFilter, HiChevronDown } from "react-icons/hi";
import userDelete from "../../../action/User/Delete";
import UserDetailsModal from "./core/UserDetailsModal";
import EditUserModal from "./core/EditUserModal";
import { toast } from "sonner";
import DataCruding from "../../../components/common/DataCruding";

// 🟢 ૧. બેકએન્ડ સ્ટ્રક્ચર મુજબ પરમિશન ઇન્ટરફેસ
interface PermissionActions {
    create: boolean;
    edit: boolean;
    view: boolean;
    delete: boolean;
}

interface ModulePermissions {
    [moduleName: string]: PermissionActions;
}

interface UserData {
    suid: number;
    avatar: string;
    name: string;
    performance: string;
    requestDate?: string;
    joiningDate?: string;
    status: "APPROVED" | "PENDING" | "REJECTED";
    role: string;
    permissions: ModulePermissions;
}

const filterOptions = [
    { value: "all", label: "All Records" },
    { value: "name", label: "Name" },
    { value: "suid", label: "SUID" },
    { value: "role", label: "Role" },
    { value: "status", label: "Status" },
    { value: "performance", label: "Performance" }
];

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

export default function UserList() {
    const { theme } = useTheme();

    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");

    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [activeModal, setActiveModal] = useState<"view" | "edit" | null>(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("token");
            const response = await fetch(`${API_URL}/users`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,   // 👈 aa header missing hoi shake
                },
            });

            if (!response.ok) {
                throw new Error(`સર્વર રિસ્પોન્સ એરર: ${response.status}`);
            }

            const result = await response.json();
            console.log(result);
            

            if (result.success) {
                setUsers(result.data);
            } else {
                setError(result.message || "ડેટા લાવવામાં કંઈક ભૂલ થઈ!");
            }

        } catch (err: any) {
            console.error("Fetch Error:", err);
            setError(err.message || "સર્વર કનેક્શન ફેલ થયું!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchUsers();
    }, []);

    const handleViewUser = (user: UserData) => {
        setSelectedUser(user);
        setActiveModal("view");
    };

    const handleEditUser = (user: UserData) => {
        setSelectedUser(user);
        setActiveModal("edit");
    };

    const handleDeleteUser = async (user: UserData) => {
        try {
            const deleted = await userDelete(user.suid);
            if (!deleted) return;
            setUsers((prevUsers) => prevUsers.filter((item) => item.suid !== user.suid));
            setSelectedUser(null);
            setActiveModal(null);
        } catch (err) {
            toast.error("Delete Error:" + (err instanceof Error ? err.message : "Unknown error"));
        }
    };

    const handleSaveUser = async (updatedUser: UserData) => {
        setUsers((prevUsers) =>
            prevUsers.map((user) => (user.suid === updatedUser.suid ? { ...user, ...updatedUser } : user))
        );
        setActiveModal(null);
        setSelectedUser(null);
    };

    const getSearchInputConfig = () => {
        switch (filterType) {
            case "suid":
                return { type: "number", placeholder: "Enter SUID number..." };
            case "role":
                return { type: "text", placeholder: "Search Role (ADMIN/MANAGER)..." };
            case "status":
                return { type: "text", placeholder: "Search Status (APPROVED/PENDING)..." };
            case "performance":
                return { type: "text", placeholder: "Search Performance..." };
            case "name":
                return { type: "text", placeholder: "Search Name..." };
            default:
                return { type: "text", placeholder: "Search Across All Records..." };
        }
    };

    const inputConfig = getSearchInputConfig();

    const filteredUsers = users.filter((user) => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;

        const userDate = (user.requestDate || user.joiningDate || "").toLowerCase();
        const userPerf = (user.performance || "AVERAGE").toLowerCase();
        const userRole = (user.role || "").toLowerCase();

        switch (filterType) {
            case "name":
                return user.name.toLowerCase().includes(query);
            case "suid":
                return user.suid.toString().includes(query);
            case "role":
                return userRole.includes(query);
            case "status":
                return user.status.toLowerCase().startsWith(query);
            case "performance":
                return userPerf.startsWith(query);
            default:
                return (
                    user.name.toLowerCase().includes(query) ||
                    user.suid.toString().includes(query) ||
                    userRole.includes(query) ||
                    user.status.toLowerCase().startsWith(query) ||
                    userPerf.startsWith(query) ||
                    userDate.includes(query)
                );
        }
    });

    const getPerformanceStyle = (performance: string) => {
        if (performance === "HIGH PERF.") {
            return theme
                ? "bg-emerald-950/30 border-emerald-900/50 text-emerald-400"
                : "bg-emerald-50 border-emerald-200 text-emerald-600";
        }
        return theme
            ? "bg-gray-700 border-gray-600 text-gray-300"
            : "bg-neutral-50 border-neutral-200 text-neutral-600";
    };

    const getRoleStyle = (role: string) => {
        const cleanRole = role.toUpperCase();
        if (cleanRole.includes("ADMIN")) {
            return theme ? "bg-red-950/40 border-red-900/50 text-red-400" : "bg-red-50 border-red-200 text-red-700";
        } else if (cleanRole.includes("MANAGER")) {
            return theme ? "bg-amber-950/40 border-amber-900/50 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-700";
        }
        return theme ? "bg-blue-950/40 border-blue-900/50 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-700";
    };

    const columns = [
        {
            header: "Profile",
            className: "w-16 text-center",
            accessor: (user: UserData) => (
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
            accessor: (user: UserData) => (
                <span className={theme ? "text-white" : "text-neutral-900"}>{user.name}</span>
            ),
        },
        {
            header: "Role",
            className: "text-center",
            accessor: (user: UserData) => (
                <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-md border tracking-wide uppercase ${getRoleStyle(user.role || "SEVAK")}`}>
                    {user.role || "SEVAK"}
                </span>
            ),
        },
        {
            header: "Performance",
            accessor: (user: UserData) => (
                <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full border tracking-wide ${getPerformanceStyle(user.performance || "AVERAGE")}`}>
                    {user.performance || "AVERAGE"}
                </span>
            ),
        },
        {
            header: "SUID / Code",
            className: "text-center",
            accessor: (user: UserData) => (
                <span className={`inline-block px-2.5 py-1 rounded-full font-bold text-xs tabular-nums ${theme ? "bg-blue-950/40 text-blue-400" : "bg-red-50 text-red-600"}`}>
                    #{user.suid}
                </span>
            ),
        },
        {
            header: "Status",
            accessor: (user: UserData) => (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${user.status === "APPROVED"
                    ? theme ? "bg-emerald-950/30 border-emerald-900/50 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"
                    : theme ? "bg-amber-950/30 border-amber-900/50 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-600"
                    }`}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${user.status === "APPROVED" ? "bg-emerald-500" : "bg-amber-500"}`} />
                    {user.status}
                </span>
            ),
        },
        {
            header: "Actions",
            className: "w-16 text-center",
            accessor: (user: UserData) => (
                <DataCruding
                    onView={() => handleViewUser(user)}
                    onEdit={() => handleEditUser(user)}
                    onDelete={() => void handleDeleteUser(user)}
                    viewLabel="View"
                    editLabel="Edit"
                    deleteLabel="Delete"
                />
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <span className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 transition-colors ${theme ? "bg-blue-500/10 text-blue-300" : "bg-[#9b001c]/10 text-[#9b001c]"}`}>
                        <HiOutlineUsers size={20} />
                    </span>
                    <div>
                        <h2 className={`text-xl font-bold leading-tight ${theme ? "text-blue-200" : "text-[#9b001c]"}`}>
                            User List
                        </h2>
                        <p className={`text-xs mt-0.5 ${theme ? "text-gray-500" : "text-neutral-400"}`}>
                            Showing {filteredUsers.length} of {users.length} users
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
                    keyExtractor={(user, index) => user.suid ?? `user-${index}`}
                    emptyMessage={
                        searchQuery
                            ? `No users found matching "${searchQuery}"`
                            : "No users found in the system!"
                    }
                />
            )}

            {activeModal === "view" && (
                <UserDetailsModal
                    user={selectedUser}
                    onClose={() => {
                        setActiveModal(null);
                        setSelectedUser(null);
                    }}
                />
            )}

            {activeModal === "edit" && (
                <EditUserModal
                    user={selectedUser}
                    onClose={() => {
                        setActiveModal(null);
                        setSelectedUser(null);
                    }}
                    onSave={handleSaveUser}
                />
            )}
        </div>
    );
}
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTheme } from "../../../components/theme/ThemeContext";
import { groupService, type GroupData } from "../../../services/groupService";
import { IoCreateOutline } from "react-icons/io5";
import DataCruding from "../../../components/common/DataCruding";
import { useConfirm } from "../../../components/overlay/useConfirm";

export default function GroupList() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const confirm = useConfirm();

    const [groups, setGroups] = useState<GroupData[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // ➜ Real API thi groups fetch karo
    const fetchGroups = async () => {
        setLoading(true);
        try {
            const result = await groupService.getAllGroups();
            if (result.success && Array.isArray(result.data)) {
                const sortedGroups = [...result.data].sort((a, b) => a.group_id - b.group_id);
                setGroups(sortedGroups);
            } else {
                toast.error(result.message || "Error occurred while fetching groups");
            }
        } catch (error: any) {
            toast.error(error.message || "Error occurred while fetching groups");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleEdit = (groupId: number) => {
        navigate(`/dashboard/groups/edit/${groupId}`);
    };

    const handleDelete = async (groupId: number) => {
        if (!(await confirm({
            title: "Delete group?",
            message: "Are you sure you want to delete this group?",
            destructive: true,
        }))) return;
        setDeletingId(groupId);
        try {
            const result = await groupService.deleteGroup(groupId);
            if (result.success) {
                toast.success("Group deleted successfully");
                setGroups((prev) => prev.filter((g) => g.group_id !== groupId));
            } else {
                toast.error(result.message || "Error occurred while deleting group");
            }
        } catch (error: any) {
            toast.error(error.message || "Error occurred while deleting group");
        } finally {
            setDeletingId(null);
        }
    };

    // Avatar mate name na pahela 1-2 letters
    const getInitials = (name: string) => {
        if (!name) return "?";
        const parts = name.trim().split(" ");
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
    };

    return (
        <div className={`w-full min-h-[calc(100vh-5rem)] p-6 md:p-8 rounded-4xl transition-colors duration-500 ${theme
                ? "bg-[#0B1120] text-slate-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                : "bg-[#F8FAFC] text-slate-900 shadow-sm"
            }`}>

            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-10">
                <div className="space-y-1.5">
                    <h1 className={`text-2xl md:text-3xl font-bold tracking-tight ${theme ? "text-white" : "text-slate-900"}`}>
                        Groups
                    </h1>
                    <p className={`text-sm font-medium ${theme ? "text-slate-400" : "text-slate-500"}`}>
                        Manage and organize your community groups
                    </p>
                </div>
                <button
                    onClick={() => navigate("/dashboard/groups/create")}
                    className={`group flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 active:scale-95 shadow-lg ${theme
                            ? "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/40"
                            : "bg-red-600 text-white hover:bg-red-700 shadow-red-600/25"
                        }`}
                >
                    <IoCreateOutline className="text-xl transition-transform duration-300 group-hover:-translate-y-0.5" />
                    New Group
                </button>
            </div>

            {/* Content Area */}
            {loading ? (
                // Skeleton Loader
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className={`p-6 rounded-2xl border animate-pulse ${theme ? "border-slate-800/80 bg-slate-800/30" : "border-slate-200 bg-white"
                            }`}>
                            <div className={`h-6 w-1/4 rounded-md mb-3 ${theme ? "bg-slate-700/50" : "bg-slate-200"}`}></div>
                            <div className={`h-4 w-2/4 rounded-md mb-6 ${theme ? "bg-slate-700/50" : "bg-slate-200"}`}></div>
                            <div className="flex gap-3">
                                <div className={`h-8 w-24 rounded-full ${theme ? "bg-slate-700/50" : "bg-slate-200"}`}></div>
                                <div className={`h-8 w-24 rounded-full ${theme ? "bg-slate-700/50" : "bg-slate-200"}`}></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : groups.length === 0 ? (
                // Empty State
                <div className={`flex flex-col items-center justify-center py-20 px-6 text-center rounded-3xl border border-dashed transition-colors duration-300 ${theme ? "border-slate-700/60 bg-slate-800/20" : "border-slate-300 bg-white"
                    }`}>
                    <div className={`w-16 h-16 flex items-center justify-center rounded-full mb-5 shadow-inner ${theme ? "bg-slate-800/80 text-blue-400" : "bg-red-50 text-red-600"
                        }`}>
                        <IoCreateOutline className="text-3xl opacity-90" />
                    </div>
                    <h3 className={`text-xl font-semibold mb-2 tracking-tight ${theme ? "text-slate-200" : "text-slate-900"}`}>
                        No Groups Yet
                    </h3>
                    <p className={`text-sm max-w-sm mb-6 ${theme ? "text-slate-400" : "text-slate-500"}`}>
                        It looks like you haven't created any groups. Start by creating a new group to easily organize your members.
                    </p>
                    <button
                        onClick={() => navigate("/dashboard/groups/create")}
                        className={`font-semibold text-sm px-6 py-2.5 rounded-full transition-all duration-300 border ${theme
                                ? "border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                                : "border-red-500 text-red-600 hover:bg-red-100 hover:text-red-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                            }`}
                    >
                        Create Your First Group
                    </button>
                </div>
            ) : (
                // Group List
                <div className="grid grid-cols-1 gap-2.5"> {/* ગેપ gap-4 માંથી gap-2.5 કર્યો */}
                    {groups.map((g) => (
                        <div
                            key={g.group_id}
                            className={`group relative p-4 rounded-xl border transition-all duration-300 ease-out flex flex-col gap-3
                            ${deletingId === g.group_id ? "opacity-50 scale-[0.98] pointer-events-none" : "hover:-translate-y-0.5"}
                            ${theme
                                    ? "bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70 hover:shadow-xl hover:shadow-black/30 hover:border-slate-600/60"
                                    : "bg-white border-slate-200/80 hover:border-red-200 hover:shadow-xl hover:shadow-red-500/5"
                                }`}
                        >
                            {/* Top row: Info & Actions */}
                            <div className="flex justify-between items-start gap-3">
                                <div className="flex-1 min-w-0">
                                    <h2 className={`text-base md:text-lg font-bold tracking-wide truncate ${theme ? "text-slate-100" : "text-slate-900"}`}>
                                        {g.group_name}
                                    </h2>
                                    {g.description && (
                                        <p className={`text-xs md:text-sm mt-1 leading-relaxed line-clamp-2 ${theme ? "text-slate-400" : "text-slate-600"}`}>
                                            {g.description}
                                        </p>
                                    )}
                                </div>
                                <div className="shrink-0 transition-opacity md:opacity-80 md:group-hover:opacity-100 scale-95">
                                    <DataCruding
                                        onEdit={() => handleEdit(g.group_id)}
                                        onDelete={() => handleDelete(g.group_id)}
                                    />
                                </div>
                            </div>

                            {/* Show the complete member roster with avatars. */}
                            <div className="flex flex-wrap gap-2 mt-0.5">
                                {(g.members || []).map((m) => (
                                    <span
                                        key={m.suid}
                                        title={m.role_code ? `${m.name} (${m.role_code})` : m.name}
                                        className={`flex items-center gap-2 text-[10px] md:text-[11px] pl-1 pr-3 py-1 rounded-full font-medium transition-colors border
                                            ${theme
                                                ? "bg-slate-900/50 border-slate-700/60 text-slate-300 hover:border-slate-600"
                                                : "bg-slate-50 border-slate-200 text-slate-700 shadow-sm hover:border-red-200 hover:bg-red-50/30"
                                            }
                                        `}
                                    >
                                        <span
                                            className={`w-7 h-7 rounded-full flex items-center justify-center overflow-hidden text-[9px] font-bold tracking-wider shrink-0 shadow-inner
                                            ${theme
                                                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                                    : "bg-red-50 text-red-600 border border-red-100"
                                                }`}
                                        >
                                            {m.avatar ? (
                                                <img src={m.avatar} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                getInitials(m.name)
                                            )}
                                        </span>
                                        <span className="whitespace-normal">{m.name}</span>
                                    </span>
                                ))}
                            </div>

                            {/* Footer Line - */}
                            <div className={`mt-2 pt-2.5 border-t flex items-center justify-between text-[11px] font-semibold tracking-wider uppercase
                                ${theme ? "border-slate-700/50 text-slate-500" : "border-slate-100 text-slate-400"}
                            `}>
                                <span className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${theme ? "bg-blue-400" : "bg-red-600"}`}></span>
                                    {g.members?.length || 0} Members
                                </span>
                                {g.created_by_name && (
                                    <span className="flex items-center gap-1.5">
                                        Created By <span className={`${theme ? "text-slate-300" : "text-slate-700"}`}>{g.created_by_name}</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
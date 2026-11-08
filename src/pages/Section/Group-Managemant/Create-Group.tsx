/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useTheme } from "../../../components/theme/ThemeContext";
import SearchableDropdown from "../../../components/common/SearchableDropdown";
import { groupService } from "../../../services/groupService";
import { IoClose } from "react-icons/io5";

//  users table nu actual primary key "suid" chhe — "user_id" nathi
interface UserOption {
    suid: number;
    name: string;
    role_code?: string;
}

interface DropdownOption {
    value: string | number;
    label: string;
}

export default function CreateGroup() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { groupId } = useParams<{ groupId: string }>();
    const isEditMode = !!groupId;

    const [groupName, setGroupName] = useState("");
    const [description, setDescription] = useState("");

    const [allUsers, setAllUsers] = useState<UserOption[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingGroup, setLoadingGroup] = useState(isEditMode);
    const [submitting, setSubmitting] = useState(false);

    const [currentSelect, setCurrentSelect] = useState<string | number>("");
    const [selectedMembers, setSelectedMembers] = useState<UserOption[]>([]);

    // ➜ Users fetch (real API)
    useEffect(() => {
        const fetchUsers = async () => {
            setLoadingUsers(true);
            try {
                const result = await groupService.getAvailableMembers();
                if (result.success && Array.isArray(result.data)) {
                    const mapped: UserOption[] = result.data.map((u: any) => ({
                        suid: u.suid,
                        name: u.name,
                        role_code: u.role_code ?? u.roleCode,
                    }));
                    setAllUsers(mapped);
                } else {
                    toast.error(result.success ? "Error fetching users" : result.message);
                }
            } catch (error: any) {
                toast.error(error.message || "Error fetching users");
            } finally {
                setLoadingUsers(false);
            }
        };
        fetchUsers();
    }, []);

    //  Edit mode — existing group data fetch karine form prefill karo
    useEffect(() => {
        if (!isEditMode) return;

        const fetchGroup = async () => {
            setLoadingGroup(true);
            try {
                const result = await groupService.getGroupById(Number(groupId));
                if (result.success && result.data) {
                    const g = result.data;
                    setGroupName(g.group_name || "");
                    setDescription(g.description || "");
                    const members: UserOption[] = (g.members || []).map((m: any) => ({
                        suid: m.suid,
                        name: m.name,
                        role_code: m.role_code,
                    }));
                    setSelectedMembers(members);
                } else {
                    toast.error(result.message || "Error fetching group data");
                    navigate("/dashboard/groups/list");
                }
            } catch (error: any) {
                toast.error(error.message || "Error fetching group data");
            } finally {
                setLoadingGroup(false);
            }
        };
        fetchGroup();
    }, [isEditMode, groupId, navigate]);

    //  Dropdown na options — je users already select thai gaya chhe tene list ma thi hide karo
    const dropdownOptions: DropdownOption[] = useMemo(() => {
        const selectedIds = new Set(selectedMembers.map((m) => m.suid));
        return allUsers
            .filter((u) => !selectedIds.has(u.suid))
            .map((u) => ({
                value: u.suid,
                label: u.role_code ? `${u.name} (${u.role_code})` : u.name,
            }));
    }, [allUsers, selectedMembers]);

    //  Dropdown ma user select karta j direct add thai jay chhe
    const handleSelectUser = (val: string | number) => {
        const user = allUsers.find((u) => String(u.suid) === String(val));
        if (!user) return;

        setSelectedMembers((prev) => [...prev, user]);
        setCurrentSelect("");
    };

    const handleRemoveMember = (suid: number) => {
        setSelectedMembers((prev) => prev.filter((m) => m.suid !== suid));
    };

    //  Cancel function 
    const handleCancel = () => {
        setGroupName("");
        setDescription("");
        setSelectedMembers([]);
        setCurrentSelect("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!groupName.trim()) {
            toast.error("Group name Required");
            return;
        }
        if (selectedMembers.length === 0) {
            toast.error("Please select at least one member");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                group_name: groupName.trim(),
                description: description.trim(),
                member_ids: selectedMembers.map((m) => m.suid),
            };

            const result = isEditMode
                ? await groupService.updateGroup(Number(groupId), payload)
                : await groupService.createGroup(payload);

            if (result.success) {
                toast.success(isEditMode ? "Group successfully updated!" : "Group successfully created!");
                navigate("/dashboard/groups/list");
            } else {
                toast.error(result.message || (isEditMode ? "Error updating group" : "Error creating group"));
            }
        } catch (error: any) {
            toast.error(error.message || "Error occurred while submitting the form");
        } finally {
            setSubmitting(false);
        }
    };

    //  Avatar mate name na pahela 1-2 letters
    const getInitials = (name: string) => {
        if (!name) return "?";
        const parts = name.trim().split(" ");
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
    };

    if (loadingGroup) {
        return (
            <div className={`w-full max-w-full mx-auto p-8 flex items-center justify-center min-h-[60vh] rounded-4xl transition-colors duration-500 ${theme ? "bg-[#0f172a] text-slate-200" : "bg-white text-slate-800"}`}>
                <div className="flex flex-col items-center gap-4">
                    <div className={`w-12 h-12 border-4 rounded-full animate-spin ${theme ? "border-slate-700 border-t-blue-500" : "border-slate-200 border-t-red-500"}`}></div>
                    <p className="opacity-70 text-sm font-medium tracking-wide">Loading group data...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{`
                @keyframes smoothFadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-up {
                    animation: smoothFadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>

            <div className={`w-full max-w-full mx-auto p-8 md:p-10 rounded-4xl transition-all duration-500 animate-fade-up ${
                theme 
                ? "bg-[#0f172a] text-slate-100 shadow-[0_0_40px_rgba(0,0,0,0.3)] border border-slate-800/60" 
                : "bg-white text-slate-800 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-slate-50"
            }`}>
                
                {/* ---------- PREMIUM HEADER W/ GLOW ---------- */}
                <div className={`mb-10 pb-6 border-b transition-colors duration-500 ${theme ? "border-slate-800/80" : "border-slate-100"}`}>
                    <h1 className={`text-3xl md:text-4xl font-extrabold tracking-tight transition-all duration-300 ${
                        theme 
                        ? "text-transparent bg-clip-text bg-linear-to-r from-blue-300 via-indigo-300 to-purple-300 drop-shadow-[0_0_15px_rgba(99,102,241,0.4)]" 
                        : "text-transparent bg-clip-text bg-linear-to-r from-slate-900 via-red-800 to-red-600 drop-shadow-[0_2px_10px_rgba(220,38,38,0.15)]"
                    }`}>
                        {isEditMode ? "Edit Group" : "Create Group"}
                    </h1>
                    <p className={`mt-3 text-sm font-medium ${theme ? "text-slate-400" : "text-slate-500"}`}>
                        {isEditMode 
                            ? "Update the details and manage members for this group." 
                            : "Set up a new group and assign members seamlessly."}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                    
                    {/* ---------- LEFT PART: FORM ---------- */}
                    <div className="lg:col-span-7 space-y-7">
                        {/* Group Name */}
                        <div className="group">
                            <label className={`block text-sm font-bold mb-2 ml-1 transition-colors ${
                                theme ? "text-slate-300 group-focus-within:text-blue-400" : "text-slate-700 group-focus-within:text-red-600"
                            }`}>
                                Group Name
                            </label>
                            <input
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="e.g. Semester 3 - CS Batch"
                                className={`w-full px-5 py-3.5 rounded-2xl border outline-none transition-all duration-300 focus:ring-4 ${
                                    theme 
                                    ? "bg-[#1e293b]/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20" 
                                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:ring-red-500/20"
                                }`}
                            />
                        </div>

                        {/* Description */}
                        <div className="group">
                            <label className={`block text-sm font-bold mb-2 ml-1 transition-colors ${
                                theme ? "text-slate-300 group-focus-within:text-blue-400" : "text-slate-700 group-focus-within:text-red-600"
                            }`}>
                                Description <span className="opacity-60 font-normal">(optional)</span>
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                placeholder="Add notes, purpose, or details about this group..."
                                className={`w-full px-5 py-3.5 rounded-2xl border outline-none transition-all duration-300 focus:ring-4 resize-none ${
                                    theme 
                                    ? "bg-[#1e293b]/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20" 
                                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:ring-red-500/20"
                                }`}
                            />
                        </div>

                        {/* Add Members */}
                        <div className="group">
                            <label className={`block text-sm font-bold mb-2 ml-1 transition-colors ${
                                theme ? "text-slate-300 group-focus-within:text-blue-400" : "text-slate-700 group-focus-within:text-red-600"
                            }`}>
                                Add Members
                            </label>
                            
                            <div className="relative z-10">
                                <SearchableDropdown
                                    placeholder={loadingUsers ? "Loading users..." : "Search and select a user..."}
                                    searchPlaceholder="Search users..."
                                    options={dropdownOptions}
                                    selectedValue={currentSelect}
                                    onSelect={handleSelectUser}
                                    disabled={loadingUsers}
                                />
                            </div>
                            <p className={`text-xs mt-2 ml-1 transition-colors ${theme ? "text-slate-500" : "text-slate-400"}`}>
                                Selected users will automatically appear in the list on the right.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={submitting}
                                className={`px-8 py-3.5 rounded-2xl font-bold text-white transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 shadow-lg ${
                                    submitting 
                                    ? (theme ? "bg-blue-500 opacity-60 shadow-none cursor-not-allowed" : "bg-red-500 opacity-60 shadow-none cursor-not-allowed")
                                    : (theme 
                                        ? "bg-linear-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 shadow-blue-500/30 hover:shadow-blue-500/40" 
                                        : "bg-linear-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-red-500/30 hover:shadow-red-500/40")
                                }`}
                            >
                                {submitting
                                    ? (isEditMode ? "Updating..." : "Creating...")
                                    : (isEditMode ? "Save Changes" : "Create Group")}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className={`px-8 py-3.5 rounded-2xl font-bold transition-all duration-300 ring-1 ${
                                    theme 
                                    ? "bg-[#1e293b]/50 text-slate-300 hover:bg-slate-800 hover:text-white ring-slate-700/50" 
                                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800 ring-slate-200"
                                }`}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>

                    {/* ---------- RIGHT PART: SELECTED MEMBERS LIST ---------- */}
                    <div className="lg:col-span-5 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <label className={`text-sm font-bold ${theme ? "text-slate-300" : "text-slate-700"}`}>
                                Selected Members
                            </label>
                            <div className={`flex items-center justify-center min-w-7 h-7 px-2 rounded-full text-xs font-bold transition-colors shadow-inner ${
                                theme ? "bg-blue-900/40 text-blue-300 border border-blue-700/50" : "bg-red-50 text-red-600 border border-red-100"
                            }`}>
                                {selectedMembers.length}
                            </div>
                        </div>

                        <div className={`flex-1 min-h-100 max-h-125 rounded-3xl border overflow-hidden flex flex-col transition-colors duration-500 ${
                            theme ? "border-slate-800/80 bg-[#0B1120]/50 shadow-inner" : "border-slate-200/60 bg-slate-50/50"
                        }`}>
                            
                            {selectedMembers.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-up">
                                    <div className={`w-16 h-16 mb-4 rounded-full flex items-center justify-center transition-colors ${
                                        theme ? "bg-blue-900/20 text-blue-400/50 border border-blue-800/30" : "bg-red-50 text-red-300 border border-red-100"
                                    }`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                    <p className={`text-sm font-medium ${theme ? "text-slate-400" : "text-slate-500"}`}>
                                        No members selected yet.
                                    </p>
                                    <p className={`text-xs mt-1 max-w-50 mx-auto ${theme ? "text-slate-500" : "text-slate-400"}`}>
                                        Use the dropdown on the left to add members to this group.
                                    </p>
                                </div>
                            ) : (
                                <div className={`flex-1 overflow-y-auto divide-y ${theme ? "divide-slate-800/60" : "divide-slate-200/60"}`}>
                                    {selectedMembers.map((m) => (
                                        <div
                                            key={m.suid}
                                            className={`group/item flex items-center gap-4 px-5 py-4 transition-all duration-300 ${
                                                theme ? "hover:bg-[#1e293b]/70" : "hover:bg-white hover:shadow-sm"
                                            }`}
                                        >
                                            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                                                theme ? "bg-blue-900/40 text-blue-300 border border-blue-800/50" : "bg-red-100 text-red-600 border border-red-200/50"
                                            }`}>
                                                {getInitials(m.name)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-bold truncate ${theme ? "text-slate-200" : "text-slate-800"}`}>
                                                    {m.name}
                                                </p>
                                                {m.role_code && (
                                                    <p className={`text-xs mt-0.5 truncate font-medium ${theme ? "text-slate-500" : "text-slate-400"}`}>
                                                        {m.role_code}
                                                    </p>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleRemoveMember(m.suid)}
                                                title="Remove member"
                                                className={`p-2 rounded-full shrink-0 opacity-0 group-hover/item:opacity-100 transition-all duration-300 transform scale-90 group-hover/item:scale-100 ${
                                                    theme ? "hover:bg-red-500/20 text-slate-500 hover:text-red-400" : "hover:bg-red-50 text-slate-400 hover:text-red-600"
                                                }`}
                                            >
                                                <IoClose className="text-lg" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { HiMinus, HiOutlineUserGroup } from "react-icons/hi";
import { toast } from "sonner";
import { useTheme } from "../../../components/theme/ThemeContext";

// 🎯 FIX: Backend returns these fields (camelCase)
export interface StudentData {
    suid: number;
    name: string;
    username: string;
    avatar?: string | null;
    departmentId: number;
    sectionId: number | null;
    joiningDate?: string;
    status?: string;
    roleCode?: string; // 🎯 NEW: Backend now returns this
}

interface StudentListProps {
    students?: StudentData[];
    theme?: boolean;
    onStudentRemoved?: (suid: number) => void;
    sectionId?: number; // 🎯 Optional: auto-load if passed
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

export default function StudentList({ 
    students: initialStudents = [],
    theme: propTheme,
    onStudentRemoved,
    sectionId: propSectionId 
}: StudentListProps) {
    const { theme: contextTheme } = useTheme();
    const { sectionId: paramSectionId } = useParams<{ sectionId: string }>();
    
    // 🎯 Priority: param > prop > null
    const finalSectionId = paramSectionId ? Number(paramSectionId) : propSectionId;
    const theme = propTheme ?? contextTheme;

    const [students, setStudents] = useState<StudentData[]>(initialStudents);
    const [loading, setLoading] = useState(!initialStudents.length && !!finalSectionId);

    // 🎯 FIX: Fetch data if sectionId is provided and no initial students passed
    useEffect(() => {
        if (!finalSectionId || initialStudents.length > 0) return;

        const fetchStudents = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${API_URL}/users/section/${finalSectionId}`);
                const json = await res.json();

                if (json.success && Array.isArray(json.data)) {
                    setStudents(json.data);
                } else {
                    setStudents([]);
                }
            } catch (error) {
                console.error("❌ Failed to load students:", error);
                toast.error("Failed to load students");
                setStudents([]);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [finalSectionId, initialStudents.length]);

    const removeStudentFromSection = async (student: StudentData) => {
        try {
            const response = await fetch(`${API_URL}/users/${student.suid}/section`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sectionId: null }),
            });
            const result = await response.json();

            if (result.success) {
                toast.success(`${student.name} removed from section`);
                const updated = students.filter(s => s.suid !== student.suid);
                setStudents(updated);
                onStudentRemoved?.(student.suid);
            } else {
                toast.error(result.message || "Could not remove student");
            }
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
        }
    };

    const handleRemoveClick = (student: StudentData) => {
        toast(`Remove ${student.name} from this section?`, {
            description: "The student will be unassigned from this section.",
            action: {
                label: "Confirm",
                onClick: () => removeStudentFromSection(student),
            },
            cancel: {
                label: "Cancel",
                onClick: () => {},
            },
        });
    };

    // 🎯 If used as standalone page, show header
    const isStandalone = !!paramSectionId;

    return (
        <div className={isStandalone ? "p-6 space-y-4 max-w-full mx-auto" : "flex flex-col gap-2"}>
            {/* 🎯 Header only shown in standalone mode */}
            {isStandalone && (
                <div className="flex items-center gap-3 mb-4">
                    <span
                        className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 transition-colors ${
                            theme ? "bg-blue-500/10 text-blue-300" : "bg-[#9b001c]/10 text-[#9b001c]"
                        }`}
                    >
                        <HiOutlineUserGroup size={20} />
                    </span>
                    <div>
                        <h2 className={`text-xl font-bold leading-tight ${theme ? "text-blue-100" : "text-[#9b001c]"}`}>
                            Section Students
                        </h2>
                        <p className={`text-xs mt-0.5 ${theme ? "text-gray-500" : "text-neutral-400"}`}>
                            {loading
                                ? "Loading students..."
                                : `${students.length} student${students.length !== 1 ? 's' : ''} assigned`}
                        </p>
                    </div>
                </div>
            )}

            {/* 🎯 Loading state */}
            {loading && (
                <div className={`flex items-center justify-center py-8 rounded-xl border ${theme ? "border-gray-700 bg-gray-800/30" : "border-gray-200 bg-gray-50"}`}>
                    <span className={`text-sm ${theme ? "text-gray-400" : "text-gray-500"}`}>Loading students...</span>
                </div>
            )}

            {/* 🎯 Empty state */}
            {!loading && students.length === 0 && (
                <div className={`flex items-center justify-center py-8 rounded-xl border ${theme ? "border-gray-700 bg-gray-800/30" : "border-gray-200 bg-gray-50"}`}>
                    <span className={`text-sm ${theme ? "text-gray-400" : "text-gray-500"}`}>
                        No students assigned to this section yet.
                    </span>
                </div>
            )}

            {/* 🎯 Students list */}
            {!loading && students.length > 0 && (
                <div className={isStandalone ? "rounded-2xl border shadow-sm overflow-hidden p-2" : ""} 
                     style={isStandalone ? { borderColor: theme ? "#1f2937" : "#e5e7eb", backgroundColor: theme ? "#111827" : "#ffffff" } : {}}>
                    <div className="flex flex-col gap-2">
                        {students.map((student, index) => (
                            <div
                                key={student.suid}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                                    theme
                                        ? "bg-gray-800/60 border-gray-700 hover:border-gray-600"
                                        : "bg-white border-neutral-200 hover:border-neutral-300"
                                }`}
                            >
                                <span
                                    className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 text-xs font-bold font-mono ${
                                        theme ? "bg-blue-500/10 text-blue-300" : "bg-red-500/10 text-red-600"
                                    }`}
                                >
                                    {index + 1}
                                </span>

                                <div className="flex-1 min-w-0">
                                    <span className={`text-sm font-semibold truncate block ${theme ? "text-white" : "text-gray-900"}`}>
                                        {student.name}
                                    </span>
                                    <span className={`text-xs font-mono truncate block ${theme ? "text-gray-400" : "text-gray-500"}`}>
                                        SUID: {student.suid} {student.status ? `· ${student.status}` : ""}
                                    </span>
                                </div>

                                <button
                                    onClick={() => handleRemoveClick(student)}
                                    title="Remove from section"
                                    className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-colors ${
                                        theme
                                            ? "text-red-400 hover:bg-red-500/10"
                                            : "text-red-500 hover:bg-red-50"
                                    }`}
                                >
                                    <HiMinus size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
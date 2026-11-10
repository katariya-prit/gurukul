import { useState, useEffect } from "react";
import { useTheme } from "../../components/theme/ThemeContext";
import { HiOutlineChartBar } from "react-icons/hi";
import { toast } from "sonner";
import {
    progressService,
    type DepartmentProgress,
    type SectionProgress,
    type UserProgress,
    type DepartmentSummary,
} from "../../services/progressService";
import DepartmentProgressView from "../../components/Prograce-Cards/Departmentprogressview";
import SectionProgressCard from "../../components/Prograce-Cards/SectionProgressCard";
import UserProgressCard from "../../components/Prograce-Cards/Userprogresscard";
import SearchableDropdown from "../../components/common/SearchableDropdown";
import type { AuthUser } from "../../Types/Role-create";

const SUPER_ADMIN = "SUPER_ADMIN";
const DEPARTMENT_HEAD = "HEAD100";
const SECTION_HEAD = "SECHEAD101";

type AuthUserWithSection = AuthUser & { sectionId?: number };

// Helper functions: Section and Department percentages are the true average across students
const normalizeUser = (u: UserProgress): UserProgress => ({
    ...u,
    percentage: u.overallPercentage ?? u.lessonCompletionPercent ?? u.percentage ?? 0,
    completedTasks: (u.completedTasks || 0) + (u.submittedLessons || 0),
    totalTasks: (u.totalTasks || 0) + (u.totalLessons || 0),
});

const normalizeSection = (s: SectionProgress): SectionProgress => {
    const users = (s.users || []).map(normalizeUser);
    const studentCount = users.length;
    const computedAverage =
        studentCount > 0
            ? Math.round(users.reduce((acc, u) => acc + (u.overallPercentage ?? u.percentage ?? 0), 0) / studentCount)
            : (s.overallPercentage ?? s.percentage ?? 0);

    return {
        ...s,
        percentage: computedAverage,
        overallPercentage: computedAverage,
        completedTasks: (s.completedTasks || 0) + (s.submittedLessons || 0),
        totalTasks: (s.totalTasks || 0) + (s.totalLessons || 0),
        users,
    };
};

const normalizeDepartment = (d: DepartmentProgress): DepartmentProgress => {
    const sections = (d.sections || []).map(normalizeSection);
    const totalStudents = sections.reduce((acc, s) => acc + (s.users?.length || s.studentCount || 0), 0);
    const computedAverage =
        totalStudents > 0
            ? Math.round(
                  sections.reduce(
                      (acc, s) => acc + s.percentage * (s.users?.length || s.studentCount || 1),
                      0
                  ) / totalStudents
              )
            : sections.length > 0
            ? Math.round(sections.reduce((acc, s) => acc + s.percentage, 0) / sections.length)
            : (d.overallPercentage ?? d.percentage ?? 0);

    return {
        ...d,
        percentage: computedAverage,
        overallPercentage: computedAverage,
        completedTasks: (d.completedTasks || 0) + (d.submittedLessons || 0),
        totalTasks: (d.totalTasks || 0) + (d.totalLessons || 0),
        sections,
    };
};

export default function ProgressDashboard() {
    const { theme } = useTheme();
    const [user, setUser] = useState<AuthUserWithSection | null>(null);
    const [loading, setLoading] = useState(true);

    const [deptSummaries, setDeptSummaries] = useState<DepartmentSummary[]>([]);
    const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);

    const [departmentData, setDepartmentData] = useState<DepartmentProgress | null>(null);
    const [sectionData, setSectionData] = useState<SectionProgress | null>(null);
    const [userData, setUserData] = useState<UserProgress | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch (e) {
                console.error(e);
            }
        } else {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!user) return;

        const load = async () => {
            setLoading(true);
            try {
                if (user.roleCode === SUPER_ADMIN) {
                    const result = await progressService.getAllDepartmentsProgress();
                    if (result.success) {
                        const normalizedSummaries = result.data.map((d) => ({
                            ...d,
                            percentage: d.overallPercentage ?? d.lessonCompletionPercent ?? d.percentage ?? 0,
                        }));
                        setDeptSummaries(normalizedSummaries);
                        if (normalizedSummaries.length > 0) {
                            setSelectedDeptId(normalizedSummaries[0].department_id);
                        }
                    }
                } else if (user.roleCode === DEPARTMENT_HEAD) {
                    if (user.departmentId) {
                        const result = await progressService.getDepartmentProgress(user.departmentId);
                        if (result.success) setDepartmentData(normalizeDepartment(result.data));
                    }
                } else if (user.roleCode === SECTION_HEAD) {
                    if (user.sectionId) {
                        const result = await progressService.getSectionProgress(user.sectionId);
                        if (result.success) setSectionData(normalizeSection(result.data));
                    }
                } else {
                    const result = await progressService.getUserProgress(user.suid);
                    if (result.success) setUserData(normalizeUser(result.data));
                }
            } catch (error: any) {
                toast.error(error.message || "Failed to load progress data");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [user]);

    useEffect(() => {
        if (user?.roleCode !== SUPER_ADMIN || !selectedDeptId) return;

        const fetchDept = async () => {
            try {
                setLoading(true);
                const result = await progressService.getDepartmentProgress(selectedDeptId);
                if (result.success) {
                    setDepartmentData(normalizeDepartment(result.data));
                }
            } catch (error: any) {
                toast.error(error.message || "Failed to load department progress");
            } finally {
                setLoading(false);
            }
        };
        fetchDept();
    }, [selectedDeptId, user]);

    if (!user) return null;

    return (
        <div
            className={`min-h-screen transition-colors duration-300 ${theme
                    ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800"
                    : "bg-gradient-to-br from-gray-50 via-white to-gray-100"
                }`}
        >
            <div className="max-w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
                {/* Premium Header */}
                <div
                    className={`rounded-3xl border backdrop-blur-xl transition-all duration-300 ${theme
                            ? "bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 shadow-2xl shadow-blue-900/20"
                            : "bg-gradient-to-br from-white/80 to-gray-50/80 border-gray-200/60 shadow-xl shadow-gray-200/40"
                        }`}
                >
                    <div className="px-6 sm:px-8 py-6 sm:py-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        {/* Title Section */}
                        <div className="flex items-center gap-4">
                            <div
                                className={`flex items-center justify-center w-14 h-14 rounded-2xl shrink-0 transition-all duration-300 ${theme
                                        ? "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-blue-300 shadow-lg shadow-blue-500/20"
                                        : "bg-gradient-to-br from-red-500/10 to-orange-500/10 text-red-600 shadow-lg shadow-red-200/40"
                                    }`}
                            >
                                <HiOutlineChartBar size={24} className="font-bold" />
                            </div>
                            <div className="flex-1">
                                <h1
                                    className={`text-2xl sm:text-3xl font-black tracking-tight ${theme ? "text-white" : "text-gray-900"
                                        }`}
                                >
                                    Progress Overview
                                </h1>
                                <p
                                    className={`text-sm mt-1 font-medium ${theme ? "text-gray-400" : "text-gray-500"
                                        }`}
                                >
                                    Track performance and growth trends
                                </p>
                            </div>
                        </div>

                        {/* Department Selector */}
                        {user.roleCode === SUPER_ADMIN && deptSummaries.length > 0 && (
                            <div className="w-full sm:w-56">
                                <SearchableDropdown
                                    placeholder="Select Department"
                                    searchPlaceholder="Search department..."
                                    options={deptSummaries.map((d) => ({
                                        value: d.department_id,
                                        label: `${d.department_name} (${d.percentage}%)`,
                                    }))}
                                    selectedValue={selectedDeptId ?? ""}
                                    onSelect={(value) => setSelectedDeptId(Number(value))}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div
                            className={`w-10 h-10 rounded-full border-4 border-t-transparent animate-spin ${theme ? "border-blue-500" : "border-red-600"
                                }`}
                        />
                    </div>
                ) : (
                    <>
                        {(user.roleCode === SUPER_ADMIN || user.roleCode === DEPARTMENT_HEAD) &&
                            departmentData && (
                                <DepartmentProgressView department={departmentData} theme={theme} />
                            )}

                        {user.roleCode === SECTION_HEAD && sectionData && (
                            <SectionProgressCard section={sectionData} theme={theme} defaultOpen={true} />
                        )}

                        {user.roleCode !== SUPER_ADMIN &&
                            user.roleCode !== DEPARTMENT_HEAD &&
                            user.roleCode !== SECTION_HEAD &&
                            userData && (
                                <div className="flex justify-center py-10">
                                    <UserProgressCard user={userData} theme={theme} />
                                </div>
                            )}

                        {user.roleCode === DEPARTMENT_HEAD && !departmentData && (
                            <p className={`text-center py-16 ${theme ? "text-gray-500" : "text-neutral-400"}`}>
                                No department assigned to your account.
                            </p>
                        )}  
                        {user.roleCode === SECTION_HEAD && !sectionData && (
                            <p className={`text-center py-16 ${theme ? "text-gray-500" : "text-neutral-400"}`}>
                                No section assigned to your account.
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
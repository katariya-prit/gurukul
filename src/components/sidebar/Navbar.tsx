import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../theme/ThemeContext";
import SidebarDropdown from "./SidebarDropdown";
import {
    HiOutlineHome,
    HiOutlineLibrary,
    HiOutlineShieldCheck,
    HiOutlineAcademicCap,
    HiOutlineOfficeBuilding,
    HiOutlineChartBar,
    HiOutlineBookOpen,
    HiOutlineClipboardCheck,
    HiOutlineUserGroup,
    HiStar,
    HiOutlineArrowLeft
} from "react-icons/hi";
import { FiUsers, FiRefreshCw } from "react-icons/fi";
import { SiNginxproxymanager } from "react-icons/si";
import type { AuthUser } from "../../Types/Role-create";
import { AiOutlineFileProtect } from "react-icons/ai";
import { toast } from "sonner";
import { departmentService } from "../../services/departmentService";
import { sectionService } from "../../services/sectionService";
import { groupService, isGroupLeader, type GroupData } from "../../services/groupService";
import { useSidebarView } from "../../context/SidebarViewContext";
import { createPermissionChecker } from "./core/PermitionValidetor";
import {
    getDepartmentItems,
    getUserItems,
    getWebsiteItems,
    getSectionItems,
    getRoleItems,
    getLessonItems,
    getGroupItems,
    getStudentSectionItems,
} from "./core/Pagedata";

interface NavbarProps {
    setSidebarOpen: (isOpen: boolean) => void;
    isMiniSidebar: boolean;
}

interface DepartmentData {
    departmentId: number;
    departmentName: string;
    departmentHeadId: number | null;
    departmentHeadName: string | null;
    description: string;
}

interface SectionData {
    sectionId: number;
    name: string;
    departmentId: number;
}

export default function Navbar({ setSidebarOpen, isMiniSidebar }: NavbarProps) {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [departments, setDepartment] = useState<DepartmentData[]>([]);
    const [sectionsByDept, setSectionsByDept] = useState<Record<number, SectionData[]>>({});
    const [sectionsLoading, setSectionsLoading] = useState<boolean>(false);

    const [refreshing, setRefreshing] = useState<boolean>(false);
    const { activeDepartmentId, setActiveDepartment } = useSidebarView();

    const [myGroups, setMyGroups] = useState<GroupData[]>([]);
    const [groupsLoading, setGroupsLoading] = useState<boolean>(false);

    const [user, setUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        const data = localStorage.getItem("user");
        if (data) {
            try {
                const parsed: AuthUser = JSON.parse(data);

                if (typeof parsed.permissions === "string") {
                    try {
                        parsed.permissions = JSON.parse(parsed.permissions);
                    } catch {
                        setUser(parsed);
                        return;
                    }
                }

                setUser(parsed);

                if (parsed?.suid) {
                    setGroupsLoading(true);
                    groupService.getGroupsByMember(parsed.suid)
                        .then((res) => {
                            if (res.success && Array.isArray(res.data)) setMyGroups(res.data);
                        })
                        .finally(() => setGroupsLoading(false));
                }
            } catch {
                setUser(null);
            }
        }
    }, []);

    const fetchDepartments = useCallback(async () => {
        try {
            const result = await departmentService.getAllDepartments();
            if (result.success) {
                const mapped = result.data.map((d: DepartmentData) => ({
                    departmentId: d.departmentId,
                    departmentName: d.departmentName,
                    departmentHeadId: d.departmentHeadId,
                    departmentHeadName: d.departmentHeadName,
                    description: d.description,
                }));
                setDepartment(mapped);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error fetching departments");
        }
    }, []);

    useEffect(() => {
        fetchDepartments();
    }, [fetchDepartments]);

    useEffect(() => {
        const fetchAllSections = async () => {
            if (departments.length === 0) return;
            try {
                setSectionsLoading(true);
                const results = await Promise.all(
                    departments.map((dept) => sectionService.getSectionsByDepartment(dept.departmentId))
                );

                const map: Record<number, SectionData[]> = {};
                departments.forEach((dept, idx) => {
                    const res = results[idx];
                    map[dept.departmentId] = res.success && Array.isArray(res.data) ? res.data : [];
                });
                setSectionsByDept(map);
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Error fetching sections");
            } finally {
                setSectionsLoading(false);
            }
        };
        fetchAllSections();
    }, [departments]);

    const handleRefresh = async () => {
        if (refreshing) return;
        setRefreshing(true);
        try {
            await fetchDepartments();
        } finally {
            setRefreshing(false);
        }
    };

    const hasAccess = createPermissionChecker(user);

    const departmentItems = getDepartmentItems(hasAccess);
    const userItems = getUserItems(hasAccess);
    const websiteItems = getWebsiteItems(hasAccess);
    const sectionItems = getSectionItems(hasAccess);
    const roleItems = getRoleItems(hasAccess);
    const lessonItems = getLessonItems(hasAccess);
    const groupItems = getGroupItems(hasAccess);

    const isPermActive = location.pathname === "/dashboard/permissions/messages";
    const isProgressActive = location.pathname === "/dashboard/progress";
    const isMyLessonsActive = location.pathname === "/dashboard/lessons/my-lessons";

    const filteredDepartments = (user?.roleCode === "SUPER_ADMIN"
        ? departments
        : departments.filter((d) => d.departmentId === user?.departmentId)) || [];
    const isSuperAdmin = user?.roleCode === "SUPER_ADMIN";
    const singleDepartment = filteredDepartments.length === 1 ? filteredDepartments[0] : null;

    const isActive = location.pathname === "/dashboard";

    const showDashboardBtn = hasAccess("Dashboard", "view");
    const showPermissionsBtn = hasAccess("Permissions", "view");
    const showProgressBtn = hasAccess("Progress", "view");
    const showMyLessonsBtn = hasAccess("MyLessons", "view");

    if (isSuperAdmin && activeDepartmentId !== null) {
        const activeDept = filteredDepartments.find((dept) => dept.departmentId === activeDepartmentId);
        const activeSections = sectionsByDept[activeDepartmentId] || [];

        return (
            <div className="w-full flex flex-col space-y-1.5">
                <button
                    type="button"
                    onClick={() => setActiveDepartment(null, null)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-semibold text-[15px] transition-all duration-200 group cursor-pointer ${isMiniSidebar ? "justify-center px-2" : ""
                        } ${theme ? "text-white hover:bg-gray-800 hover:text-blue-200" : "text-gray-500 hover:bg-red-50 hover:text-red-600"}`}
                >
                    <span className={`transition-colors ${theme ? "text-gray-300 group-hover:text-blue-200" : "text-gray-400 group-hover:text-red-600"}`}>
                        <HiOutlineArrowLeft className="text-xl" />
                    </span>
                    {!isMiniSidebar && "Back"}
                </button>

                {sectionsLoading && !isMiniSidebar && (
                    <p className={`text-xs px-4 ${theme ? "text-gray-600" : "text-neutral-400"}`}>Loading sections...</p>
                )}

                {!sectionsLoading && !activeDept && !isMiniSidebar && (
                    <div className={`px-4 py-2.5 rounded-xl text-xs italic ${theme ? "text-gray-600 bg-gray-900/50" : "text-neutral-400 bg-neutral-50"}`}>
                        No department selected
                    </div>
                )}

                {!sectionsLoading && activeDept && activeSections.length === 0 && !isMiniSidebar && (
                    <div className={`px-4 py-2.5 rounded-xl text-xs italic ${theme ? "text-gray-600 bg-gray-900/50" : "text-neutral-400 bg-neutral-50"}`}>
                        {`${activeDept.departmentName}: No sections created yet`}
                    </div>
                )}

                {!sectionsLoading && activeDept && activeSections.map((section) => {
                    const studentItems = getStudentSectionItems(hasAccess, activeDept.departmentId, section.sectionId);

                    if (studentItems.length === 0) {
                        return null;
                    }

                    return (
                        <SidebarDropdown
                            key={section.sectionId}
                            title={section.name}
                            icon={<HiOutlineOfficeBuilding className="text-xl" />}
                            items={studentItems}
                            setSidebarOpen={setSidebarOpen}
                            isMiniSidebar={isMiniSidebar}
                        />
                    );
                })}
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col space-y-1.5">

            {showDashboardBtn && (
                <button
                    onClick={() => { navigate("/dashboard"); setSidebarOpen(false); }}
                    title={isMiniSidebar ? "Dashboard" : ""}
                    className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-semibold text-[15px] transition-all duration-200 group cursor-pointer 
                        ${isMiniSidebar ? "justify-center px-2" : ""}
                        ${isActive
                            ? theme ? "text-blue-200 bg-gray-800" : "text-red-600 bg-red-50"
                            : theme ? "text-white bg-gray-900 hover:bg-gray-800 hover:text-blue-200" : "text-gray-500 hover:bg-red-50 hover:text-red-600"
                        }`}
                >
                    <span className={`transition-colors ${isActive ? (theme ? "text-blue-200" : "text-red-600") : (theme ? "text-gray-300 group-hover:text-blue-200" : "text-gray-400 group-hover:text-red-600")}`}>
                        <HiOutlineHome className="text-xl" />
                    </span>
                    {!isMiniSidebar && "Dashboard"}
                </button>
            )}

            {showPermissionsBtn && (
                <button
                    onClick={() => { navigate("/dashboard/permissions/messages"); setSidebarOpen(false); }}
                    title={isMiniSidebar ? "Permissions" : ""}
                    className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-semibold text-[15px] transition-all duration-200 group cursor-pointer 
                        ${isMiniSidebar ? "justify-center px-2" : ""}
                        ${isPermActive
                            ? theme ? "text-blue-200 bg-gray-800" : "text-red-600 bg-red-50"
                            : theme ? "text-white hover:bg-gray-800" : "text-gray-500 hover:bg-red-50"
                        }`}
                >
                    <span className={`transition-colors ${isPermActive ? (theme ? "text-blue-200" : "text-red-600") : (theme ? "text-gray-300 group-hover:text-blue-200" : "text-gray-400 group-hover:text-red-600")}`}>
                        <AiOutlineFileProtect className="text-xl" />
                    </span>
                    {!isMiniSidebar && "Permissions"}
                </button>
            )}

            {showProgressBtn && (
                <button
                    onClick={() => { navigate("/dashboard/progress"); setSidebarOpen(false); }}
                    title={isMiniSidebar ? "Progress" : ""}
                    className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-semibold text-[15px] transition-all duration-200 group cursor-pointer 
                        ${isMiniSidebar ? "justify-center px-2" : ""}
                        ${isProgressActive
                            ? theme ? "text-blue-200 bg-gray-800" : "text-red-600 bg-red-50"
                            : theme ? "text-white hover:bg-gray-800" : "text-gray-500 hover:bg-red-50"
                        }`}
                >
                    <span className={`transition-colors ${isProgressActive ? (theme ? "text-blue-200" : "text-red-600") : (theme ? "text-gray-300 group-hover:text-blue-200" : "text-gray-400 group-hover:text-red-600")}`}>
                        <HiOutlineChartBar className="text-xl" />
                    </span>
                    {!isMiniSidebar && "Progress"}
                </button>
            )}

            {showMyLessonsBtn && (
                <button
                    onClick={() => { navigate("/dashboard/lessons/my-lessons"); setSidebarOpen(false); }}
                    title={isMiniSidebar ? "My Lessons" : ""}
                    className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-semibold text-[15px] transition-all duration-200 group cursor-pointer 
                        ${isMiniSidebar ? "justify-center px-2" : ""}
                        ${isMyLessonsActive
                            ? theme ? "text-blue-200 bg-gray-800" : "text-red-600 bg-red-50"
                            : theme ? "text-white hover:bg-gray-800" : "text-gray-500 hover:bg-red-50"
                        }`}
                >
                    <span className={`transition-colors ${isMyLessonsActive ? (theme ? "text-blue-200" : "text-red-600") : (theme ? "text-gray-300 group-hover:text-blue-200" : "text-gray-400 group-hover:text-red-600")}`}>
                        <HiOutlineClipboardCheck className="text-xl" />
                    </span>
                    {!isMiniSidebar && "My Lessons"}
                </button>
            )}

            {myGroups.length > 0 && (
                <div className="space-y-1">
                    {!isMiniSidebar && (
                        <p className={`text-xs font-bold uppercase tracking-wide px-4 mt-3 mb-1 ${theme ? "text-gray-600" : "text-gray-400"}`}>
                            My Groups
                        </p>
                    )}
                    {myGroups.map((group) => {
                        const isGroupActive = location.pathname === `/dashboard/groups/member/${group.group_id}`;
                        const leader = isGroupLeader(group, user?.suid);
                        return (
                            <button
                                key={group.group_id}
                                onClick={() => { navigate(`/dashboard/groups/member/${group.group_id}`); setSidebarOpen(false); }}
                                title={isMiniSidebar ? group.group_name : ""}
                                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 group cursor-pointer
                                    ${isMiniSidebar ? "justify-center px-2" : ""}
                                    ${isGroupActive
                                        ? theme ? "text-blue-200 bg-gray-800" : "text-red-600 bg-red-50"
                                        : theme ? "text-gray-300 hover:bg-gray-800" : "text-gray-500 hover:bg-red-50"
                                    }`}
                            >
                                <HiOutlineUserGroup className="text-lg shrink-0" />
                                {!isMiniSidebar && <span className="flex-1 text-left truncate">{group.group_name}</span>}
                                {leader && <HiStar className="text-amber-400 shrink-0" title="Group Leader" />}
                            </button>
                        );
                    })}
                </div>
            )}
            {groupsLoading && !isMiniSidebar && (
                <p className={`text-xs px-4 ${theme ? "text-gray-600" : "text-neutral-400"}`}>Loading groups...</p>
            )}

            {departmentItems.length > 0 && (
                <SidebarDropdown title="Department" icon={<HiOutlineLibrary className="text-xl" />} items={departmentItems} setSidebarOpen={setSidebarOpen} isMiniSidebar={isMiniSidebar} />
            )}

            {userItems.length > 0 && (
                <SidebarDropdown title="Users" icon={<FiUsers className="text-xl" />} items={userItems} setSidebarOpen={setSidebarOpen} isMiniSidebar={isMiniSidebar} />
            )}

            {lessonItems.length > 0 && (
                <SidebarDropdown title="Lesson Management" icon={<HiOutlineBookOpen className="text-xl" />} items={lessonItems} setSidebarOpen={setSidebarOpen} isMiniSidebar={isMiniSidebar} />
            )}

            {groupItems.length > 0 && (
                <SidebarDropdown title="Group Management" icon={<HiOutlineUserGroup className="text-xl" />} items={groupItems} setSidebarOpen={setSidebarOpen} isMiniSidebar={isMiniSidebar} />
            )}

            {websiteItems.length > 0 && (
                <SidebarDropdown title="Overview Manage" icon={<SiNginxproxymanager className="text-xl" />} items={websiteItems} setSidebarOpen={setSidebarOpen} isMiniSidebar={isMiniSidebar} />
            )}

            {sectionItems.length > 0 && (
                <SidebarDropdown title="Section Management" icon={<HiOutlineOfficeBuilding className="text-xl" />} items={sectionItems} setSidebarOpen={setSidebarOpen} isMiniSidebar={isMiniSidebar} />
            )}

            {roleItems.length > 0 && (
                <SidebarDropdown title="Roles & Permissions" icon={<HiOutlineShieldCheck className="text-xl" />} items={roleItems} setSidebarOpen={setSidebarOpen} isMiniSidebar={isMiniSidebar} />
            )}

            <div className="flex items-center justify-between my-4 px-1">
                {!isMiniSidebar && (
                    <h1 className={`text-sm font-normal ${theme ? "text-gray-400" : "text-gray-600"}`}>
                        Departments Pipeline
                    </h1>
                )}
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    title="Refresh departments"
                    className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors disabled:opacity-50 ${theme ? "text-gray-400 hover:bg-gray-800 hover:text-blue-300" : "text-gray-400 hover:bg-gray-100 hover:text-[#9b001c]"
                        } ${isMiniSidebar ? "mx-auto" : ""}`}
                >
                    <FiRefreshCw className={`text-sm ${refreshing ? "animate-spin" : ""}`} />
                </button>
            </div>

            {isSuperAdmin ? (
                filteredDepartments.map((dept) => {
                    const sections = sectionsByDept[dept.departmentId] || [];
                    const hasSections = sections.length > 0;

                    if (!hasSections) {
                        return (
                            <div
                                key={dept.departmentId}
                                className={`px-4 py-2.5 rounded-xl text-xs italic ${theme ? "text-gray-600 bg-gray-900/50" : "text-neutral-400 bg-neutral-50"}`}
                            >
                                {!isMiniSidebar && `${dept.departmentName}: No sections created yet`}
                            </div>
                        );
                    }

                    return (
                        <button
                            key={dept.departmentId}
                            type="button"
                            onClick={() => setActiveDepartment(dept.departmentId, dept.departmentName)}
                            className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-semibold text-[15px] transition-all duration-200 group cursor-pointer ${isMiniSidebar ? "justify-center px-2" : ""
                                } ${theme ? "text-white hover:bg-gray-800 hover:text-blue-200" : "text-gray-500 hover:bg-red-50 hover:text-red-600"}`}
                        >
                            <span className={`transition-colors ${theme ? "text-gray-300 group-hover:text-blue-200" : "text-gray-400 group-hover:text-red-600"}`}>
                                <HiOutlineAcademicCap className="text-xl" />
                            </span>
                            {!isMiniSidebar && <span className="truncate">{dept.departmentName}</span>}
                        </button>
                    );
                })
            ) : (
                (singleDepartment ? (sectionsByDept[singleDepartment.departmentId] || []).map((section) => {
                    const studentItems = getStudentSectionItems(hasAccess, singleDepartment.departmentId, section.sectionId);

                    if (studentItems.length === 0) {
                        return null;
                    }

                    return (
                        <SidebarDropdown
                            key={section.sectionId}
                            title={section.name}
                            icon={<HiOutlineOfficeBuilding className="text-xl" />}
                            items={studentItems}
                            setSidebarOpen={setSidebarOpen}
                            isMiniSidebar={isMiniSidebar}
                        />
                    );
                }) : null)
            )}

            {sectionsLoading && !isMiniSidebar && (
                <p className={`text-xs px-4 ${theme ? "text-gray-600" : "text-neutral-400"}`}>Loading sections...</p>
            )}
        </div>
    );
}
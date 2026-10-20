import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTheme } from "../../../components/theme/ThemeContext";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import DescriptionInput from "../../../components/common/DescriptionInput";
import SearchableDropdown, { type DropdownOption } from "../../../components/common/SearchableDropdown";
import LessonMediaUploader from "../../../components/material/LessonMediaUploader";
import ButtonGroup from "../../../components/common/ButtonGroup";
import Checkbox from "../../../components/common/Checkbox";
import { lessonService } from "../../../services/lessonService";
import { departmentService } from "../../../services/departmentService";
import { sectionService } from "../../../services/sectionService";
import { userService } from "../../../services/userService";
import { groupService } from "../../../services/groupService";
import { FaBuilding, FaLayerGroup, FaUserGraduate, FaUsers, FaUsersCog } from "react-icons/fa";

const ROLE_CODES = {
    SUPER_ADMIN: "SUPER_ADMIN",
    DEPARTMENT_HEAD: "HEAD100",
    SECTION_HEAD: "SECHEAD101",
} as const;

type AssignmentTabKey = "all" | "department" | "section" | "student" | "group";

interface LessonFormState {
    lesson_title: string;
    lesson_type: string;
    date_start: string;
    date_end: string;
    description: string;
    progress_points: string;
}

const initialFormState: LessonFormState = {
    lesson_title: "",
    lesson_type: "video",
    date_start: "",
    date_end: "",
    description: "",
    progress_points: "50",
};

const mediaTypes: DropdownOption[] = [
    { value: "video", label: "Video" },
    { value: "audio", label: "Audio" },
    { value: "image", label: "Image" },
    { value: "document", label: "Document" },
];

const getAvailableTabs = (roleCode: string): AssignmentTabKey[] => {
    switch (roleCode) {
        case ROLE_CODES.SUPER_ADMIN:
            return ["all", "department", "section", "student", "group"];
        case ROLE_CODES.DEPARTMENT_HEAD:
            return ["all", "section", "student"];
        case ROLE_CODES.SECTION_HEAD:
            return ["all", "student"];
        default:
            return ["all"];
    }
};

function SectionHeading({ icon, title, theme }: { icon: ReactNode; title: string; theme: boolean }) {
    return (
        <div className="mb-4 flex items-center gap-2">
            <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${theme ? "bg-blue-500/10 text-blue-300" : "bg-red-500/10 text-red-600"}`}>
                {icon}
            </span>
            <h3 className={`text-xs font-semibold uppercase tracking-wider ${theme ? "text-gray-400" : "text-neutral-500"}`}>
                {title}
            </h3>
            <div className={`h-px flex-1 ${theme ? "bg-gray-800" : "bg-neutral-200"}`} />
        </div>
    );
}

export default function CreateLesson() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState<DropdownOption[]>([]);
    const [groups, setGroups] = useState<DropdownOption[]>([]);
    const [sectionOptions, setSectionOptions] = useState<DropdownOption[]>([]);
    const [studentOptions, setStudentOptions] = useState<DropdownOption[]>([]);
    const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
    const [isLoadingSections, setIsLoadingSections] = useState(false);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [isLoadingGroups, setIsLoadingGroups] = useState(false);
    const [activeAssignTab, setActiveAssignTab] = useState<AssignmentTabKey>("all");
    const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
    const [selectedSectionId, setSelectedSectionId] = useState("");
    const [selectedStudentId, setSelectedStudentId] = useState("");
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [assignHeadOnly, setAssignHeadOnly] = useState(false);
    const [mediaFile, setMediaFile] = useState<File | null>(null);

    const [formData, setFormData] = useState<LessonFormState>(initialFormState);

    const user = useMemo(() => {
        const raw = localStorage.getItem("user");
        if (!raw) return null;

        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }, []);

    const roleCode = String(user?.roleCode ?? user?.role_code ?? "").toUpperCase();
    const isSuperAdmin = roleCode === ROLE_CODES.SUPER_ADMIN;

    const resetAssignmentSelection = () => {
        setSelectedDepartmentId("");
        setSelectedSectionId("");
        setSelectedStudentId("");
        setSelectedGroupId("");
        setSectionOptions([]);
        setStudentOptions([]);
        setAssignHeadOnly(false);
    };

    const handleAssignTabChange = (tab: AssignmentTabKey) => {
        setActiveAssignTab(tab);
        resetAssignmentSelection();
    };

    const assignTabs = useMemo(
        () =>
            getAvailableTabs(roleCode).map((tab) => ({
                key: tab,
                label:
                    tab === "all"
                        ? "All"
                        : tab === "department"
                            ? "Department wise"
                            : tab === "section"
                                ? "Section wise"
                                : tab === "student"
                                    ? "Student wise"
                                    : "Group wise",
                icon:
                    tab === "all"
                        ? FaUsers
                        : tab === "department"
                            ? FaBuilding
                            : tab === "section"
                                ? FaLayerGroup
                                : tab === "student"
                                    ? FaUserGraduate
                                    : FaUsersCog,
                onClick: () => handleAssignTabChange(tab),
            })),
        [roleCode]
    );

    useEffect(() => {
        if (!getAvailableTabs(roleCode).includes(activeAssignTab)) {
            setActiveAssignTab("all");
        }
    }, [activeAssignTab, roleCode]);

    const fetchDepartments = async () => {
        try {
            setIsLoadingDepartments(true);
            const result = await departmentService.getAllDepartments();
            const list = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : [];
            const mapped = list.map((item: any) => ({
                value: String(item.department_id ?? item.departmentId ?? item.id),
                label: item.department_name ?? item.departmentName ?? item.name ?? `Department ${item.department_id ?? item.departmentId ?? item.id}`,
            }));
            setDepartments(mapped);
        } catch (error: any) {
            toast.error(error?.message || "Failed to load departments");
        } finally {
            setIsLoadingDepartments(false);
        }
    };

    const fetchSectionsForDepartment = async (departmentId: string | number) => {
        if (!departmentId) {
            setSectionOptions([]);
            return;
        }

        try {
            setIsLoadingSections(true);
            const result = await sectionService.getSectionsByDepartment(Number(departmentId));
            const list = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : [];
            const mapped = list.map((item: any) => ({
                value: String(item.section_id ?? item.sectionId ?? item.id),
                label: item.section_name ?? item.sectionName ?? item.name ?? `Section ${item.section_id ?? item.sectionId ?? item.id}`,
            }));
            setSectionOptions(mapped);
        } catch (error: any) {
            toast.error(error?.message || "Failed to load sections");
        } finally {
            setIsLoadingSections(false);
        }
    };

    const fetchStudentsForSection = async (sectionId: string | number) => {
        if (!sectionId) {
            setStudentOptions([]);
            return;
        }

        try {
            setIsLoadingStudents(true);
            const result = await userService.getUsersBySection(Number(sectionId));
            const list = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : [];
            const mapped = list.map((item: any) => ({
                value: String(item.suid ?? item.user_id ?? item.id),
                label: item.name ?? item.full_name ?? item.username ?? `Student ${item.suid ?? item.user_id ?? item.id}`,
            }));
            setStudentOptions(mapped);
        } catch (error: any) {
            toast.error(error?.message || "Failed to load students");
        } finally {
            setIsLoadingStudents(false);
        }
    };

    const fetchGroups = async () => {
        try {
            setIsLoadingGroups(true);
            const result = await groupService.getAllGroups();
            const list = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : [];
            const mapped = list.map((item: any) => ({
                value: String(item.group_id ?? item.groupId ?? item.id),
                label: item.group_name ?? item.groupName ?? item.name ?? `Group ${item.group_id ?? item.groupId ?? item.id}`,
            }));
            setGroups(mapped);
        } catch (error: any) {
            toast.error(error?.message || "Failed to load groups");
        } finally {
            setIsLoadingGroups(false);
        }
    };

    useEffect(() => {
        void fetchDepartments();
    }, []);

    useEffect(() => {
        if (isSuperAdmin) {
            void fetchGroups();
        }
    }, [isSuperAdmin]);

    useEffect(() => {
        if ((activeAssignTab === "section" || activeAssignTab === "student") && selectedDepartmentId) {
            void fetchSectionsForDepartment(selectedDepartmentId);
        }
    }, [selectedDepartmentId, activeAssignTab]);

    useEffect(() => {
        if (activeAssignTab === "student" && selectedSectionId) {
            void fetchStudentsForSection(selectedSectionId);
        }
    }, [selectedSectionId, activeAssignTab]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelect = (field: keyof LessonFormState, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: String(value) }));
    };

    const handleDepartmentSelect = (value: string | number) => {
        const nextDepartmentId = String(value);
        setSelectedDepartmentId(nextDepartmentId);
        setSelectedSectionId("");
        setSelectedStudentId("");
        setStudentOptions([]);

        if (nextDepartmentId && (activeAssignTab === "section" || activeAssignTab === "student")) {
            void fetchSectionsForDepartment(nextDepartmentId);
        }
    };

    const handleSectionSelect = (value: string | number) => {
        const nextSectionId = String(value);
        setSelectedSectionId(nextSectionId);
        setSelectedStudentId("");
        setStudentOptions([]);

        if (nextSectionId && activeAssignTab === "student") {
            void fetchStudentsForSection(nextSectionId);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const title = formData.lesson_title.trim();
        const progressPoints = Number(formData.progress_points || 0);

        if (!title) {
            toast.error("Please enter lesson title");
            return;
        }

        if (!formData.lesson_type) {
            toast.error("Please select lesson media type");
            return;
        }

        if (activeAssignTab === "department" && !selectedDepartmentId) {
            toast.error("Please select a department");
            return;
        }

        if (activeAssignTab === "section" && (!selectedDepartmentId || !selectedSectionId)) {
            toast.error("Please select a department and section");
            return;
        }

        if (activeAssignTab === "student" && (!selectedDepartmentId || !selectedSectionId || !selectedStudentId)) {
            toast.error("Please select a department, section, and student");
            return;
        }

        if (activeAssignTab === "group" && !selectedGroupId) {
            toast.error("Please select a group");
            return;
        }

        if (!formData.date_start) {
            toast.error("Please select start date");
            return;
        }

        if (!formData.date_end) {
            toast.error("Please select end date");
            return;
        }

        if (new Date(formData.date_end) < new Date(formData.date_start)) {
            toast.error("End date cannot be before start date");
            return;
        }

        const resolvedDepartmentId = ["department", "section", "student"].includes(activeAssignTab)
            ? Number(selectedDepartmentId) || null
            : null;

        const assignment = {
            scope: activeAssignTab,
            department_id: resolvedDepartmentId,
            section_id: ["section", "student"].includes(activeAssignTab) ? Number(selectedSectionId) || null : null,
            student_id: activeAssignTab === "student" ? Number(selectedStudentId) || null : null,
            group_id: activeAssignTab === "group" ? Number(selectedGroupId) || null : null,
            head_only: ["department", "section"].includes(activeAssignTab) ? assignHeadOnly : false,
        };

        const payload = {
            lesson_title: title,
            lesson_type: formData.lesson_type,
            department_id: resolvedDepartmentId,
            departmentId: resolvedDepartmentId,
            start_date: formData.date_start,
            date_start: formData.date_start,
            end_date: formData.date_end,
            date_end: formData.date_end,
            description: formData.description.trim(),
            progress_points: Number.isFinite(progressPoints) ? progressPoints : 0,
            points: Number.isFinite(progressPoints) ? progressPoints : 0,
            role_code: user?.roleCode || "USER",
            created_by: user?.id ?? user?.suid ?? null,
            media_file: mediaFile ? mediaFile.name : null,
            file_name: mediaFile ? mediaFile.name : null,
            file: mediaFile,
            assignment,
        };

        setLoading(true);

        try {
            const response = await lessonService.createLesson(payload);

            if (response?.success) {
                toast.success("Lesson created successfully");
                setFormData(initialFormState);
                resetAssignmentSelection();
                setActiveAssignTab("all");
                setMediaFile(null);
                navigate("/dashboard/lessons/list");
                return;
            }

            toast.error(response?.message || "Failed to create lesson");
        } catch (error: any) {
            toast.error(error?.message || "Something went wrong while creating lesson");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`mx-auto max-w-7xl rounded-2xl border p-6 shadow-sm transition-all duration-200 sm:p-8 ${theme ? "border-gray-800 bg-gray-900 text-white" : "border-neutral-200 bg-white text-neutral-900"}`}>
            <div className="mb-8 border-b border-neutral-200 pb-6 text-center dark:border-gray-800">
                <div className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg ${theme ? "bg-linear-to-br from-blue-300 to-blue-900 shadow-blue-950/40" : "bg-linear-to-br from-red-300 to-red-900 shadow-red-950/20"}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7" aria-hidden="true">
                        <path d="M4 6.75A2.75 2.75 0 0 1 6.75 4h10.5A2.75 2.75 0 0 1 20 6.75v10.5A2.75 2.75 0 0 1 17.25 20H6.75A2.75 2.75 0 0 1 4 17.25V6.75Z" />
                        <path d="M10 8.5v7l6-3.5-6-3.5Z" />
                    </svg>
                </div>

                <h2 className={`text-3xl font-bold tracking-tight sm:text-4xl ${theme ? "text-blue-200" : "text-red-600"}`}>
                    Create Lesson
                </h2>
                <p className={`mx-auto mt-2 max-w-md text-sm ${theme ? "text-gray-400" : "text-neutral-500"}`}>
                    Add lesson details, media type, and progress tracking for your department or section.
                </p>
            </div>

            <div className={`mb-8 rounded-2xl border p-5 shadow-sm transition-all duration-200 ${theme ? "border-gray-800 bg-gray-900/60" : "border-neutral-200 bg-neutral-50"}`}>
                <SectionHeading
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true"><path d="M7 18.5v-2.5M12 18.5v-8.5M17 18.5v-5.5" /><path d="M5 18.5h14" /></svg>}
                    title="Assign Lesson To"
                    theme={theme}
                />

                <ButtonGroup buttons={assignTabs} defaultActiveKey={activeAssignTab} className="w-full flex-wrap" />

                {activeAssignTab !== "all" && (
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                        {(activeAssignTab === "department" || activeAssignTab === "section" || activeAssignTab === "student") && (
                            <SearchableDropdown
                                label="Department"
                                placeholder={isLoadingDepartments ? "Loading departments..." : "Select department"}
                                searchPlaceholder="Search department..."
                                options={departments}
                                selectedValue={selectedDepartmentId}
                                onSelect={handleDepartmentSelect}
                                required
                                disabled={isLoadingDepartments || departments.length === 0}
                            />
                        )}

                        {(activeAssignTab === "section" || activeAssignTab === "student") && (
                            <SearchableDropdown
                                label="Section *"
                                placeholder={isLoadingSections ? "Loading sections..." : "Select section"}
                                searchPlaceholder="Search section..."
                                options={sectionOptions}
                                selectedValue={selectedSectionId}
                                onSelect={handleSectionSelect}
                                required
                                disabled={!selectedDepartmentId || isLoadingSections || sectionOptions.length === 0}
                            />
                        )}

                        {activeAssignTab === "student" && (
                            <SearchableDropdown
                                label="Student *"
                                placeholder={isLoadingStudents ? "Loading students..." : "Select student"}
                                searchPlaceholder="Search student..."
                                options={studentOptions}
                                selectedValue={selectedStudentId}
                                onSelect={(value) => setSelectedStudentId(String(value))}
                                required
                                disabled={!selectedSectionId || isLoadingStudents || studentOptions.length === 0}
                            />
                        )}

                        {activeAssignTab === "group" && (
                            <SearchableDropdown
                                label="Group *"
                                placeholder={isLoadingGroups ? "Loading groups..." : "Select group"}
                                searchPlaceholder="Search group..."
                                options={groups}
                                selectedValue={selectedGroupId}
                                onSelect={(value) => setSelectedGroupId(String(value))}
                                required
                                disabled={isLoadingGroups || groups.length === 0}
                            />
                        )}
                    </div>
                )}

                {(activeAssignTab === "department" || activeAssignTab === "section") && (
                    <label className={`mt-4 flex items-center gap-2 text-sm ${theme ? "text-gray-300" : "text-neutral-700"}`}>
                        <Checkbox checked={assignHeadOnly} onChange={() => setAssignHeadOnly((prev) => !prev)} />
                        Only assign to head (skip members)
                    </label>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                    <SectionHeading
                        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true"><path d="M6 5.5h12M6 12h12M6 18.5h8" /><path d="M15.5 18.5 18 16l-2.5-2.5" /></svg>}
                        title="Lesson Details"
                        theme={theme}
                    />

                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <SearchableDropdown
                                label="Lesson Type *"
                                placeholder="Select media type"
                                options={mediaTypes}
                                selectedValue={formData.lesson_type}
                                onSelect={(value: string | number) => {
                                    handleSelect("lesson_type", value);
                                    setMediaFile(null);
                                }}
                                required
                            />
                        </div>

                        {formData.lesson_type && (
                            <div className="md:col-span-2">
                                <LessonMediaUploader
                                    lessonType={formData.lesson_type}
                                    onFileChange={(file) => setMediaFile(file)}
                                    label="Media File"
                                />
                            </div>
                        )}

                        <div className="md:col-span-2">
                            <Input
                                label="Lesson Title *"
                                type="text"
                                name="lesson_title"
                                value={formData.lesson_title}
                                onChange={handleInputChange}
                                placeholder="Enter lesson title"
                                required
                            />
                        </div>

                        <div>
                            <label className={`mb-1.5 block text-sm font-medium ${theme ? "text-gray-300" : "text-neutral-700"}`}>
                                Start Date *
                            </label>
                            <Input type="date" name="date_start" value={formData.date_start} onChange={handleInputChange} />
                        </div>

                        <div>
                            <label className={`mb-1.5 block text-sm font-medium ${theme ? "text-gray-300" : "text-neutral-700"}`}>
                                End Date *
                            </label>
                            <Input type="date" name="date_end" value={formData.date_end} onChange={handleInputChange} />
                        </div>

                        <div className="md:col-span-2">
                            <label className={`mb-1.5 block text-sm font-medium ${theme ? "text-gray-300" : "text-neutral-700"}`}>
                                Progress Points
                            </label>
                            <Input
                                type="number"
                                name="progress_points"
                                min={0}
                                max={100}
                                value={formData.progress_points}
                                onChange={handleInputChange}
                                placeholder="50"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <SectionHeading
                        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-11Z" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>}
                        title="Description"
                        theme={theme}
                    />
                    <DescriptionInput
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        label="Lesson Description"
                        placeholder="Describe the lesson objective, outcome, or instructions..."
                        maxLength={600}
                        rows={5}
                    />
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-neutral-200 pt-6 dark:border-gray-800">
                    <Button
                        type="button"
                        className="bg-transparent! from-transparent! to-transparent! text-current! shadow-none! hover:bg-transparent! border! border-neutral-300! dark:border-gray-700!"
                        onClick={() => navigate("/dashboard/lessons/list")}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={loading} loadingText="Creating...">
                        Create Lesson
                    </Button>
                </div>
            </form>
        </div>
    );
}
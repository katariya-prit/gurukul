import type {
    DashboardWidget,
    DepartmentFunctionality,
    DepartmentOption,
    EnrollmentStudent,
    Functionality,
    FunctionalityItem,
    ItemLevel,
    ItemPermissions,
    ItemRubric,
    PermissionOption,
    RubricCriterion,
} from "../types";

export const mockDepartments: DepartmentOption[] = [
    { id: 1, name: "Music" },
    { id: 2, name: "Dancing" },
    { id: 3, name: "Computer and Technology" },
    { id: 4, name: "Accounting" },
];

const functionalitySeeds = [
    { name: "Instrumental Marking", key: "instrumental_marking", icon: "music", evaluatorType: "both" as const },
    { name: "Choreography Review", key: "choreography_review", icon: "sparkles", evaluatorType: "teacher" as const },
    { name: "Coding Assessment", key: "coding_assessment", icon: "code", evaluatorType: "both" as const },
    { name: "Accounting Practice", key: "accounting_practice", icon: "calculator", evaluatorType: "ai" as const },
];

const itemLabels = ["Instrument", "Dance Form", "Skill", "Skill"];
const itemNames = [
    ["Tabla", "Piano", "Vocal"],
    ["Kathak", "Garba", "Contemporary"],
    ["Python", "Web Design", "Networking"],
    ["Tally", "Ledger", "Taxation"],
];
const rubricCriteria: RubricCriterion[] = [
    { key: "accuracy", label: "Accuracy", weight: 35, maxPoints: 35 },
    { key: "technique", label: "Technique", weight: 35, maxPoints: 35 },
    { key: "expression", label: "Expression", weight: 30, maxPoints: 30 },
];
const levelSeeds = [
    { levelNo: 1, name: "Beginner", minPoints: 0, promoteMode: "auto" as const },
    { levelNo: 2, name: "Intermediate", minPoints: 100, promoteMode: "auto" as const },
    { levelNo: 3, name: "Advanced", minPoints: 300, promoteMode: "auto" as const },
    { levelNo: 4, name: "Expert", minPoints: 600, promoteMode: "auto" as const },
];

let nextFunctionalityId = functionalitySeeds.length + 1;
let nextItemId = 1;
let nextRubricId = 1;
let nextLevelId = 1;
let nextWidgetId = 4;

export const mockFunctionalities: Functionality[] = functionalitySeeds.map((seed, index) => ({
    id: index + 1,
    key: seed.key,
    name: seed.name,
    description: `${seed.name} tools for department learning and assessment.`,
    icon: seed.icon,
    themeColor: ["#6366f1", "#ec4899", "#06b6d4", "#f59e0b"][index],
    evaluatorType: seed.evaluatorType,
    isActive: true,
    departmentCount: mockDepartments.length,
    itemCount: 0,
}));

export const mockAssignments: DepartmentFunctionality[] = [];
export const mockItems: FunctionalityItem[] = [];
export const mockRubrics: ItemRubric[] = [];
export const mockLevels: ItemLevel[] = [];
export const mockWidgets: DashboardWidget[] = [
    {
        id: 1,
        functionalityId: 1,
        functionalityName: "Instrumental Marking",
        itemId: null,
        itemName: null,
        widgetType: "levelBadge",
        title: "Current Level",
        config: { showPoints: true },
        roles: ["STUDENT"],
        sortOrder: 1,
        isActive: true,
    },
    {
        id: 2,
        functionalityId: 1,
        functionalityName: "Instrumental Marking",
        itemId: 1,
        itemName: "Tabla",
        widgetType: "recentMarks",
        title: "Recent Marks",
        config: { limit: 5 },
        roles: ["STUDENT", "HEAD100"],
        sortOrder: 2,
        isActive: true,
    },
    {
        id: 3,
        functionalityId: 2,
        functionalityName: "Choreography Review",
        itemId: null,
        itemName: null,
        widgetType: "growthChart",
        title: "Growth",
        config: { period: "month" },
        roles: ["STUDENT"],
        sortOrder: 3,
        isActive: true,
    },
];

export const mockPermissionOptions: {
    roles: PermissionOption[];
    sections: PermissionOption[];
    users: PermissionOption[];
} = {
    roles: [
        { id: "HEAD100", label: "Department Head" },
        { id: "SECHEAD101", label: "Section Head" },
        { id: "STUDENT", label: "Student" },
        { id: "USER", label: "User" },
    ],
    sections: [
        { id: 1, label: "Sargam" },
        { id: 2, label: "Ridham" },
        { id: 3, label: "Nritya" },
    ],
    users: [
        { id: 100001, label: "Aarav Patel" },
        { id: 100002, label: "Diya Shah" },
        { id: 100003, label: "Kabir Mehta" },
        { id: 100004, label: "Meera Joshi" },
    ],
};

export const mockItemPermissions = new Map<number, ItemPermissions>();

export const mockStudents: EnrollmentStudent[] = [
    { suid: 100001, name: "Aarav Patel", departmentId: 1, sectionId: 1, sectionName: "Sargam", enrolled: false },
    { suid: 100002, name: "Diya Shah", departmentId: 1, sectionId: 2, sectionName: "Ridham", enrolled: false },
    { suid: 100003, name: "Kabir Mehta", departmentId: 2, sectionId: 3, sectionName: "Nritya", enrolled: false },
    { suid: 100004, name: "Meera Joshi", departmentId: 3, sectionId: null, sectionName: null, enrolled: false },
    { suid: 100005, name: "Ishaan Dave", departmentId: 4, sectionId: null, sectionName: null, enrolled: false },
];

export const mockEnrollmentByItem = new Map<number, Set<number>>();

for (let functionalityIndex = 0; functionalityIndex < functionalitySeeds.length; functionalityIndex += 1) {
    const functionality = mockFunctionalities[functionalityIndex];
    for (let departmentIndex = 0; departmentIndex < mockDepartments.length; departmentIndex += 1) {
        const department = mockDepartments[departmentIndex];
        const assignment: DepartmentFunctionality = {
            id: mockAssignments.length + 1,
            departmentId: department.id,
            departmentName: department.name,
            functionalityId: functionality.id,
            itemLabel: itemLabels[departmentIndex],
            isEnabled: true,
        };
        mockAssignments.push(assignment);

        for (const name of itemNames[departmentIndex]) {
            const itemId = nextItemId;
            nextItemId += 1;
            mockItems.push({
                id: itemId,
                functionalityId: functionality.id,
                functionalityName: functionality.name,
                departmentId: department.id,
                departmentName: department.name,
                itemLabel: assignment.itemLabel,
                name,
                icon: ["music", "sparkles", "code", "calculator"][departmentIndex],
                isActive: true,
                currentRubricVersion: itemId === 1 ? 2 : 1,
                levelCount: levelSeeds.length,
            });

            if (itemId === 1) {
                mockRubrics.push({
                    id: nextRubricId,
                    itemId,
                    version: 1,
                    criteria: rubricCriteria.map((criterion) => ({ ...criterion })),
                    maxPoints: 100,
                    isCurrent: false,
                    createdAt: "2025-01-15T12:00:00.000Z",
                    createdBy: "Super Admin",
                });
                nextRubricId += 1;
                mockRubrics.push({
                    id: nextRubricId,
                    itemId,
                    version: 2,
                    criteria: rubricCriteria.map((criterion) => ({ ...criterion })),
                    maxPoints: 100,
                    isCurrent: true,
                    createdAt: "2025-03-10T12:00:00.000Z",
                    createdBy: "Super Admin",
                });
                nextRubricId += 1;
            } else {
                mockRubrics.push({
                    id: nextRubricId,
                    itemId,
                    version: 1,
                    criteria: rubricCriteria.map((criterion) => ({ ...criterion })),
                    maxPoints: 100,
                    isCurrent: true,
                    createdAt: "2025-03-10T12:00:00.000Z",
                    createdBy: "Super Admin",
                });
                nextRubricId += 1;
            }

            for (const level of levelSeeds) {
                mockLevels.push({ id: nextLevelId, itemId, ...level });
                nextLevelId += 1;
            }

            if (itemId === 1) {
                mockItemPermissions.set(itemId, {
                    roleCodes: ["HEAD100", "SECHEAD101"],
                    sectionIds: [1, 2],
                    userSuids: [100001],
                });
                mockEnrollmentByItem.set(itemId, new Set([100001]));
            } else if (itemId === 4) {
                mockItemPermissions.set(itemId, {
                    roleCodes: ["HEAD100"],
                    sectionIds: [3],
                    userSuids: [100003],
                });
            }
        }
    }
}

export function updateMockFunctionalityCounts(): void {
    for (const functionality of mockFunctionalities) {
        functionality.departmentCount = mockAssignments.filter(
            (assignment) => assignment.functionalityId === functionality.id && assignment.isEnabled
        ).length;
        functionality.itemCount = mockItems.filter((item) => item.functionalityId === functionality.id).length;
    }
}

export function createMockFunctionalityId(): number {
    const id = nextFunctionalityId;
    nextFunctionalityId += 1;
    return id;
}

export function createMockItemId(): number {
    const id = nextItemId;
    nextItemId += 1;
    return id;
}

export function createMockRubricId(): number {
    const id = nextRubricId;
    nextRubricId += 1;
    return id;
}

export function createMockLevelId(): number {
    const id = nextLevelId;
    nextLevelId += 1;
    return id;
}

export function createMockWidgetId(): number {
    const id = nextWidgetId;
    nextWidgetId += 1;
    return id;
}

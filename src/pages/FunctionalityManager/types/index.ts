export type EvaluatorType = "ai" | "teacher" | "both";
export type PromoteMode = "auto" | "manual";
export type WidgetType = "levelBadge" | "progressRing" | "recentMarks" | "growthChart" | "itemStats";

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
}

export interface Functionality {
    id: number;
    key: string;
    name: string;
    description: string | null;
    icon: string | null;
    themeColor: string | null;
    evaluatorType: EvaluatorType;
    isActive: boolean;
    departmentCount: number;
    itemCount: number;
}

export interface DepartmentOption {
    id: number;
    name: string;
}

export interface DepartmentFunctionality {
    id: number;
    departmentId: number;
    departmentName: string;
    functionalityId: number;
    itemLabel: string;
    isEnabled: boolean;
}

export interface FunctionalityItem {
    id: number;
    functionalityId: number;
    functionalityName: string;
    departmentId: number;
    departmentName: string;
    itemLabel: string;
    name: string;
    icon: string | null;
    isActive: boolean;
    currentRubricVersion: number | null;
    levelCount: number;
}

export interface RubricCriterion {
    key: string;
    label: string;
    weight: number;
    maxPoints: number;
}

export interface ItemRubric {
    id: number;
    itemId: number;
    version: number;
    criteria: RubricCriterion[];
    maxPoints: number;
    isCurrent: boolean;
    createdAt: string;
    createdBy: string | null;
}

export interface ItemLevel {
    id: number;
    itemId: number;
    levelNo: number;
    name: string;
    minPoints: number;
    promoteMode: PromoteMode;
}

export interface PermissionOption {
    id: string | number;
    label: string;
}

export interface ItemPermissions {
    roleCodes: string[];
    sectionIds: number[];
    userSuids: number[];
}

export type DashboardWidgetConfig = Record<string, unknown>;

export interface DashboardWidget {
    id: number;
    functionalityId: number;
    functionalityName: string;
    itemId: number | null;
    itemName: string | null;
    widgetType: WidgetType;
    title: string;
    config: DashboardWidgetConfig;
    roles: string[];
    sortOrder: number;
    isActive: boolean;
}

export interface FunctionalityInput {
    name: string;
    key: string;
    description: string | null;
    icon: string | null;
    themeColor: string | null;
    evaluatorType: EvaluatorType;
    isActive: boolean;
}

export interface ItemInput {
    functionalityId: number;
    departmentId: number;
    name: string;
    icon: string | null;
    isActive: boolean;
}

export interface DepartmentAssignmentInput {
    departmentId: number;
    itemLabel: string;
    isEnabled: boolean;
}

export interface DepartmentFunctionalityItemAssignment {
    functionalityId: number;
    itemLabel: string;
    isEnabled: boolean;
}

export interface WidgetInput {
    functionalityId: number;
    itemId: number | null;
    widgetType: WidgetType;
    title: string;
    config: DashboardWidgetConfig;
    roles: string[];
    sortOrder: number;
    isActive: boolean;
}

export interface EnrollmentStudent {
    suid: number;
    name: string;
    departmentId: number;
    sectionId: number | null;
    sectionName: string | null;
    enrolled: boolean;
}

import axios, { type AxiosResponse } from "axios";
import type {
    DashboardWidget,
    DepartmentAssignmentInput,
    DepartmentFunctionality,
    DepartmentFunctionalityItemAssignment,
    EnrollmentStudent,
    Functionality,
    FunctionalityInput,
    FunctionalityItem,
    ItemInput,
    ItemLevel,
    ItemPermissions,
    ItemRubric,
    PermissionOption,
    RubricCriterion,
    WidgetInput,
} from "../types";
import {
    createMockFunctionalityId,
    createMockItemId,
    createMockLevelId,
    createMockRubricId,
    createMockWidgetId,
    mockAssignments,
    mockDepartments,
    mockEnrollmentByItem,
    mockFunctionalities,
    mockItems,
    mockLevels,
    mockItemPermissions,
    mockPermissionOptions,
    mockRubrics,
    mockStudents,
    mockWidgets,
    updateMockFunctionalityCounts,
} from "./mockData";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";
const client = axios.create({ baseURL: API_URL, withCredentials: true });

client.interceptors.request.use((config) => {
    config.withCredentials = true;
    return config;
});
const mockListeners = new Set<() => void>();
let mockActive = import.meta.env.VITE_USE_MOCK === "true";

class MockFallbackError extends Error {}

interface ApiDepartment {
    id?: number;
    departmentId?: number;
    name?: string;
    departmentName?: string;
}

interface ApiSection {
    id?: number;
    sectionId?: number;
    name?: string;
    sectionName?: string;
}

interface ApiUser {
    id?: number;
    suid?: number;
    name?: string;
    username?: string;
    fullName?: string;
}

function setMockActive(active: boolean): void {
    if (mockActive === active) return;
    mockActive = active;
    mockListeners.forEach((listener) => listener());
}

function isHtmlOrInvalidJson(response: AxiosResponse<unknown>): boolean {
    const contentType = response.headers["content-type"];
    if (typeof contentType === "string" && contentType.toLowerCase().includes("text/html")) return true;
    if (typeof response.data !== "string") return false;
    const body = response.data.trim();
    if (body.startsWith("<!doctype html") || body.startsWith("<html") || body.startsWith("<")) return true;
    try {
        JSON.parse(body);
        return false;
    } catch {
        return true;
    }
}

function messageFromError(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data;
        if (typeof data === "object" && data !== null && "message" in data && typeof data.message === "string") {
            return data.message;
        }
        if (typeof data === "string" && data.trim()) return data.trim();
        return error.message;
    }
    return error instanceof Error ? error.message : "Functionality Manager request failed.";
}

function shouldFallback(error: unknown): boolean {
    if (import.meta.env.VITE_USE_MOCK === "false") return false;
    if (error instanceof MockFallbackError) return true;
    const message = messageFromError(error);
    if (/\bCannot (GET|POST|PUT|DELETE)\b/i.test(message)) return true;
    if (axios.isAxiosError(error)) {
        if (!error.response) return true;
        if (error.response.status === 404 || error.response.status === 501) return true;
        return isHtmlOrInvalidJson(error.response);
    }
    return error instanceof TypeError && /fetch|network/i.test(message);
}

function extractData<T>(response: AxiosResponse<unknown>): T {
    if (isHtmlOrInvalidJson(response)) throw new MockFallbackError("The server returned a non-JSON response.");
    let payload: unknown = response.data;
    if (typeof payload === "string") {
        try {
            payload = JSON.parse(payload) as unknown;
        } catch {
            throw new MockFallbackError("The server returned a non-JSON response.");
        }
    }
    if (typeof payload === "object" && payload !== null && "success" in payload && payload.success === false) {
        const message = "message" in payload && typeof payload.message === "string"
            ? payload.message
            : "Functionality Manager request failed.";
        throw new Error(message);
    }
    if (typeof payload === "object" && payload !== null && "data" in payload) {
        return payload.data as T;
    }
    return payload as T;
}

function waitForMock(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 250 + Math.floor(Math.random() * 151)));
}

async function requestOrMock<T>(request: () => Promise<T>, fallback: () => T | Promise<T>): Promise<T> {
    if (mockActive) {
        await waitForMock();
        return fallback();
    }
    try {
        return await request();
    } catch (error) {
        if (!shouldFallback(error)) {
            throw new Error(messageFromError(error), { cause: error });
        }
        setMockActive(true);
        await waitForMock();
        return fallback();
    }
}

async function getData<T>(path: string): Promise<T> {
    const response = await client.get<unknown>(path);
    return extractData<T>(response);
}

async function sendData<T>(method: "post" | "put" | "delete", path: string, data?: unknown): Promise<T> {
    const response = await client.request<unknown>({ method, url: path, data });
    return extractData<T>(response);
}

function getAssignmentRows(functionalityId: number): DepartmentFunctionality[] {
    return mockAssignments.filter((assignment) => assignment.functionalityId === functionalityId);
}

function itemForId(itemId: number): FunctionalityItem {
    const item = mockItems.find((entry) => entry.id === itemId);
    if (!item) throw new Error("Item was not found.");
    return item;
}

function optionRows<T extends ApiDepartment | ApiSection | ApiUser>(
    rows: T[],
    getId: (row: T) => number | undefined,
    getLabel: (row: T) => string | undefined,
): PermissionOption[] {
    return rows.flatMap((row) => {
        const id = getId(row);
        const label = getLabel(row);
        return id !== undefined && label ? [{ id, label }] : [];
    });
}

export const functionalityManagerService = {
    isMockMode: () => mockActive,

    subscribe: (listener: () => void) => {
        mockListeners.add(listener);
        return () => {
            mockListeners.delete(listener);
        };
    },

    getFunctionalities: () => requestOrMock(
        () => getData<Functionality[]>("/functionalities"),
        () => mockFunctionalities.map((entry) => ({ ...entry }))
    ),

    getFunctionality: (id: number) => requestOrMock(
        () => getData<Functionality>(`/functionalities/${id}`),
        () => {
            const functionality = mockFunctionalities.find((entry) => entry.id === id);
            if (!functionality) throw new Error("Functionality was not found.");
            return functionality;
        }
    ),

    saveFunctionality: (input: FunctionalityInput, id?: number) => requestOrMock(
        () => id
            ? sendData<Functionality>("put", `/functionalities/${id}`, input)
            : sendData<Functionality>("post", "/functionalities", input),
        () => {
            if (id) {
                const current = mockFunctionalities.find((entry) => entry.id === id);
                if (!current) throw new Error("Functionality was not found.");
                Object.assign(current, input);
                for (const item of mockItems.filter((entry) => entry.functionalityId === id)) {
                    item.functionalityName = input.name;
                }
                for (const widget of mockWidgets.filter((entry) => entry.functionalityId === id)) {
                    widget.functionalityName = input.name;
                }
                return current;
            }
            const functionality: Functionality = {
                ...input,
                id: createMockFunctionalityId(),
                departmentCount: 0,
                itemCount: 0,
            };
            mockFunctionalities.push(functionality);
            return functionality;
        }
    ),

    setFunctionalityActive: (id: number, isActive: boolean) => requestOrMock(
        () => sendData<Functionality>("put", `/functionalities/${id}`, { isActive }),
        () => {
            const functionality = mockFunctionalities.find((entry) => entry.id === id);
            if (!functionality) throw new Error("Functionality was not found.");
            functionality.isActive = isActive;
            return functionality;
        }
    ),

    getDepartments: () => requestOrMock(
        async () => {
            const rows = await getData<ApiDepartment[]>("/departments");
            return rows.flatMap((department) => {
                const id = department.departmentId ?? department.id;
                const name = department.departmentName ?? department.name;
                return id !== undefined && name ? [{ id, name }] : [];
            });
        },
        () => mockDepartments
    ),

    getSections: () => requestOrMock(
        async () => {
            const rows = await getData<ApiSection[]>("/sections");
            return optionRows(rows, (row) => row.sectionId ?? row.id, (row) => row.sectionName ?? row.name);
        },
        () => mockPermissionOptions.sections
    ),

    getUsers: () => requestOrMock(
        async () => {
            const rows = await getData<ApiUser[]>("/users");
            return optionRows(rows, (row) => row.suid ?? row.id, (row) => row.fullName ?? row.name ?? row.username);
        },
        () => mockPermissionOptions.users
    ),

    getDepartmentFunctionalities: (functionalityId: number) => requestOrMock(
        () => getData<DepartmentFunctionality[]>(`/functionalities/${functionalityId}/departments`),
        () => getAssignmentRows(functionalityId)
    ),

    setDepartmentFunctionalities: (functionalityId: number, assignments: DepartmentAssignmentInput[]) => requestOrMock(
        async () => {
            const departments = await functionalityManagerService.getDepartments();
            if (mockActive) throw new MockFallbackError("A required API route is unavailable.");
            const submitted = departments.map((department) => {
                const assignment = assignments.find((entry) => entry.departmentId === department.id);
                return {
                    departmentId: department.id,
                    itemLabel: assignment?.itemLabel ?? "Item",
                    isEnabled: assignment?.isEnabled ?? false,
                };
            });
            await Promise.all(submitted.map((assignment) =>
                sendData("put", `/departments/${assignment.departmentId}/functionalities`, {
                    functionalityId,
                    itemLabel: assignment.itemLabel,
                    isEnabled: assignment.isEnabled,
                })
            ));
            return getData<DepartmentFunctionality[]>(`/functionalities/${functionalityId}/departments`);
        },
        () => {
            for (let index = mockAssignments.length - 1; index >= 0; index -= 1) {
                if (mockAssignments[index].functionalityId === functionalityId) mockAssignments.splice(index, 1);
            }
            for (const assignment of assignments) {
                const department = mockDepartments.find((entry) => entry.id === assignment.departmentId);
                if (!department) continue;
                mockAssignments.push({
                    id: mockAssignments.length + 1,
                    departmentId: department.id,
                    departmentName: department.name,
                    functionalityId,
                    itemLabel: assignment.itemLabel,
                    isEnabled: assignment.isEnabled,
                });
                for (const item of mockItems) {
                    if (item.functionalityId === functionalityId && item.departmentId === department.id) {
                        item.itemLabel = assignment.itemLabel;
                    }
                }
            }
            updateMockFunctionalityCounts();
            return getAssignmentRows(functionalityId);
        }
    ),

    getFunctionalitiesByDepartment: (departmentId: number) => requestOrMock(
        () => getData<DepartmentFunctionality[]>(`/departments/${departmentId}/functionalities`),
        () => mockAssignments.filter((entry) => entry.departmentId === departmentId)
    ),

    setFunctionalitiesByDepartment: (
        departmentId: number,
        assignments: DepartmentFunctionalityItemAssignment[]
    ) => requestOrMock(
        () => sendData("put", `/departments/${departmentId}/functionalities`, { functionalities: assignments }),
        () => {
            for (const item of assignments) {
                const existing = mockAssignments.find(
                    (entry) => entry.departmentId === departmentId && entry.functionalityId === item.functionalityId
                );
                if (existing) {
                    existing.isEnabled = item.isEnabled;
                    existing.itemLabel = item.itemLabel;
                } else {
                    const dept = mockDepartments.find((d) => d.id === departmentId);
                    mockAssignments.push({
                        id: mockAssignments.length + 1,
                        departmentId,
                        departmentName: dept?.name ?? "Department",
                        functionalityId: item.functionalityId,
                        itemLabel: item.itemLabel,
                        isEnabled: item.isEnabled,
                    });
                }
            }
            updateMockFunctionalityCounts();
            return mockAssignments.filter((entry) => entry.departmentId === departmentId);
        }
    ),

    getItems: (filters?: { functionalityId?: number; departmentId?: number }) => requestOrMock(
        async () => {
            const rows = filters?.functionalityId
                ? await getData<FunctionalityItem[]>(`/functionalities/${filters.functionalityId}/items`)
                : await getData<FunctionalityItem[]>("/items");
            return rows.filter((item) =>
                (!filters?.functionalityId || item.functionalityId === filters.functionalityId)
                && (!filters?.departmentId || item.departmentId === filters.departmentId)
            );
        },
        () => mockItems.filter((item) =>
            (!filters?.functionalityId || item.functionalityId === filters.functionalityId)
            && (!filters?.departmentId || item.departmentId === filters.departmentId)
        )
    ),

    saveItem: (input: ItemInput, id?: number) => requestOrMock(
        () => id
            ? sendData<FunctionalityItem>("put", `/items/${id}`, input)
            : sendData<FunctionalityItem>("post", `/functionalities/${input.functionalityId}/items`, input),
        () => {
            const functionality = mockFunctionalities.find((entry) => entry.id === input.functionalityId);
            const department = mockDepartments.find((entry) => entry.id === input.departmentId);
            const assignment = mockAssignments.find((entry) =>
                entry.functionalityId === input.functionalityId
                && entry.departmentId === input.departmentId
                && entry.isEnabled
            );
            if (!functionality || !department || !assignment) {
                throw new Error("Choose a department enabled for this functionality.");
            }
            if (id) {
                const item = itemForId(id);
                Object.assign(item, input, {
                    functionalityName: functionality.name,
                    departmentName: department.name,
                    itemLabel: assignment.itemLabel,
                });
                updateMockFunctionalityCounts();
                return item;
            }
            const item: FunctionalityItem = {
                ...input,
                id: createMockItemId(),
                functionalityName: functionality.name,
                departmentName: department.name,
                itemLabel: assignment.itemLabel,
                currentRubricVersion: null,
                levelCount: 0,
            };
            mockItems.push(item);
            updateMockFunctionalityCounts();
            return item;
        }
    ),

    setItemActive: (id: number, isActive: boolean) => requestOrMock(
        () => sendData<FunctionalityItem>("put", `/items/${id}`, { isActive }),
        () => {
            const item = itemForId(id);
            item.isActive = isActive;
            return item;
        }
    ),

    getRubrics: (itemId: number) => requestOrMock(
        () => getData<ItemRubric[]>(`/items/${itemId}/rubric`),
        () => mockRubrics.filter((rubric) => rubric.itemId === itemId).sort((a, b) => b.version - a.version)
    ),

    saveRubric: (itemId: number, criteria: RubricCriterion[]) => requestOrMock(
        () => sendData<ItemRubric>("put", `/items/${itemId}/rubric`, { criteria }),
        () => {
            const item = itemForId(itemId);
            const versions = mockRubrics.filter((rubric) => rubric.itemId === itemId);
            const version = Math.max(0, ...versions.map((rubric) => rubric.version)) + 1;
            for (const rubric of versions) rubric.isCurrent = false;
            const rubric: ItemRubric = {
                id: createMockRubricId(),
                itemId,
                version,
                criteria: criteria.map((criterion) => ({ ...criterion })),
                maxPoints: criteria.reduce((sum, criterion) => sum + criterion.maxPoints, 0),
                isCurrent: true,
                createdAt: new Date().toISOString(),
                createdBy: "Super Admin",
            };
            mockRubrics.push(rubric);
            item.currentRubricVersion = version;
            return rubric;
        }
    ),

    getLevels: (itemId: number) => requestOrMock(
        () => getData<ItemLevel[]>(`/items/${itemId}/levels`),
        () => mockLevels.filter((level) => level.itemId === itemId).sort((a, b) => a.levelNo - b.levelNo)
    ),

    saveLevels: (itemId: number, levels: Array<Omit<ItemLevel, "id" | "itemId">>) => requestOrMock(
        () => sendData<ItemLevel[]>("put", `/items/${itemId}/levels`, { levels }),
        () => {
            const item = itemForId(itemId);
            for (let index = mockLevels.length - 1; index >= 0; index -= 1) {
                if (mockLevels[index].itemId === itemId) mockLevels.splice(index, 1);
            }
            const saved = levels.map((level) => ({ ...level, itemId, id: createMockLevelId() }));
            mockLevels.push(...saved);
            item.levelCount = saved.length;
            return saved;
        }
    ),

    getPermissionOptions: () => requestOrMock(
        async () => {
            const [roles, sections, users] = await Promise.all([
                getData<Array<{ roleCode: string; roleName: string }>>("/roles"),
                functionalityManagerService.getSections(),
                functionalityManagerService.getUsers(),
            ]);
            if (mockActive) return mockPermissionOptions;
            return {
                roles: roles.map((role) => ({ id: role.roleCode, label: role.roleName })),
                sections,
                users,
            };
        },
        () => mockPermissionOptions
    ),

    getItemPermissions: (itemId: number) => requestOrMock(
        () => getData<ItemPermissions>(`/items/${itemId}/permissions`),
        () => mockItemPermissions.get(itemId) ?? { roleCodes: [], sectionIds: [], userSuids: [] }
    ),

    savePermissions: (itemId: number, permissions: ItemPermissions) => requestOrMock(
        () => sendData<ItemPermissions>("put", `/items/${itemId}/permissions`, permissions),
        () => {
            itemForId(itemId);
            const saved = {
                roleCodes: [...permissions.roleCodes],
                sectionIds: [...permissions.sectionIds],
                userSuids: [...permissions.userSuids],
            };
            mockItemPermissions.set(itemId, saved);
            return saved;
        }
    ),

    getWidgets: () => requestOrMock(
        () => getData<DashboardWidget[]>("/dashboard/widgets"),
        () => mockWidgets.map((widget) => ({ ...widget, config: { ...widget.config }, roles: [...widget.roles] }))
    ),

    saveWidget: (input: WidgetInput, id?: number) => requestOrMock(
        () => id
            ? sendData<DashboardWidget>("put", `/dashboard/widgets/${id}`, input)
            : sendData<DashboardWidget>("post", "/dashboard/widgets", input),
        () => {
            const functionality = mockFunctionalities.find((entry) => entry.id === input.functionalityId);
            const item = mockItems.find((entry) => entry.id === input.itemId);
            if (!functionality) throw new Error("Choose a functionality.");
            if (id !== undefined && !mockWidgets.some((entry) => entry.id === id)) {
                throw new Error("Widget was not found.");
            }
            const widget: DashboardWidget = {
                ...input,
                id: id ?? createMockWidgetId(),
                functionalityName: functionality.name,
                itemName: item?.name ?? null,
            };
            const existingIndex = mockWidgets.findIndex((entry) => entry.id === widget.id);
            if (existingIndex >= 0) mockWidgets.splice(existingIndex, 1, widget);
            else mockWidgets.push(widget);
            return widget;
        }
    ),

    deleteWidget: (id: number) => requestOrMock(
        async () => {
            await sendData("delete", `/dashboard/widgets/${id}`);
            return true;
        },
        () => {
            const index = mockWidgets.findIndex((widget) => widget.id === id);
            if (index >= 0) mockWidgets.splice(index, 1);
            return true;
        }
    ),

    getEnrollment: (itemId: number) => requestOrMock(
        () => getData<EnrollmentStudent[]>(`/items/${itemId}/enroll`),
        () => {
            const item = itemForId(itemId);
            const enrolledIds = mockEnrollmentByItem.get(itemId) ?? new Set<number>();
            return mockStudents
                .filter((student) => student.departmentId === item.departmentId)
                .map((student) => ({ ...student, enrolled: enrolledIds.has(student.suid) }));
        }
    ),

    updateEnrollment: (itemId: number, studentSuids: number[], enrolled: boolean) => requestOrMock(
        () => sendData<EnrollmentStudent[]>("post", `/items/${itemId}/enroll`, { studentSuids, enrolled }),
        () => {
            const item = itemForId(itemId);
            const enrolledIds = mockEnrollmentByItem.get(itemId) ?? new Set<number>();
            for (const studentSuid of studentSuids) {
                const student = mockStudents.find((entry) => entry.suid === studentSuid && entry.departmentId === item.departmentId);
                if (!student) continue;
                if (enrolled) enrolledIds.add(studentSuid);
                else enrolledIds.delete(studentSuid);
            }
            mockEnrollmentByItem.set(itemId, enrolledIds);
            return mockStudents
                .filter((student) => student.departmentId === item.departmentId)
                .map((student) => ({ ...student, enrolled: enrolledIds.has(student.suid) }));
        }
    ),
};

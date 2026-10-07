import { createElement, type ReactNode } from "react";
import { IoCreateOutline } from "react-icons/io5";
import { CiCircleList } from "react-icons/ci";
import { RiEditBoxLine } from "react-icons/ri";
import { RxActivityLog } from "react-icons/rx";
import { MdOutlineEvent } from "react-icons/md";
import { SiGoogledataproc, SiGoogleearth } from "react-icons/si";
import type { PermissionAction } from "./PermitionValidetor";

export interface MenuItem {
    name: string;
    path: string;
    icon: ReactNode;
}

type HasAccessFn = (module: string, action: PermissionAction) => boolean;

export function getDepartmentItems(hasAccess: HasAccessFn): MenuItem[] {
    const items: MenuItem[] = [];
    if (hasAccess("Department", "create")) {
        items.push({ name: "Create Departments", path: "/dashboard/departments/create", icon: createElement(IoCreateOutline) });
    }
    if (hasAccess("Department", "view")) {
        items.push({ name: "Departments List", path: "/dashboard/departments/list", icon: createElement(CiCircleList) });
    }
    return items;
}

export function getUserItems(hasAccess: HasAccessFn): MenuItem[] {
    const items: MenuItem[] = [];
    if (hasAccess("Users", "create")) {
        items.push({ name: "Create User", path: "/dashboard/users/create", icon: createElement(IoCreateOutline) });
    }
    if (hasAccess("Users", "view")) {
        items.push({ name: "User List", path: "/dashboard/users/list", icon: createElement(CiCircleList) });
    }
    return items;
}

export function getWebsiteItems(hasAccess: HasAccessFn): MenuItem[] {
    const items: MenuItem[] = [];
    if (hasAccess("OverviewEdit", "view")) {
        items.push({ name: "Overview", path: "/dashboard/overview-management", icon: createElement(RiEditBoxLine) });
    }
    if (hasAccess("OverviewEdit", "view") || hasAccess("Activities", "view")) {
        items.push({ name: "Activities", path: "/dashboard/overview-management/activities", icon: createElement(RxActivityLog) });
    }
    if (hasAccess("OverviewEdit", "view") || hasAccess("UpcomingEvents", "view")) {
        items.push({ name: "Upcoming Events", path: "/dashboard/overview-management/events", icon: createElement(MdOutlineEvent) });
    }
    if (hasAccess("AmrutNuAachaman", "create") || hasAccess("AmrutNuAachaman", "view")) {
        items.push({ name: "Amrut Nu Aachaman", path: "/dashboard/overview-management/amrut-nu-aachaman", icon: createElement(SiGoogledataproc) });
    }
    if (hasAccess("DailyDarshan", "create") || hasAccess("DailyDarshan", "view")) {
        items.push({ name: "Daily Darshan", path: "/dashboard/overview-management/daily-darshan", icon: createElement(SiGoogleearth) });
    }
    return items;
}

export function getSectionItems(hasAccess: HasAccessFn): MenuItem[] {
    const items: MenuItem[] = [];
    if (hasAccess("Section", "create")) {
        items.push({ name: "Create Section", path: "/dashboard/sections/create", icon: createElement(IoCreateOutline) });
    }
    if (hasAccess("Section", "view")) {
        items.push({ name: "Section List", path: "/dashboard/sections/list", icon: createElement(CiCircleList) });
    }
    return items;
}

export function getRoleItems(hasAccess: HasAccessFn): MenuItem[] {
    const items: MenuItem[] = [];
    if (hasAccess("RolesPermissions", "create")) {
        items.push({ name: "Create Role", path: "/dashboard/permissions/role", icon: createElement(IoCreateOutline) });
    }
    if (hasAccess("RolesPermissions", "view")) {
        items.push({ name: "Role List", path: "/dashboard/permissions/lesson", icon: createElement(CiCircleList) });
    }
    return items;
}

export function getLessonItems(hasAccess: HasAccessFn): MenuItem[] {
    const items: MenuItem[] = [];
    if (hasAccess("Lesson", "create")) {
        items.push({ name: "Create Lesson", path: "/dashboard/lessons/create", icon: createElement(IoCreateOutline) });
    }
    if (hasAccess("Lesson", "view")) {
        items.push({ name: "Lesson List", path: "/dashboard/lessons/list", icon: createElement(CiCircleList) });
    }
    return items;
}

export function getGroupItems(hasAccess: HasAccessFn): MenuItem[] {
    const items: MenuItem[] = [];
    if (hasAccess("Group", "create")) {
        items.push({ name: "Create Group", path: "/dashboard/groups/create", icon: createElement(IoCreateOutline) });
    }
    if (hasAccess("Group", "view")) {
        items.push({ name: "Group List", path: "/dashboard/groups/list", icon: createElement(CiCircleList) });
    }
    return items;
}

/** Section drilldown ma student create/list items (department + section context sathe) */
export function getStudentSectionItems(
    hasAccess: HasAccessFn,
    departmentId: number,
    sectionId: number
): MenuItem[] {
    const items: MenuItem[] = [];
    if (hasAccess("Student", "create")) {
        items.push({
            name: "Create Student",
            path: `/dashboard/departments/${departmentId}/sections/${sectionId}/create-student`,
            icon: createElement(IoCreateOutline),
        });
    }
    if (hasAccess("Student", "view")) {
        items.push({
            name: "Student List",
            path: `/dashboard/departments/${departmentId}/sections/${sectionId}/student-list`,
            icon: createElement(CiCircleList),
        });
    }
    return items;
}
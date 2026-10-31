import React from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Layout from "../pages/Layout/Layout";
import Overview from "../pages/Overview/Overview";
import Login from "../auth/login";
import Dashboard from "../pages/Dashboard";

import AmrutAachaman from "../pages/Overview/Amrut-Nu-Aachaman";
import DailyDarshanPage from "../pages/Overview/Daily-Darshan";
import ActivitiesPage from "../pages/Overview/ActivitiesPage";
import UpcomingEventsPage from "../pages/Overview/UpcomingEventsPage";

import CreateUserForm from "../pages/Section/Users-Managemant/Create-user-form";
import UserList from "../pages/Section/Users-Managemant/User-list";

import CreateDepartment from "../pages/Section/Department-Management/Create-Department";
import DepartmentList from "../pages/Section/Department-Management/Department-List";
import DepartmentView from "../pages/Section/Department-Management/core/View";
import CreateStudent from "../pages/Section/Department-Management/Create-Student";
import StudentListPage from "../pages/Section/Department-Management/StudentListPage";

import CreateSection from "../pages/Section/Section-Managemant/Section-Create";
import SectionList from "../pages/Section/Section-Managemant/Section-list";

import CreateRole from "../pages/Section/Role-managemant/Create-Role";
import RoleList from "../pages/Section/Role-managemant/RoleList";

import Profile from "../pages/Profile";
import ProfileSetting from "../pages/Profile-Setting";
import type { AuthUser } from "../Types/Role-create";

import OverviewManagement from "../pages/Section/Overview-Management/Overview-Management";
import AdminAmrutNuAachaman from "../pages/Section/Overview-Management/Amrut-Nu-Aachaman";
import AdminDailyDarshan from "../pages/Section/Overview-Management/Daily-Darshan";
import Permission from "../pages/Section/Permissions-Managemant/Permission";

import Activities from "../pages/Section/Overview-Management/Activities";
import UpcomingEvents from "../pages/Section/Overview-Management/Upcoming-Events";

import ProgressDashboard from "../pages/Section/ProgressDashboard";

import CreateLesson from "../pages/Section/Lesson-management/create-lesson";
import LessonList from "../pages/Section/Lesson-management/Lesson-list";
import MyLessons from "../pages/Section/Lesson-management/My-Lessons";

import CreateGroup from "../pages/Section/Group-Managemant/Create-Group";
import GroupList from "../pages/Section/Group-Managemant/Group-List";

import GroupMemberDetail from "../pages/Section/Group-Managemant/Groupmemberdetail";

interface ProtectedRouteProps {
  module?: string;
  action?: "view" | "create" | "edit" | "delete";
  requireLoginOnly?: boolean;
}

const getStoredUser = (): AuthUser | null => {
  const userString = localStorage.getItem("user");
  if (!userString) return null;
  try {
    return JSON.parse(userString) as AuthUser;
  } catch {
    return null;
  }
};

const isAuthenticated = (): boolean => {
  return getStoredUser() !== null;
};

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  module,
  action = "view",
  requireLoginOnly = false,
}) => {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireLoginOnly) {
    return <Outlet />;
  }

  let permissions = user.permissions;
  if (typeof permissions === "string") {
    try {
      permissions = JSON.parse(permissions);
    } catch {
      permissions = {};
    }
  }

  const hasPermission =
    user.roleCode === "SUPER_ADMIN" || permissions?.[module || ""]?.[action];

  if (!hasPermission) {
    return <Navigate to="/dashboard/unauthorized" replace />;
  }

  return <Outlet />;
};

const UnauthorizedView = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
    <h1 className="text-5xl font-black text-red-500 tracking-wide animate-bounce">
      403
    </h1>
    <h2 className="text-xl font-bold text-gray-700 mt-2 dark:text-gray-300">
      Access Denied!
    </h2>
    <p className="text-sm text-gray-400 mt-1 max-w-sm">
      You do not have permission to view this page. Please contact your administrator if you believe this is an error.
    </p>
  </div>
);

export default function Routers() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        <Route path="/" element={<Overview />} />
        <Route path="/amrut-aachaman" element={<AmrutAachaman />} />
        <Route path="/daily-darshan" element={<DailyDarshanPage />} />
        <Route path="/events" element={<UpcomingEventsPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="unauthorized" element={<UnauthorizedView />} />

          <Route element={<ProtectedRoute module="Users" action="create" />}>
            <Route path="users/create" element={<CreateUserForm />} />
          </Route>
          <Route element={<ProtectedRoute module="Users" action="view" />}>
            <Route path="users/list" element={<UserList />} />
          </Route>

          <Route element={<ProtectedRoute module="Department" action="create" />}>
            <Route path="departments/create" element={<CreateDepartment />} />
          </Route>
          <Route element={<ProtectedRoute module="Department" action="view" />}>
            <Route path="departments/view/:departmentId" element={<DepartmentView />} />
          </Route>
          <Route element={<ProtectedRoute module="Department" action="edit" />}>
            <Route path="departments/edit/:departmentId" element={<CreateDepartment />} />
          </Route>
          <Route element={<ProtectedRoute module="Department" action="view" />}>
            <Route path="departments/list" element={<DepartmentList />} />
          </Route>

          <Route element={<ProtectedRoute module="Student" action="create" />}>
            <Route path="departments/:deptId/sections/:sectionId/create-student" element={<CreateStudent />} />
          </Route>
          <Route element={<ProtectedRoute module="Student" action="view" />}>
            <Route path="departments/:deptId/sections/:sectionId/student-list" element={<StudentListPage />} />
          </Route>

          <Route element={<ProtectedRoute module="Section" action="create" />}>
            <Route path="sections/create" element={<CreateSection />} />
          </Route>
          <Route element={<ProtectedRoute module="Section" action="edit" />}>
            <Route path="sections/edit/:sectionId" element={<CreateSection />} />
          </Route>
          <Route element={<ProtectedRoute module="Section" action="view" />}>
            <Route path="sections/list" element={<SectionList />} />
          </Route>

          <Route path="permissions/messages" element={<Permission />} />

          <Route element={<ProtectedRoute module="RolesPermissions" action="create" />}>
            <Route path="permissions/role" element={<CreateRole />} />
          </Route>
          <Route element={<ProtectedRoute module="RolesPermissions" action="edit" />}>
            <Route path="permissions/role/edit/:roleCode" element={<CreateRole />} />
          </Route>
          <Route element={<ProtectedRoute module="RolesPermissions" action="view" />}>
            <Route path="permissions/lesson" element={<RoleList />} />
          </Route>

          <Route element={<ProtectedRoute module="Lesson" action="create" />}>
            <Route path="lessons/create" element={<CreateLesson />} />
          </Route>
          <Route element={<ProtectedRoute module="Lesson" action="view" />}>
            <Route path="lessons/list" element={<LessonList />} />
          </Route>
          <Route element={<ProtectedRoute module="MyLessons" action="view" />}>
            <Route path="lessons/my-lessons" element={<MyLessons />} />
          </Route>

          <Route element={<ProtectedRoute module="Group" action="create" />}>
            <Route path="groups/create" element={<CreateGroup />} />
          </Route>
          <Route element={<ProtectedRoute module="Group" action="view" />}>
            <Route path="groups/list" element={<GroupList />} />
          </Route>
          <Route element={<ProtectedRoute module="Group" action="view" />}>
            <Route path="groups/edit/:groupId" element={<CreateGroup />} />
          </Route>

          <Route element={<ProtectedRoute requireLoginOnly />}>
            <Route path="groups/member/:groupId" element={<GroupMemberDetail />} />
          </Route>

          <Route element={<ProtectedRoute requireLoginOnly />}>
            <Route path="profile" element={<Profile />} />
            <Route path="settings/profile" element={<ProfileSetting />} />
          </Route>

          <Route element={<ProtectedRoute module="Progress" action="view" />}>
            <Route path="progress" element={<ProgressDashboard />} />
          </Route>

          <Route element={<ProtectedRoute module="OverviewEdit" action="view" />}>
            <Route path="overview-management" element={<OverviewManagement />} />
          </Route>
          <Route element={<ProtectedRoute module="AmrutNuAachaman" action="view" />}>
            <Route path="overview-management/amrut-nu-aachaman" element={<AdminAmrutNuAachaman />} />
          </Route>
          <Route element={<ProtectedRoute module="DailyDarshan" action="view" />}>
            <Route path="overview-management/daily-darshan" element={<AdminDailyDarshan />} />
          </Route>
          <Route element={<ProtectedRoute module="OverviewEdit" action="view" />}>
            <Route path="overview-management/activities" element={<Activities />} />
          </Route>
          <Route element={<ProtectedRoute module="OverviewEdit" action="view" />}>
            <Route path="overview-management/events" element={<UpcomingEvents />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}
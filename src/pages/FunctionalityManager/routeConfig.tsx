import { lazy } from "react";
import { Navigate, type RouteObject } from "react-router-dom";
import FunctionalityManagerGuard from "./FunctionalityManagerGuard";
import FunctionalityManagerLayout from "./FunctionalityManagerLayout";
import LegacyItemEditorRedirect from "./components/LegacyItemEditorRedirect";

const EnrollmentPage = lazy(() => import("./pages/EnrollmentPage"));
const FunctionalitiesPage = lazy(() => import("./pages/FunctionalitiesPage"));
const FunctionalityDepartmentsPage = lazy(() => import("./pages/FunctionalityDepartmentsPage"));
const ItemsPage = lazy(() => import("./pages/ItemsPage"));
const LevelsPage = lazy(() => import("./pages/LevelsPage"));
const LevelsHomePage = lazy(() => import("./pages/LevelsHomePage"));
const PermissionsPage = lazy(() => import("./pages/PermissionsPage"));
const PermissionsHomePage = lazy(() => import("./pages/PermissionsHomePage"));
const RubricPage = lazy(() => import("./pages/RubricPage"));
const RubricsHomePage = lazy(() => import("./pages/RubricsHomePage"));
const WidgetsPage = lazy(() => import("./pages/WidgetsPage"));

export const functionalityManagerRoutes: RouteObject[] = [
    {
        element: <FunctionalityManagerGuard />,
        children: [
            { index: true, element: <Navigate to="functionalities" replace /> },
            {
                element: <FunctionalityManagerLayout />,
                children: [
                    { path: "functionalities", element: <FunctionalitiesPage /> },
                    { path: "functionalities/:id/departments", element: <FunctionalityDepartmentsPage /> },
                    { path: "items", element: <ItemsPage /> },
                    { path: "rubrics", element: <RubricsHomePage /> },
                    { path: "rubrics/:itemId", element: <RubricPage /> },
                    { path: "levels", element: <LevelsHomePage /> },
                    { path: "levels/:itemId", element: <LevelsPage /> },
                    { path: "permissions", element: <PermissionsHomePage /> },
                    { path: "permissions/:itemId", element: <PermissionsPage /> },
                    { path: "items/:itemId/rubric", element: <LegacyItemEditorRedirect section="rubrics" /> },
                    { path: "items/:itemId/levels", element: <LegacyItemEditorRedirect section="levels" /> },
                    { path: "items/:itemId/permissions", element: <LegacyItemEditorRedirect section="permissions" /> },
                    { path: "widgets", element: <WidgetsPage /> },
                    { path: "enrollment", element: <EnrollmentPage /> },
                ],
            },
        ],
    },
];

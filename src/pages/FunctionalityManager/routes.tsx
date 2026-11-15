import { useRoutes } from "react-router-dom";
import { functionalityManagerRoutes } from "./routeConfig";

export function FunctionalityManagerRouteTree() {
    return useRoutes(functionalityManagerRoutes);
}

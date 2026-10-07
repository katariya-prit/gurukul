import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface SidebarViewContextType {
    activeDepartmentId: number | null;
    activeDepartmentName: string | null;
    setActiveDepartment: (id: number | null, name: string | null) => void;
}

const SidebarViewContext = createContext<SidebarViewContextType | undefined>(undefined);

const STORAGE_KEY_ID = "sidebar_active_department_id";
const STORAGE_KEY_NAME = "sidebar_active_department_name";

export function SidebarViewProvider({ children }: { children: ReactNode }) {
    const [activeDepartmentId, setActiveDepartmentId] = useState<number | null>(() => {
        const stored = localStorage.getItem(STORAGE_KEY_ID);
        return stored ? Number(stored) : null;
    });

    const [activeDepartmentName, setActiveDepartmentName] = useState<string | null>(() => {
        return localStorage.getItem(STORAGE_KEY_NAME);
    });

    useEffect(() => {
        if (activeDepartmentId !== null) {
            localStorage.setItem(STORAGE_KEY_ID, String(activeDepartmentId));
        } else {
            localStorage.removeItem(STORAGE_KEY_ID);
        }
    }, [activeDepartmentId]);

    useEffect(() => {
        if (activeDepartmentName !== null) {
            localStorage.setItem(STORAGE_KEY_NAME, activeDepartmentName);
        } else {
            localStorage.removeItem(STORAGE_KEY_NAME);
        }
    }, [activeDepartmentName]);

    const setActiveDepartment = (id: number | null, name: string | null) => {
        setActiveDepartmentId(id);
        setActiveDepartmentName(name);
    };

    return (
        <SidebarViewContext.Provider value={{ activeDepartmentId, activeDepartmentName, setActiveDepartment }}>
            {children}
        </SidebarViewContext.Provider>
    );
}

export function useSidebarView() {
    const context = useContext(SidebarViewContext);
    if (!context) {
        throw new Error("useSidebarView must be used within a SidebarViewProvider");
    }
    return context;
}
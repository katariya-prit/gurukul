// Types/User-create.ts
export type UserCreate = {
    suid: number;
    avatar: string;
    name: string;
    username: string;
    password: string;
    bod: string;
    departmentId: number | null; // 🎯 FIX: null pan allow karyu (HEAD100 sivay departmentId null jay chhe)
    sectionId: number | null;
    standardId: number;
    // roleId: number;   👈 REMOVED - backend ma aa field exist j nathi karto (roleCode j primary key chhe)
    roleCode: string;
    joiningDate: string;
    status?: "PENDING" | "APPROVED"; // optional status
};
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { StudentFormData } from "../../Types/Student";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

const getFirstValidSectionId = async (departmentId: number): Promise<number> => {
    try {
        const res = await fetch(`${API_URL}/sections`);
        const result = await res.json();
        const sectionList = Array.isArray(result) ? result : result?.data || [];

        const match = sectionList.find(
            (s: any) => Number(s.departmentId) === Number(departmentId)
        );

        return match ? Number(match.sectionId) : 0; 
    } catch (error) {
        console.error("Error fetching sections:", error);
        return 0;
    }
};

export const studentService = {
    async createStudent(data: StudentFormData, _profileImage: File | null, departmentId: number) {
        
        const sectionId = await getFirstValidSectionId(departmentId);
        
        const payload = {
            suid: Number(data.suid),
            avatar: "",
            name: data.fullName,
            username: data.username,
            password: data.password,
            bod: data.birthdate,
            departmentId: Number(departmentId),
            sectionId: sectionId,
            standardId: 1,
            roleCode: "USER",             
            joiningDate: data.joiningDate,
        };

        console.log("Sending Payload to Backend:", payload);

        const response = await fetch(`${API_URL}/users/register`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify(payload),
        });

        const result = await response.json().catch(() => ({}));

        // 4. એરર હેન્ડલિંગ
        if (!response.ok) {
            console.error("Backend Error Response:", result);
            throw new Error(result.message || "Student creation failed. Check console for details.");
        }
        
        return result;
    },
};
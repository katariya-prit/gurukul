import { useCallback, useEffect, useState } from "react";
import { functionalityManagerService } from "../services/functionalityManagerService";
import type { EnrollmentStudent } from "../types";

export function useEnrollment(itemId: number | null) {
    const [students, setStudents] = useState<EnrollmentStudent[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        if (itemId === null) {
            setStudents([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            setStudents(await functionalityManagerService.getEnrollment(itemId));
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Could not load student enrollment.");
        } finally {
            setLoading(false);
        }
    }, [itemId]);

    useEffect(() => {
        void reload();
    }, [reload]);

    const update = async (studentSuids: number[], enrolled: boolean) => {
        if (itemId === null) return;
        const previous = students;
        setStudents((current) => current.map((student) =>
            studentSuids.includes(student.suid) ? { ...student, enrolled } : student
        ));
        setSaving(true);
        try {
            setStudents(await functionalityManagerService.updateEnrollment(itemId, studentSuids, enrolled));
        } catch (saveError) {
            setStudents(previous);
            throw saveError;
        } finally {
            setSaving(false);
        }
    };

    return { students, loading, saving, error, reload, update };
}

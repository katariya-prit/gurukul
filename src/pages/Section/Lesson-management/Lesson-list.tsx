import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTheme } from "../../../components/theme/ThemeContext";
import Button from "../../../components/common/Button";
import AudioLessonCard from "../../../components/material/AudioLessonCard";
import BasicLessonCard from "../../../components/material/BasicLessonCard";
import {
  extractLessonList,
  normalizeLesson,
  type LessonCardData,
} from "../../../components/material/lessonCard.utils";
import { lessonService } from "../../../services/lessonService";

export default function LessonList() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<LessonCardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadLessons = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await lessonService.getCreatedLessons();
      setLessons(extractLessonList(result).map(normalizeLesson));
    } catch (error: any) {
      setLessons([]);
      toast.error(error?.message || "Failed to load lessons");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLessons();
  }, [loadLessons]);

  const handleDelete = async (lesson: LessonCardData) => {
    if (!window.confirm(`Delete "${lesson.title}"?`)) return;

    try {
      setDeletingId(lesson.id);
      await lessonService.deleteLesson(lesson.id);
      toast.success("Lesson deleted");
      setLessons((prev) => prev.filter((item) => item.id !== lesson.id));
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete lesson");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={`max-w-6xl mx-auto p-6 sm:p-8 rounded-2xl shadow-sm mt-6 border transition-all duration-200 ${theme ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-neutral-200 text-neutral-900"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${theme ? "text-blue-400" : "text-red-600"}`}>
            Lesson Management
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold mt-2">Lesson List</h2>
          {!isLoading && lessons.length > 0 && (
            <p className={`mt-1 text-sm ${theme ? "text-gray-400" : "text-neutral-500"}`}>
              {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
            </p>
          )}
        </div>

        <Button onClick={() => navigate("/dashboard/lessons/create")} className="!px-5">
          Create Lesson
        </Button>
      </div>

      {isLoading ? (
        <div className={`mt-8 rounded-2xl border p-8 text-center text-sm ${theme ? "border-gray-800 bg-gray-800/40 text-gray-400" : "border-neutral-200 bg-neutral-50 text-neutral-500"}`}>
          Loading lessons...
        </div>
      ) : lessons.length === 0 ? (
        <div className={`mt-8 rounded-2xl border p-8 text-center ${theme ? "border-gray-800 bg-gray-800/40" : "border-neutral-200 bg-neutral-50"}`}>
          <p className={`text-lg font-medium ${theme ? "text-gray-300" : "text-neutral-700"}`}>
            No lessons found
          </p>
          <p className={`mt-2 text-sm ${theme ? "text-gray-400" : "text-neutral-500"}`}>
            Lessons you create will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {lessons.map((lesson) =>
            lesson.type === "audio" ? (
              <AudioLessonCard
                key={lesson.id}
                lesson={lesson}
                onDelete={(item) => void handleDelete(item)}
                isDeleting={deletingId === lesson.id}
              />
            ) : (
              <BasicLessonCard
                key={lesson.id}
                lesson={lesson}
                onDelete={(item) => void handleDelete(item)}
                isDeleting={deletingId === lesson.id}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
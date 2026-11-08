import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTheme } from "../../../components/theme/ThemeContext";
import Button from "../../../components/common/Button";
import AudioLessonCard from "../../../components/material/AudioLessonCard";
import BasicLessonCard from "../../../components/material/BasicLessonCard";
import DocumentLessonCard from "../../../components/material/DocumentLessonCard";
import ImageLessonCard from "../../../components/material/ImageLessonCard";
import LessonSubmissionsPanel from "../../../components/material/LessonSubmissionsPanel";
import VideoLessonCard from "../../../components/material/Videolessoncard";
import {
  extractLessonList,
  normalizeLesson,
  type LessonCardData,
} from "../../../components/material/lessonCard.utils";
import type { AuthUser } from "../../../Types/Role-create";
import { hasAccess } from "../../../components/sidebar/core/PermitionValidetor";
import { lessonService } from "../../../services/lessonService";
import { useConfirm } from "../../../components/overlay/useConfirm";

export default function LessonList() {
  const { theme } = useTheme();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<LessonCardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const storedUser = localStorage.getItem("user");
  let currentUser: AuthUser | null = null;
  if (storedUser) {
    try {
      currentUser = JSON.parse(storedUser) as AuthUser;
    } catch {
      currentUser = null;
    }
  }
  const currentUserId = String(currentUser?.suid ?? currentUser?.id ?? "");

  const canDeleteLesson = (lesson: LessonCardData) =>
    currentUser?.roleCode === "SUPER_ADMIN" || lesson.createdBy === currentUserId;
  const canCreateLesson = hasAccess(currentUser, "Lesson", "create", true);

  const loadLessons = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await lessonService.getCreatedLessons();
      setLessons(extractLessonList(result).map(normalizeLesson));
    } catch (error: unknown) {
      setLessons([]);
      toast.error(error instanceof Error ? error.message : "Failed to load lessons");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLessons();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadLessons]);

  const handleDelete = async (lesson: LessonCardData) => {
    if (!(await confirm({
      title: "Delete lesson?",
      message: `Delete "${lesson.title}"?`,
      destructive: true,
    }))) return;

    try {
      setDeletingId(lesson.id);
      await lessonService.deleteLesson(lesson.id);
      toast.success("Lesson deleted");
      setLessons((prev) => prev.filter((item) => item.id !== lesson.id));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to delete lesson");
    } finally {
      setDeletingId(null);
    }
  };

  const renderLessonCard = (lesson: LessonCardData) => {
    const cardProps = {
      lesson,
      onDelete: canDeleteLesson(lesson) ? (item: LessonCardData) => void handleDelete(item) : undefined,
      isDeleting: deletingId === lesson.id,
      actions: <LessonSubmissionsPanel lesson={lesson} />,
    };

    switch (lesson.type) {
      case "audio":
        return <AudioLessonCard key={lesson.id} {...cardProps} />;
      case "image":
        return <ImageLessonCard key={lesson.id} {...cardProps} />;
      case "video":
        return <VideoLessonCard key={lesson.id} {...cardProps} />;
      case "document":
        return <DocumentLessonCard key={lesson.id} {...cardProps} />;
      default:
        return <BasicLessonCard key={lesson.id} {...cardProps} />;
    }
  };

  return (
    <div className={`max-w-full mx-auto p-6 sm:p-8 rounded-2xl shadow-sm mt-6 border transition-all duration-200 ${theme ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-neutral-200 text-neutral-900"}`}>
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

        {canCreateLesson && (
          <Button onClick={() => navigate("/dashboard/lessons/create")} className="px-5!">
            Create Lesson
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading lessons">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className={`animate-pulse overflow-hidden rounded-3xl border ${theme ? "border-white/10 bg-white/5" : "border-neutral-200 bg-white"}`}
            >
              <div className={`aspect-video ${theme ? "bg-white/10" : "bg-neutral-100"}`} />
              <div className="space-y-3 p-5">
                <div className={`h-5 w-3/4 rounded ${theme ? "bg-white/10" : "bg-neutral-200"}`} />
                <div className={`h-3 w-full rounded ${theme ? "bg-white/10" : "bg-neutral-100"}`} />
                <div className={`h-3 w-2/3 rounded ${theme ? "bg-white/10" : "bg-neutral-100"}`} />
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {["start", "end", "points"].map((item) => (
                    <div key={item} className={`h-8 rounded ${theme ? "bg-white/10" : "bg-neutral-100"}`} />
                  ))}
                </div>
              </div>
            </div>
          ))}
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
          {lessons.map(renderLessonCard)}
        </div>
      )}
    </div>
  );
}
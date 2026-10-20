import { useEffect, useMemo, useState } from "react";
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

type TypeFilter = "all" | "audio" | "video" | "image" | "document";

const FILTERS: { key: TypeFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "audio", label: "Audio" },
  { key: "video", label: "Video" },
  { key: "image", label: "Image" },
  { key: "document", label: "Document" },
];

export default function MyLessons() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<LessonCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<TypeFilter>("all");

  useEffect(() => {
    const fetchMyLessons = async () => {
      try {
        setLoading(true);
        const response = await lessonService.getMyLessons();
        setLessons(extractLessonList(response).map(normalizeLesson));
      } catch (error: any) {
        toast.error(error?.message || "Unable to load your lessons");
        setLessons([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchMyLessons();
  }, []);

  const counts = useMemo(() => {
    const result: Record<TypeFilter, number> = { all: lessons.length, audio: 0, video: 0, image: 0, document: 0 };
    lessons.forEach((lesson) => {
      if (lesson.type in result) result[lesson.type as TypeFilter] += 1;
    });
    return result;
  }, [lessons]);

  const visibleLessons = useMemo(
    () => (filter === "all" ? lessons : lessons.filter((lesson) => lesson.type === filter)),
    [lessons, filter]
  );

  const chipClass = (key: TypeFilter) =>
    `inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${filter === key
      ? theme
        ? "bg-blue-500/20 text-blue-200"
        : "bg-red-500/10 text-red-600"
      : theme
        ? "text-gray-400 hover:bg-gray-800"
        : "text-neutral-500 hover:bg-neutral-100"
    }`;

  const mutedText = theme ? "text-gray-400" : "text-neutral-500";

  return (
    <div className={`mx-auto max-w-6xl rounded-2xl border p-6 shadow-sm transition-all duration-200 sm:p-8 ${theme ? "border-gray-800 bg-gray-900 text-white" : "border-neutral-200 bg-white text-neutral-900"}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${theme ? "text-blue-400" : "text-red-600"}`}>
            My Workspace
          </p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">My Lessons</h2>
          {!loading && lessons.length > 0 && (
            <p className={`mt-1 text-sm ${mutedText}`}>
              {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"} assigned to you
            </p>
          )}
        </div>

        <Button onClick={() => navigate("/dashboard/lessons/create")} className="!px-5">
          Create Lesson
        </Button>
      </div>

      {!loading && lessons.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map(({ key, label }) => (
            <button key={key} type="button" className={chipClass(key)} onClick={() => setFilter(key)}>
              {label}
              <span className={`text-xs tabular-nums ${filter === key ? "opacity-80" : "opacity-60"}`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className={`animate-pulse overflow-hidden rounded-3xl border ${theme ? "border-white/10 bg-white/5" : "border-neutral-200 bg-neutral-50"}`}
            >
              <div className={`aspect-video w-full ${theme ? "bg-white/10" : "bg-neutral-200"}`} />
              <div className="space-y-3 p-5">
                <div className={`h-4 w-2/3 rounded ${theme ? "bg-white/10" : "bg-neutral-200"}`} />
                <div className={`h-3 w-full rounded ${theme ? "bg-white/10" : "bg-neutral-200"}`} />
                <div className={`h-12 w-full rounded-2xl ${theme ? "bg-white/10" : "bg-neutral-200"}`} />
              </div>
            </div>
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <div className={`mt-8 rounded-2xl border p-8 text-center ${theme ? "border-gray-800 bg-gray-800/40" : "border-neutral-200 bg-neutral-50"}`}>
          <p className={`text-lg font-medium ${theme ? "text-gray-300" : "text-neutral-700"}`}>
            No lessons assigned to you yet.
          </p>
          <p className={`mt-2 text-sm ${mutedText}`}>
            Lessons assigned to you will appear here automatically.
          </p>
        </div>
      ) : visibleLessons.length === 0 ? (
        <div className={`mt-8 rounded-2xl border p-8 text-center ${theme ? "border-gray-800 bg-gray-800/40" : "border-neutral-200 bg-neutral-50"}`}>
          <p className={`text-lg font-medium ${theme ? "text-gray-300" : "text-neutral-700"}`}>
            No {filter} lessons found.
          </p>
          <p className={`mt-2 text-sm ${mutedText}`}>Try another filter to see your other lessons.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visibleLessons.map((lesson) =>
            lesson.type === "audio" ? (
              <AudioLessonCard key={lesson.id} lesson={lesson} />
            ) : (
              <BasicLessonCard key={lesson.id} lesson={lesson} />
            )
          )}
        </div>
      )}
    </div>
  );
}
import { useTheme } from "../theme/ThemeContext";
import type { LessonCardData } from "./Lessoncard.types";

interface BasicLessonCardProps {
  lesson: LessonCardData;
  onDelete?: (lesson: LessonCardData) => void;
  isDeleting?: boolean;
}

export default function BasicLessonCard({ lesson, onDelete, isDeleting = false }: BasicLessonCardProps) {
  const { theme } = useTheme();
  const mutedText = theme ? "text-gray-400" : "text-neutral-500";
  const strongText = theme ? "text-gray-200" : "text-neutral-800";

  return (
    <article
      className={`flex flex-col rounded-3xl border p-5 shadow-sm ${theme ? "border-white/10 bg-white/5 backdrop-blur-xl" : "border-neutral-200 bg-white"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold leading-snug">{lesson.title}</h3>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize ${theme ? "bg-blue-500/10 text-blue-300" : "bg-red-500/10 text-red-600"}`}
        >
          {lesson.type || "lesson"}
        </span>
      </div>

      {lesson.description && (
        <p className={`mt-2 line-clamp-3 text-sm ${mutedText}`}>{lesson.description}</p>
      )}

      <dl className={`mt-4 grid grid-cols-3 gap-3 text-xs ${mutedText}`}>
        <div>
          <dt className="font-semibold uppercase tracking-wider">Start</dt>
          <dd className={`mt-1 text-sm ${strongText}`}>{lesson.startDate}</dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wider">End</dt>
          <dd className={`mt-1 text-sm ${strongText}`}>{lesson.endDate}</dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wider">Points</dt>
          <dd className={`mt-1 text-sm ${strongText}`}>{lesson.points ?? "-"}</dd>
        </div>
      </dl>

      {onDelete && (
        <div className="mt-auto flex justify-end pt-4">
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => onDelete(lesson)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${theme ? "border-red-500/40 text-red-300 hover:bg-red-500/10" : "border-red-300 text-red-600 hover:bg-red-50"}`}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      )}
    </article>
  );
}
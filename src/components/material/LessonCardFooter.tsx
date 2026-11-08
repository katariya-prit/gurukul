import type { ReactNode } from "react";
import { useTheme } from "../theme/ThemeContext";
import type { LessonCardData } from "./lessonCard.types";

interface LessonCardFooterProps {
  lesson: LessonCardData;
  onDelete?: (lesson: LessonCardData) => void;
  isDeleting?: boolean;
  actions?: ReactNode;
}

export default function LessonCardFooter({
  lesson,
  onDelete,
  isDeleting = false,
  actions,
}: LessonCardFooterProps) {
  const { theme } = useTheme();
  const mutedText = theme ? "text-gray-400" : "text-neutral-500";
  const strongText = theme ? "text-gray-200" : "text-neutral-800";

  return (
    <>
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

      {(actions || onDelete) && (
        <div className="mt-auto flex justify-end pt-4">
          <div className="flex flex-wrap items-center justify-end gap-2">
            {actions}
            {onDelete && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => onDelete(lesson)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${theme ? "border-red-500/40 text-red-300 hover:bg-red-500/10" : "border-red-300 text-red-600 hover:bg-red-50"}`}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

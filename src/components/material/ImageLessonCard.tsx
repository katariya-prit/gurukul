import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaExpand, FaImage } from "react-icons/fa";
import type { ReactNode } from "react";
import { useTheme } from "../theme/ThemeContext";
import type { LessonCardData } from "./lessonCard.types";
import LessonCardFooter from "./LessonCardFooter";

interface ImageLessonCardProps {
  lesson: LessonCardData;
  onDelete?: (lesson: LessonCardData) => void;
  isDeleting?: boolean;
  actions?: ReactNode;
}

export default function ImageLessonCard({
  lesson,
  onDelete,
  isDeleting = false,
  actions,
}: ImageLessonCardProps) {
  const { theme } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const mutedText = theme ? "text-gray-400" : "text-neutral-500";
  const hasImage = Boolean(lesson.mediaUrl) && !imageFailed;

  useEffect(() => {
    if (!isLightboxOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsLightboxOpen(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen]);

  return (
    <>
      <article
        className={`group flex flex-col overflow-hidden rounded-3xl border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${theme ? "border-white/10 bg-white/5 backdrop-blur-xl" : "border-neutral-200 bg-white"}`}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            if (hasImage) setIsLightboxOpen(true);
          }}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && hasImage) {
              e.preventDefault();
              setIsLightboxOpen(true);
            }
          }}
          aria-label={`Expand image: ${lesson.title}`}
          className={`relative aspect-video w-full overflow-hidden ${hasImage ? "cursor-pointer" : "cursor-not-allowed"}`}
        >
          {hasImage ? (
            <img
              src={lesson.mediaUrl}
              alt={lesson.title}
              loading="lazy"
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center bg-linear-to-br ${theme ? "from-blue-900 via-slate-900 to-slate-950 text-blue-300/40" : "from-red-200 via-rose-100 to-orange-100 text-red-400/50"}`}
            >
              <FaImage className="h-16 w-16" aria-hidden="true" />
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/55 via-black/5 to-transparent" />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/30 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
            <FaImage className="h-3 w-3" aria-hidden="true" />
            Image
          </span>
          {hasImage && (
            <div className="absolute top-0 right-0 z-10 flex items-center justify-center text-white">
              <span className="flex h-12 w-12 items-center justify-center rounded-bl-2xl bg-black/50 shadow-lg opacity-0 backdrop-blur-md transition-all duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                <FaExpand className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className={`truncate text-lg font-semibold leading-snug ${theme ? "text-white" : "text-neutral-900"}`}>
            {lesson.title}
          </h3>
          {lesson.description && (
            <p className={`mt-1.5 line-clamp-2 text-sm ${mutedText}`}>{lesson.description}</p>
          )}
          <LessonCardFooter
            lesson={lesson}
            onDelete={onDelete}
            isDeleting={isDeleting}
            actions={actions}
          />
        </div>
      </article>

      {isLightboxOpen &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${lesson.title} image preview`}
            onClick={(event) => {
              if (event.target === event.currentTarget) setIsLightboxOpen(false);
            }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl"
          >
           
            <div className="relative w-full max-w-4xl flex items-center justify-center overflow-hidden rounded-2xl shadow-2xl">
              <img
                src={lesson.mediaUrl}
                alt={lesson.title}
                className="max-h-[85vh] max-w-full object-contain rounded-xl"
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
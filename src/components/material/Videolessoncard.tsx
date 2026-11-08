import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaPlay, FaVideo } from "react-icons/fa";
import type { ReactNode } from "react";
import { useTheme } from "../theme/ThemeContext";
import type { LessonCardData } from "./lessonCard.types";
import LessonCardFooter from "./LessonCardFooter";

const formatTime = (value: number) => {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

interface VideoLessonCardProps {
  lesson: LessonCardData;
  onDelete?: (lesson: LessonCardData) => void;
  isDeleting?: boolean;
  actions?: ReactNode;
}

export default function VideoLessonCard({
  lesson,
  onDelete,
  isDeleting = false,
  actions,
}: VideoLessonCardProps) {
  const { theme } = useTheme();
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const mutedText = theme ? "text-gray-400" : "text-neutral-500";
  const canOpen = Boolean(lesson.mediaUrl) && !hasError;

  // The card video is only a preview frame (never plays here).
  const previewSource =
    lesson.mediaUrl && !lesson.thumbnail
      ? `${lesson.mediaUrl}${lesson.mediaUrl.includes("#") ? "&" : "#"}t=0.5`
      : lesson.mediaUrl || undefined;

  const openModal = () => {
    if (canOpen) setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    if (!isModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsModalOpen(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    const video = modalVideoRef.current;
    video?.play().catch(() => {});

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      video?.pause();
    };
  }, [isModalOpen]);

  return (
    <>
      <article
        className={`group flex flex-col overflow-hidden rounded-3xl border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${theme ? "border-white/10 bg-white/5 backdrop-blur-xl" : "border-neutral-200 bg-white"}`}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={openModal}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && canOpen) {
              e.preventDefault();
              openModal();
            }
          }}
          aria-label={`Play video: ${lesson.title}`}
          className={`relative aspect-video w-full overflow-hidden bg-black ${canOpen ? "cursor-pointer" : "cursor-not-allowed"}`}
        >
          {previewSource && (
            <video
              src={previewSource}
              poster={lesson.thumbnail || undefined}
              preload="metadata"
              muted
              playsInline
              disablePictureInPicture
              onLoadedMetadata={(event) => {
                const loadedDuration = event.currentTarget.duration;
                setDuration(Number.isFinite(loadedDuration) ? loadedDuration : 0);
              }}
              onError={() => setHasError(true)}
              className="pointer-events-none h-full w-full object-cover"
            />
          )}

          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/30 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
            <FaVideo className="h-3 w-3" aria-hidden="true" />
            Video
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openModal();
            }}
            disabled={!canOpen}
            aria-label="Play video"
            className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white shadow-xl backdrop-blur-xl transition-all duration-200 hover:scale-105 hover:bg-white/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <FaPlay className="ml-1 h-5 w-5" aria-hidden="true" />
          </button>

          {duration > 0 && (
            <span className="absolute bottom-3 right-3 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-xs tabular-nums text-white backdrop-blur-md">
              {formatTime(duration)}
            </span>
          )}

          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 px-4 text-center text-sm font-medium text-white">
              Video unavailable
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

      {isModalOpen &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${lesson.title} video player`}
            onClick={(event) => {
              if (event.target === event.currentTarget) closeModal();
            }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl"
          >

            <div className="relative w-full max-w-6xl overflow-hidden rounded-2xl bg-black shadow-2xl">
              <video
                ref={modalVideoRef}
                src={lesson.mediaUrl || undefined}
                controls
                autoPlay
                playsInline
                className="min-h-[50vh] max-h-[90vh] w-full object-contain"
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
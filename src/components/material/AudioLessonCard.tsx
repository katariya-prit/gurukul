import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { FaMusic, FaPause, FaPlay } from "react-icons/fa";
import { useTheme } from "../theme/ThemeContext";
import type { LessonCardData } from "./lessonCard.types";

let activeAudio: HTMLAudioElement | null = null;

const equalizerStyles =
  "@keyframes lesson-eq{0%,100%{transform:scaleY(0.3)}50%{transform:scaleY(1)}}";

const formatTime = (value: number) => {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

interface AudioLessonCardProps {
  lesson: LessonCardData;
  onDelete?: (lesson: LessonCardData) => void;
  isDeleting?: boolean;
}

export default function AudioLessonCard({ lesson, onDelete, isDeleting = false }: AudioLessonCardProps) {
  const { theme } = useTheme();
  const audioRef = useRef<HTMLAudioElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const seekingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;

    return () => {
      if (!audio) return;
      audio.pause();
      if (activeAudio === audio) activeAudio = null;
    };
  }, []);

  const canPlay = Boolean(lesson.mediaUrl) && !hasError;
  const showThumbnail = Boolean(lesson.thumbnail) && !thumbnailFailed;
  const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !canPlay) return;

    if (audio.paused) {
      if (activeAudio && activeAudio !== audio) activeAudio.pause();
      activeAudio = audio;

      try {
        await audio.play();
      } catch {
        setHasError(true);
      }
      return;
    }

    audio.pause();
  };

  const seekFromPointer = (clientX: number) => {
    const track = trackRef.current;
    const audio = audioRef.current;
    if (!track || !audio || !duration) return;

    const rect = track.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    seekingRef.current = true;
    seekFromPointer(event.clientX);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (seekingRef.current) seekFromPointer(event.clientX);
  };

  const handlePointerUp = () => {
    seekingRef.current = false;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    if (event.key === "ArrowRight") {
      audio.currentTime = Math.min(audio.currentTime + 5, duration);
    } else if (event.key === "ArrowLeft") {
      audio.currentTime = Math.max(audio.currentTime - 5, 0);
    }
  };

  const accentFill = theme ? "bg-blue-400" : "bg-red-500";
  const mutedText = theme ? "text-gray-400" : "text-neutral-500";
  const strongText = theme ? "text-gray-200" : "text-neutral-800";

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-3xl border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${theme ? "border-white/10 bg-white/5 backdrop-blur-xl" : "border-neutral-200 bg-white"}`}
    >
      <style>{equalizerStyles}</style>

      {lesson.mediaUrl && (
        <audio
          ref={audioRef}
          src={lesson.mediaUrl}
          preload="metadata"
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
          onDurationChange={(event) => setDuration(event.currentTarget.duration)}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
          onError={() => setHasError(true)}
        />
      )}

      <div className="relative aspect-video w-full overflow-hidden">
        {showThumbnail ? (
          <img
            src={lesson.thumbnail}
            alt={lesson.title}
            loading="lazy"
            className={`h-full w-full object-cover transition-transform duration-500 ${isPlaying ? "scale-105" : "scale-100"}`}
            onError={() => setThumbnailFailed(true)}
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-linear-to-br ${theme ? "from-blue-900 via-slate-900 to-slate-950 text-blue-300/40" : "from-red-200 via-rose-100 to-orange-100 text-red-400/50"}`}
          >
            <FaMusic className="h-16 w-16" aria-hidden="true" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-black/5 to-transparent" />

        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/30 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
          <FaMusic className="h-3 w-3" aria-hidden="true" />
          Audio
        </span>

        <button
          type="button"
          onClick={() => void togglePlay()}
          disabled={!canPlay}
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
          className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white shadow-xl backdrop-blur-xl transition-all duration-200 hover:scale-105 hover:bg-white/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPlaying ? (
            <FaPause className="h-5 w-5" aria-hidden="true" />
          ) : (
            <FaPlay className="ml-1 h-5 w-5" aria-hidden="true" />
          )}
        </button>

        {isPlaying && (
          <div className="absolute bottom-3 left-4 flex h-5 items-end gap-1" aria-hidden="true">
            {[0, 0.2, 0.4, 0.1].map((delay) => (
              <span
                key={delay}
                className="h-full w-1 origin-bottom rounded-full bg-white/90"
                style={{ animation: `lesson-eq 0.9s ease-in-out ${delay}s infinite` }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className={`text-lg font-semibold leading-snug ${theme ? "text-white" : "text-neutral-900"}`}>
          {lesson.title}
        </h3>

        {lesson.description && (
          <p className={`mt-1.5 line-clamp-2 text-sm ${mutedText}`}>{lesson.description}</p>
        )}

        <div
          className={`mt-4 rounded-2xl border px-4 py-3 ${theme ? "border-white/10 bg-white/5 backdrop-blur-md" : "border-neutral-200 bg-neutral-50"}`}
        >
          <div
            ref={trackRef}
            role="slider"
            tabIndex={0}
            aria-label="Seek audio"
            aria-valuemin={0}
            aria-valuemax={Math.floor(duration) || 0}
            aria-valuenow={Math.floor(currentTime)}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onKeyDown={handleKeyDown}
            className="group/track relative cursor-pointer touch-none py-2 outline-none"
          >
            <div className={`h-1.5 w-full overflow-hidden rounded-full ${theme ? "bg-white/15" : "bg-neutral-300"}`}>
              <div className={`h-full rounded-full ${accentFill}`} style={{ width: `${progress}%` }} />
            </div>
            <span
              className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-md transition-opacity group-hover/track:opacity-100 group-focus-visible/track:opacity-100 ${accentFill} ${isPlaying ? "opacity-100" : "opacity-0"}`}
              style={{ left: `${progress}%` }}
            />
          </div>

          <div className={`mt-1 flex items-center justify-between text-xs tabular-nums ${mutedText}`}>
            <span>{formatTime(currentTime)}</span>
            <span>{hasError ? "Audio unavailable" : formatTime(duration)}</span>
          </div>
        </div>

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
      </div>
    </article>
  );
}
import { useRef, useState } from "react";
import { FaPause, FaPlay } from "react-icons/fa";
import { resolveAssetUrl, type Submission } from "../../services/lessonService";
import type { LessonCardData } from "./lessonCard.types";
import { useTheme } from "../theme/ThemeContext";
import { Modal } from "../overlay/OverlayPrimitives";

interface SubmissionMediaCompareProps {
  lesson: LessonCardData;
  submission: Submission;
  studentLabel?: string;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

function AudioComparePlayer({ title, src, theme }: { title: string; src: string; theme: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`rounded-2xl border p-4 ${theme ? "border-white/10 bg-white/5" : "border-neutral-200 bg-white"}`}>
      <p className={`mb-3 text-sm font-semibold ${theme ? "text-white/80" : "text-neutral-700"}`}>{title}</p>
      <audio
        ref={audioRef}
        src={src}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            const audio = audioRef.current;
            if (!audio) return;
            if (audio.paused) void audio.play();
            else audio.pause();
          }}
          aria-label={playing ? `Pause ${title.toLowerCase()}` : `Play ${title.toLowerCase()}`}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white focus-visible:outline-none focus-visible:ring-2 ${theme ? "bg-blue-600 focus-visible:ring-blue-400" : "bg-red-600 focus-visible:ring-red-400"}`}
        >
          {playing ? <FaPause /> : <FaPlay className="ml-0.5" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className={`h-2 overflow-hidden rounded-full ${theme ? "bg-white/10" : "bg-neutral-200"}`}>
            <div className={`h-full rounded-full ${theme ? "bg-blue-400" : "bg-red-500"}`} style={{ width: `${progress}%` }} />
          </div>
          <div className={`mt-1 flex justify-between text-[11px] tabular-nums ${theme ? "text-white/50" : "text-neutral-500"}`}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubmissionMediaCompare({
  lesson,
  submission,
  studentLabel = "Your recording",
}: SubmissionMediaCompareProps) {
  const { theme } = useTheme();
  const [lightbox, setLightbox] = useState<{ src: string; title: string } | null>(null);
  const referenceUrl = lesson.mediaUrl;
  const submittedUrl = resolveAssetUrl(submission.media_url);
  const muted = theme ? "text-white/60" : "text-neutral-500";
  const card = `min-w-0 rounded-2xl border p-3 ${theme ? "border-white/10 bg-black/10" : "border-neutral-200 bg-neutral-50"}`;
  const type = lesson.type.toLowerCase();

  const renderResource = (title: string, url: string) => {
    if (!url) {
      return <div className={`${card} ${muted}`}>{title} is unavailable.</div>;
    }

    if (type === "audio") {
      return <AudioComparePlayer title={title} src={url} theme={theme} />;
    }
    if (type === "video") {
      return (
        <div className={card}>
          <p className={`mb-2 text-sm font-semibold ${muted}`}>{title}</p>
          <video src={url} controls preload="metadata" className="max-h-64 w-full rounded-xl bg-black" aria-label={title} />
        </div>
      );
    }
    if (type === "image") {
      return (
        <div className={card}>
          <p className={`mb-2 text-sm font-semibold ${muted}`}>{title}</p>
          <button type="button" onClick={() => setLightbox({ src: url, title })} className="block w-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400">
            <img src={url} alt={title} className="max-h-64 w-full rounded-xl object-contain" />
            <span className={`mt-2 block text-xs ${muted}`}>Open image preview</span>
          </button>
        </div>
      );
    }

    let filename = "Submitted document";
    try {
      filename = decodeURIComponent(new URL(url).pathname.split("/").pop() || filename);
    } catch {
      filename = url.split("/").pop() || filename;
    }
    return (
      <div className={`${card} flex min-h-28 items-center justify-between gap-3`}>
        <div className="min-w-0">
          <p className={`text-xs font-semibold uppercase tracking-wide ${muted}`}>{title}</p>
          <p className="mt-1 truncate text-sm font-medium">{filename}</p>
        </div>
        <a href={url} target="_blank" rel="noreferrer" className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 ${theme ? "bg-blue-500/15 text-blue-200 focus-visible:ring-blue-400" : "bg-red-500/10 text-red-700 focus-visible:ring-red-400"}`}>
          Open
        </a>
      </div>
    );
  };

  return (
    <>
      <section aria-label="Compare reference and submission" className="grid gap-3 md:grid-cols-2">
        {renderResource("Teacher's lesson", referenceUrl)}
        {renderResource(studentLabel, submittedUrl)}
      </section>
      <Modal
        open={lightbox !== null}
        onClose={() => setLightbox(null)}
        ariaLabel={lightbox ? `${lightbox.title} image preview` : "Image preview"}
        className="flex max-w-[95vw] items-center justify-center bg-black/85 p-4 sm:max-w-[95vw]"
      >
        {lightbox && (
          <div className="relative flex items-center justify-center">
          <button
            type="button"
            aria-label="Close image preview"
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Close
          </button>
          <img
            src={lightbox.src}
            alt={lightbox.title}
            className="max-h-[85dvh] max-w-[90vw] rounded-2xl object-contain"
          />
          </div>
        )}
      </Modal>
    </>
  );
}

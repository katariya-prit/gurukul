import { useState } from "react";
import { toast } from "sonner";
import { FaMicrophone, FaUpload } from "react-icons/fa";
import { useTheme } from "../theme/ThemeContext";
import { useBackgroundTasks } from "../background/useBackgroundTasks";
import { lessonService, type Submission, type SubmissionSource } from "../../services/lessonService";
import type { LessonCardData } from "./lessonCard.types";
import LessonMediaUploader from "./LessonMediaUploader";
import AudioRecorderCard from "./AudioRecorderCard";
import { Modal } from "../overlay/OverlayPrimitives";

type AudioMode = "recorded" | "live";

interface LessonUploadPanelProps {
  lesson: LessonCardData;
  submission: Submission | null;
  open: boolean;
  onClose: () => void;
}

export default function LessonUploadPanel({
  lesson,
  submission,
  open,
  onClose,
}: LessonUploadPanelProps) {
  const { theme } = useTheme();
  const { tasks, startTask } = useBackgroundTasks();
  const [panelOpen, setPanelOpen] = useState(open);
  const [audioMode, setAudioMode] = useState<AudioMode | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const lessonTask = tasks.find(
    (task) =>
      task.kind === "upload" &&
      String(task.meta.lessonId) === lesson.id &&
      task.status === "running"
  );
  const isUploading = Boolean(lessonTask);
  const closePanel = () => setPanelOpen(false);
  const isAudio = lesson.type === "audio";
  const source: SubmissionSource = isAudio
    ? audioMode === "live"
      ? "live"
      : "recorded"
    : "upload";
  const label = isAudio ? (audioMode === "live" ? "Live recording" : "Recorded audio") : "Upload";

  const handleUpload = () => {
    if (!file || isUploading) return;
    startTask({
      kind: "upload",
      title: `${lesson.title} - ${label}`,
      meta: { lessonId: lesson.id },
      run: async ({ onProgress, signal }) => {
        const response = await lessonService.submitLesson(lesson.id, file, {
          source,
          onProgress,
          signal,
        });
        if (response.success === false) {
          throw new Error(response.message || "Unable to submit your work");
        }
      },
    });
    toast.info("Uploading in the background, you can keep working");
    closePanel();
  };

  const muted = theme ? "text-white/60" : "text-neutral-500";
  const modeCard = (selected: boolean) =>
    `flex min-h-32 flex-col items-start justify-between rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 ${
      selected
        ? theme
          ? "border-blue-400 bg-blue-500/15 text-blue-100 focus-visible:ring-blue-400"
          : "border-red-400 bg-red-50 text-red-700 focus-visible:ring-red-400"
        : theme
          ? "border-white/10 bg-white/5 hover:bg-white/10 focus-visible:ring-blue-400"
          : "border-neutral-200 bg-white hover:bg-neutral-50 focus-visible:ring-red-400"
    }`;

  return (
      <Modal
        open={panelOpen}
        onClose={closePanel}
        onExitComplete={onClose}
        ariaLabel="Upload your work"
        className="max-w-2xl p-5 sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="lesson-upload-title" className="text-xl font-bold sm:text-2xl">Upload your work</h2>
            <p className={`mt-1 text-sm ${muted}`}>{lesson.title} · {lesson.points ?? 0} points available</p>
          </div>
          <button type="button" onClick={closePanel} aria-label="Close upload panel" className={`rounded-full px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 ${theme ? "text-white/70 hover:bg-white/10 focus-visible:ring-blue-400" : "text-neutral-500 hover:bg-neutral-100 focus-visible:ring-red-400"}`}>
            Close
          </button>
        </div>

        {submission && (
          <p className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${theme ? "border-amber-400/20 bg-amber-400/10 text-amber-100" : "border-amber-300 bg-amber-50 text-amber-800"}`}>
            Uploading again replaces your current submission and starts a new AI evaluation.
          </p>
        )}

        {isAudio && audioMode === null ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => { setAudioMode("recorded"); setFile(null); }} className={modeCard(false)}>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 text-white"><FaUpload /></span>
              <span>
                <span className="block font-semibold">Recorded</span>
                <span className={`mt-1 block text-sm ${muted}`}>Upload an audio file you already have</span>
              </span>
            </button>
            <button type="button" onClick={() => { setAudioMode("live"); setFile(null); }} className={modeCard(false)}>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-red-500 to-rose-700 text-white"><FaMicrophone /></span>
              <span>
                <span className="block font-semibold">Live</span>
                <span className={`mt-1 block text-sm ${muted}`}>Record a response now</span>
              </span>
            </button>
          </div>
        ) : (
          <div className="mt-6">
            {isAudio && (
              <button type="button" onClick={() => { setAudioMode(null); setFile(null); }} className={`mb-4 rounded-full px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 ${theme ? "bg-white/5 text-blue-200 hover:bg-white/10 focus-visible:ring-blue-400" : "bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-400"}`}>
                Change audio method
              </button>
            )}
            {isAudio && audioMode === "live" ? (
              <AudioRecorderCard onRecorded={setFile} disabled={isUploading} />
            ) : (
              <LessonMediaUploader
                key={`${lesson.id}-${audioMode ?? lesson.type}`}
                lessonType={isAudio ? "audio" : lesson.type}
                label={isAudio ? "Choose an audio file" : `Choose ${lesson.type} file`}
                onFileChange={setFile}
              />
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse items-center justify-between gap-3 border-t border-current/10 pt-5 sm:flex-row">
          <p className={`text-xs ${muted}`}>Uploads continue in the background</p>
          {audioMode !== null || !isAudio ? (
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || isUploading}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${theme ? "bg-blue-600 shadow-blue-600/20 focus-visible:ring-blue-400/40" : "bg-red-600 shadow-red-600/20 focus-visible:ring-red-400/40"}`}
            >
              <FaUpload />
              {isUploading ? "Upload running..." : "Upload"}
            </button>
          ) : null}
        </div>
      </Modal>
  );
}

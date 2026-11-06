import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AnimatePresence } from "motion/react";
import { useTheme } from "../../../components/theme/ThemeContext";
import Button from "../../../components/common/Button";
import AudioLessonCard from "../../../components/material/AudioLessonCard";
import BasicLessonCard from "../../../components/material/BasicLessonCard";
import LessonUploadPanel from "../../../components/material/LessonUploadPanel";
import SubmissionResultDrawer from "../../../components/material/SubmissionResultDrawer";
import { useBackgroundTasks } from "../../../components/background/useBackgroundTasks";
import { useNotifications } from "../../../context/NotificationContext";
import {
  extractLessonList,
  normalizeLesson,
  type LessonCardData,
} from "../../../components/material/lessonCard.utils";
import type { AuthUser } from "../../../Types/Role-create";
import { hasAccess } from "../../../components/sidebar/core/PermitionValidetor";
import { lessonService, type Submission } from "../../../services/lessonService";

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
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [uploadLesson, setUploadLesson] = useState<LessonCardData | null>(null);
  const [resultLesson, setResultLesson] = useState<LessonCardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<TypeFilter>("all");
  const { tasks } = useBackgroundTasks();
  const { notifications } = useNotifications();
  const taskStatusRef = useRef(new Map<string, string>());
  const currentUser = useMemo(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser) as AuthUser;
    } catch {
      return null;
    }
  }, []);
  const canCreateLesson = hasAccess(currentUser, "Lesson", "create", true);

  const refreshSubmissions = useCallback(async (showError = false) => {
    try {
      setSubmissions(await lessonService.getMySubmissions());
    } catch (error: unknown) {
      if (showError) {
        toast.error(error instanceof Error ? error.message : "Unable to load your submissions");
      } else {
        console.warn("Unable to refresh lesson submissions", error);
      }
    }
  }, []);

  useEffect(() => {
    const fetchMyLessons = async () => {
      try {
        setLoading(true);
        const [lessonResponse] = await Promise.all([
          lessonService.getMyLessons(),
          refreshSubmissions(true),
        ]);
        setLessons(extractLessonList(lessonResponse).map(normalizeLesson));
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : "Unable to load your lessons");
        setLessons([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchMyLessons();
  }, [refreshSubmissions]);

  const hasActiveEvaluation = submissions.some(
    (submission) => submission.ai_status === "pending" || submission.ai_status === "processing"
  );

  useEffect(() => {
    if (!hasActiveEvaluation) return;
    let timer: number | null = null;
    const poll = () => {
      if (document.visibilityState === "visible") {
        void refreshSubmissions();
      }
    };
    const startPolling = () => {
      if (timer !== null) window.clearInterval(timer);
      timer = null;
      if (document.visibilityState === "visible") {
        timer = window.setInterval(poll, 4_000);
      }
    };
    startPolling();
    document.addEventListener("visibilitychange", startPolling);
    return () => {
      if (timer !== null) window.clearInterval(timer);
      document.removeEventListener("visibilitychange", startPolling);
    };
  }, [hasActiveEvaluation, refreshSubmissions]);

  useEffect(() => {
    const completedUploads = tasks.filter(
      (task) => task.kind === "upload" && task.status !== "running" && task.status !== "cancelled"
    );
    let changed = false;
    for (const task of completedUploads) {
      if (taskStatusRef.current.get(task.id) === "running") changed = true;
      taskStatusRef.current.set(task.id, task.status);
    }
    tasks
      .filter((task) => task.status === "running")
      .forEach((task) => taskStatusRef.current.set(task.id, task.status));
    if (!changed) return;
    const timer = window.setTimeout(() => {
      void refreshSubmissions();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [tasks, refreshSubmissions]);

  const seenEvaluationNotificationIds = useRef(new Set<string>());
  useEffect(() => {
    const hasNewEvaluationNotification = notifications.some((notification) => {
      const isNew = !seenEvaluationNotificationIds.current.has(notification.id);
      seenEvaluationNotificationIds.current.add(notification.id);
      return isNew && notification.route_key === "ai.evaluation.completed";
    });
    if (!hasNewEvaluationNotification) return;
    const timer = window.setTimeout(() => {
      void refreshSubmissions();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [notifications, refreshSubmissions]);

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
  const submissionByLesson = useMemo(() => {
    const byLesson = new Map<string, Submission>();
    for (const submission of submissions) {
      const lessonId = String(submission.lesson_id);
      const current = byLesson.get(lessonId);
      if (!current || new Date(submission.created_at).getTime() >= new Date(current.created_at).getTime()) {
        byLesson.set(lessonId, submission);
      }
    }
    return byLesson;
  }, [submissions]);

  const closeUpload = useCallback(() => setUploadLesson(null), []);
  const closeResult = useCallback(() => setResultLesson(null), []);

  const renderLessonActions = (lesson: LessonCardData) => {
    const submission = submissionByLesson.get(lesson.id) ?? null;
    const task = tasks.find(
      (item) => item.kind === "upload" && String(item.meta.lessonId) === lesson.id && item.status === "running"
    );
    const isUploading = Boolean(task);
    const progress = task?.progress ?? 0;
    const points = submission?.final_points ?? submission?.ai_points ?? null;
    const maxPoints = lesson.points ?? 100;
    const percentage = points === null || maxPoints <= 0 ? 0 : (points / maxPoints) * 100;
    const statusClass = theme
      ? "border-white/10 bg-white/5 text-white/80"
      : "border-neutral-200 bg-white text-neutral-700";
    let statusLabel = "Not submitted";
    let statusTone = statusClass;
    if (submission) {
      if (submission.ai_status === "pending" || submission.ai_status === "processing") {
        statusLabel = "Evaluating";
        statusTone = theme
          ? "animate-pulse motion-reduce:animate-none border-blue-400/20 bg-blue-500/10 text-blue-200"
          : "animate-pulse motion-reduce:animate-none border-blue-200 bg-blue-50 text-blue-700";
      } else if (submission.ai_status === "failed") {
        statusLabel = "Evaluation failed";
        statusTone = theme
          ? "border-red-400/20 bg-red-500/10 text-red-200"
          : "border-red-200 bg-red-50 text-red-700";
      } else if (submission.needs_review || submission.ai_status === "skipped") {
        statusLabel = "Needs teacher review";
        statusTone = theme
          ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
          : "border-amber-200 bg-amber-50 text-amber-800";
      } else {
        statusLabel = `Scored ${points ?? 0} / ${maxPoints}`;
        statusTone =
          percentage >= 80
            ? theme
              ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
            : percentage >= 50
              ? theme
                ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
                : "border-amber-200 bg-amber-50 text-amber-800"
              : theme
                ? "border-red-400/20 bg-red-500/10 text-red-200"
                : "border-red-200 bg-red-50 text-red-700";
      }
    }

    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => submission && setResultLesson(lesson)}
          disabled={!submission}
          aria-label={submission ? `View result for ${lesson.title}: ${statusLabel}` : `${lesson.title}: ${statusLabel}`}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-default ${statusTone} ${submission ? "focus-visible:ring-blue-400" : ""}`}
        >
          {statusLabel}
        </button>
        {submission && (
          <button
            type="button"
            onClick={() => setResultLesson(lesson)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 ${theme ? "text-blue-200 hover:bg-white/10 focus-visible:ring-blue-400" : "text-red-700 hover:bg-red-50 focus-visible:ring-red-400"}`}
          >
            View result
          </button>
        )}
        <button
          type="button"
          disabled={isUploading}
          onClick={() => setUploadLesson(lesson)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-70 ${theme ? "bg-blue-600 hover:bg-blue-500 focus-visible:ring-blue-400" : "bg-red-600 hover:bg-red-500 focus-visible:ring-red-400"}`}
        >
          {isUploading ? (progress >= 100 ? "Finishing..." : `Uploading ${Math.round(progress)}%`) : submission ? "Re-upload" : "Upload"}
        </button>
      </div>
    );
  };

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

        {canCreateLesson && (
          <Button onClick={() => navigate("/dashboard/lessons/create")} className="!px-5">
            Create Lesson
          </Button>
        )}
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
              <AudioLessonCard key={lesson.id} lesson={lesson} actions={renderLessonActions(lesson)} />
            ) : (
              <BasicLessonCard key={lesson.id} lesson={lesson} actions={renderLessonActions(lesson)} />
            )
          )}
        </div>
      )}
      {uploadLesson && (
        <LessonUploadPanel
          lesson={uploadLesson}
          submission={submissionByLesson.get(uploadLesson.id) ?? null}
          open
          onClose={closeUpload}
        />
      )}
      <AnimatePresence>
        {resultLesson && submissionByLesson.get(resultLesson.id) && (
          <SubmissionResultDrawer
            lesson={resultLesson}
            submission={submissionByLesson.get(resultLesson.id)!}
            onClose={closeResult}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
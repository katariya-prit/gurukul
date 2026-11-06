import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { useTheme } from "../theme/ThemeContext";
import { lessonService, resolveAssetUrl, type Submission } from "../../services/lessonService";
import type { LessonCardData } from "./lessonCard.types";
import SubmissionMediaCompare from "./SubmissionMediaCompare";
import { Drawer } from "../overlay/OverlayPrimitives";

interface LessonSubmissionsPanelProps {
  lesson: LessonCardData;
}

function isActiveAi(status: Submission["ai_status"]) {
  return status === "pending" || status === "processing";
}

export default function LessonSubmissionsPanel({ lesson }: LessonSubmissionsPanelProps) {
  const { theme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [gradingPoints, setGradingPoints] = useState("");
  const [feedback, setFeedback] = useState("");
  const submissionsButtonRef = useRef<HTMLElement>(null);
  const maxPoints = lesson.points ?? 100;
  const sortedSubmissions = useMemo(
    () =>
      [...submissions].sort(
        (left, right) =>
          Number(right.needs_review) - Number(left.needs_review) ||
          new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
      ),
    [submissions]
  );
  const averagePoints = useMemo(() => {
    const points = submissions
      .map((submission) => submission.final_points ?? submission.ai_points)
      .filter((value): value is number => value !== null);
    return points.length > 0
      ? Math.round((points.reduce((sum, value) => sum + value, 0) / points.length) * 10) / 10
      : null;
  }, [submissions]);

  const loadSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setSubmissions(await lessonService.getLessonSubmissions(lesson.id));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to load submissions");
    } finally {
      setLoading(false);
    }
  }, [lesson.id]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => {
      void loadSubmissions();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isOpen, loadSubmissions]);

  const saveGrade = async (submission: Submission) => {
    const points = Number(gradingPoints);
    if (!Number.isFinite(points) || points < 0 || points > maxPoints) {
      toast.error(`Enter points between 0 and ${maxPoints}`);
      return;
    }
    const id = String(submission.submission_id);
    setSavingId(id);
    const previous = submissions;
    const optimistic: Submission = {
      ...submission,
      teacher_points: points,
      teacher_feedback: feedback,
      final_points: points,
      needs_review: false,
    };
    setSubmissions((current) =>
      current.map((item) => (String(item.submission_id) === id ? optimistic : item))
    );
    try {
      const updated = await lessonService.gradeSubmission(submission.submission_id, {
        points,
        feedback,
      });
      setSubmissions((current) =>
        current.map((item) => (String(item.submission_id) === id ? updated ?? optimistic : item))
      );
      toast.success("Submission grade saved");
    } catch (error: unknown) {
      setSubmissions(previous);
      toast.error(error instanceof Error ? error.message : "Unable to save grade");
    } finally {
      setSavingId(null);
    }
  };

  const reEvaluate = async (submission: Submission) => {
    const id = String(submission.submission_id);
    setSavingId(id);
    setSubmissions((current) =>
      current.map((item) =>
        String(item.submission_id) === id ? { ...item, ai_status: "processing" } : item
      )
    );
    try {
      const updated = await lessonService.reEvaluate(submission.submission_id);
      if (updated) {
        setSubmissions((current) =>
          current.map((item) => (String(item.submission_id) === id ? updated : item))
        );
      }
      toast.success("AI evaluation started");
    } catch (error: unknown) {
      setSubmissions((current) =>
        current.map((item) =>
          String(item.submission_id) === id ? { ...item, ai_status: submission.ai_status } : item
        )
      );
      toast.error(error instanceof Error ? error.message : "Unable to re-evaluate submission");
    } finally {
      setSavingId(null);
    }
  };

  const muted = theme ? "text-white/60" : "text-neutral-500";
  return (
    <>
      <button
        ref={(element) => { submissionsButtonRef.current = element; }}
        type="button"
        onClick={() => setIsOpen(true)}
        className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 ${theme ? "border-white/15 bg-white/5 text-blue-200 hover:bg-white/10 focus-visible:ring-blue-400" : "border-neutral-200 bg-white text-red-700 hover:bg-red-50 focus-visible:ring-red-400"}`}
      >
        Submissions
      </button>
      <Drawer
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Submissions · ${lesson.title}`}
        description={`${submissions.length} submission${submissions.length === 1 ? "" : "s"} · Average: ${averagePoints === null ? "—" : `${averagePoints} / ${maxPoints}`} · ${submissions.filter((item) => item.needs_review).length} need review`}
        triggerRef={submissionsButtonRef}
        className="max-w-4xl"
      >
            <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-7">
              {loading ? (
                <div className={`rounded-2xl border p-5 text-sm ${theme ? "border-white/10 bg-white/5" : "border-neutral-200 bg-neutral-50"}`}>Loading submissions…</div>
              ) : sortedSubmissions.length === 0 ? (
                <div className={`rounded-2xl border p-8 text-center text-sm ${muted} ${theme ? "border-white/10 bg-white/5" : "border-neutral-200 bg-neutral-50"}`}>No submissions yet.</div>
              ) : sortedSubmissions.map((submission) => {
                const id = String(submission.submission_id);
                const expanded = expandedId === id;
                return (
                  <article key={id} className={`overflow-hidden rounded-3xl border ${theme ? "border-white/10 bg-white/5" : "border-neutral-200 bg-white"}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedId(expanded ? null : id);
                        setGradingPoints(String(submission.teacher_points ?? submission.final_points ?? submission.ai_points ?? ""));
                        setFeedback(submission.teacher_feedback ?? "");
                      }}
                      aria-expanded={expanded}
                      className={`flex w-full items-center gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset ${theme ? "focus-visible:ring-blue-400" : "focus-visible:ring-red-400"}`}
                    >
                      {submission.student_avatar ? (
                        <img src={resolveAssetUrl(submission.student_avatar)} alt="" className="h-11 w-11 rounded-full object-cover" />
                      ) : (
                        <span aria-hidden="true" className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold ${theme ? "bg-blue-500/15 text-blue-200" : "bg-red-100 text-red-700"}`}>
                          {submission.student_name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{submission.student_name}</span>
                        <span className={`mt-1 flex flex-wrap items-center gap-2 text-xs ${muted}`}>
                          <span className="capitalize">{submission.source}</span>
                          <span className="capitalize">{submission.ai_status}</span>
                          {submission.needs_review && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-semibold text-amber-500">Needs review</span>}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-xs tabular-nums">
                          AI {submission.ai_points ?? "—"} / {maxPoints}
                        </span>
                        <span className="mt-1 block text-sm font-semibold tabular-nums">
                          Final {submission.final_points ?? "—"} / {maxPoints}
                        </span>
                      </span>
                    </button>

                    {expanded && (
                      <div className={`space-y-4 border-t p-4 ${theme ? "border-white/10" : "border-neutral-200"}`}>
                        <SubmissionMediaCompare
                          lesson={lesson}
                          submission={submission}
                          studentLabel={submission.student_name}
                        />
                        {submission.ai_result && (
                          <section className={`rounded-2xl border p-4 ${theme ? "border-white/10 bg-black/10" : "border-neutral-200 bg-neutral-50"}`}>
                            <h3 className="text-sm font-semibold">AI criteria</h3>
                            <div className="mt-3 space-y-3">
                              {submission.ai_result.criteria.map((criterion) => (
                                <div key={criterion.key}>
                                  <div className="flex justify-between gap-3 text-xs">
                                    <span>{criterion.key}</span><span>{criterion.score} / 100</span>
                                  </div>
                                  <div className={`mt-1 h-1.5 overflow-hidden rounded-full ${theme ? "bg-white/10" : "bg-neutral-200"}`}>
                                    <motion.div
                                      className={theme ? "h-full bg-blue-400" : "h-full bg-red-500"}
                                      initial={{ opacity: shouldReduceMotion ? 1 : 0, scaleX: shouldReduceMotion ? Math.max(0, Math.min(100, criterion.score)) / 100 : 0 }}
                                      animate={{ opacity: 1, scaleX: Math.max(0, Math.min(100, criterion.score)) / 100 }}
                                      transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
                                      style={{ transformOrigin: "left" }}
                                    />
                                  </div>
                                  <p className={`mt-1 text-xs ${muted}`}>{criterion.comment}</p>
                                </div>
                              ))}
                            </div>
                          </section>
                        )}
                        <form
                          onSubmit={(event) => {
                            event.preventDefault();
                            void saveGrade(submission);
                          }}
                          className="grid gap-3 sm:grid-cols-[140px_1fr_auto]"
                        >
                          <label className={`text-xs font-semibold ${muted}`}>
                            Points (0–{maxPoints})
                            <input
                              type="number"
                              min={0}
                              max={maxPoints}
                              step="any"
                              value={gradingPoints}
                              onChange={(event) => setGradingPoints(event.target.value)}
                              className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 ${theme ? "border-white/15 bg-white/5 text-white focus-visible:ring-blue-400" : "border-neutral-300 bg-white text-neutral-900 focus-visible:ring-red-400"}`}
                            />
                          </label>
                          <label className={`text-xs font-semibold ${muted}`}>
                            Feedback
                            <textarea
                              rows={2}
                              value={feedback}
                              onChange={(event) => setFeedback(event.target.value)}
                              className={`mt-1 w-full resize-y rounded-xl border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 ${theme ? "border-white/15 bg-white/5 text-white focus-visible:ring-blue-400" : "border-neutral-300 bg-white text-neutral-900 focus-visible:ring-red-400"}`}
                            />
                          </label>
                          <button
                            type="submit"
                            disabled={savingId === id}
                            className={`self-end rounded-full px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 ${theme ? "bg-blue-600 focus-visible:ring-blue-400" : "bg-red-600 focus-visible:ring-red-400"}`}
                          >
                            {savingId === id ? "Saving…" : "Save"}
                          </button>
                        </form>
                        <button
                          type="button"
                          disabled={savingId === id || isActiveAi(submission.ai_status)}
                          onClick={() => void reEvaluate(submission)}
                          className={`rounded-full border px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 ${theme ? "border-white/15 text-blue-200 hover:bg-white/5 focus-visible:ring-blue-400" : "border-neutral-200 text-red-700 hover:bg-red-50 focus-visible:ring-red-400"}`}
                        >
                          {isActiveAi(submission.ai_status) ? "AI evaluation running…" : "Re-evaluate with AI"}
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
      </Drawer>
    </>
  );
}

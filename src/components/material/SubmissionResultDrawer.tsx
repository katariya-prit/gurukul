import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTheme } from "../theme/ThemeContext";
import type { Submission } from "../../services/lessonService";
import type { LessonCardData } from "./lessonCard.types";
import SubmissionMediaCompare from "./SubmissionMediaCompare";
import { Drawer } from "../overlay/OverlayPrimitives";

interface SubmissionResultDrawerProps {
  lesson: LessonCardData;
  submission: Submission;
  onClose: () => void;
}

export default function SubmissionResultDrawer({
  lesson,
  submission,
  onClose,
}: SubmissionResultDrawerProps) {
  const { theme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const [open, setOpen] = useState(true);
  const maxPoints = lesson.points ?? 100;
  const points = submission.final_points ?? submission.ai_points;
  const teacherGraded =
    submission.teacher_points !== null && submission.teacher_points !== undefined;
  const progress =
    points === null || maxPoints <= 0
      ? 0
      : Math.max(0, Math.min(100, (points / maxPoints) * 100));
  const muted = theme ? "text-white/60" : "text-neutral-500";

  const cardSurface = theme ? "border-white/10 bg-white/5" : "border-neutral-200 bg-white";

  return (
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        onExitComplete={onClose}
        ariaLabel={`Submission result for ${lesson.title}`}
        className="max-w-3xl"
      >
        <div className={`flex h-full min-h-0 flex-col p-4 sm:p-7 ${theme ? "text-white" : "text-neutral-900"}`}>
        <header className="flex shrink-0 items-start justify-between gap-4">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${theme ? "text-blue-300" : "text-red-600"}`}>Submission result</p>
            <h2 id="submission-result-title" className="mt-1 text-xl font-bold">{lesson.title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close submission result" className={`rounded-full px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 ${theme ? "hover:bg-white/10 focus-visible:ring-blue-400" : "hover:bg-neutral-100 focus-visible:ring-red-400"}`}>
            Close
          </button>
        </header>

        <div className="mt-5 flex-1 space-y-5 overflow-y-auto pr-1">
          <SubmissionMediaCompare lesson={lesson} submission={submission} />
          {submission.ai_status !== "pending" &&
            submission.ai_status !== "processing" &&
            points !== null && (
              <section className={`flex flex-col items-center rounded-3xl border p-5 text-center sm:flex-row sm:gap-6 sm:text-left ${cardSurface}`}>
                <div className="relative grid h-36 w-36 shrink-0 place-items-center">
                  <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
                    <circle cx="60" cy="60" r="52" fill="none" stroke={theme ? "rgba(255,255,255,.1)" : "#e5e7eb"} strokeWidth="8" />
                    <motion.circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke={theme ? "#60a5fa" : "#ef4444"}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 52}
                      strokeDashoffset={2 * Math.PI * 52 * (1 - progress / 100)}
                      initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: shouldReduceMotion ? 0.12 : 0.8, ease: "easeOut" }}
                      style={{ transformOrigin: "60px 60px" }}
                    />
                  </svg>
                  <span className="text-center">
                    <span className="block text-3xl font-bold tabular-nums">{points}<span className={`text-base font-medium ${muted}`}> / {maxPoints}</span></span>
                    <span className={`text-xs ${muted}`}>points</span>
                  </span>
                </div>
                <div className="mt-4 sm:mt-0">
                  <h3 className="text-lg font-semibold">{teacherGraded ? "Graded by teacher" : "AI suggested"}</h3>
                  <p className={`mt-1 text-sm ${muted}`}>Submitted {new Date(submission.created_at).toLocaleString()}</p>
                </div>
              </section>
            )}
          {submission.ai_status === "pending" || submission.ai_status === "processing" ? (
            <div className={`animate-pulse motion-reduce:animate-none space-y-4 rounded-3xl border p-5 ${cardSurface}`}>
              <div className={`mx-auto h-36 w-36 rounded-full ${theme ? "bg-white/10" : "bg-neutral-200"}`} />
              <div className={`h-5 w-1/2 rounded ${theme ? "bg-white/10" : "bg-neutral-200"}`} />
              <div className={`h-24 rounded-2xl ${theme ? "bg-white/10" : "bg-neutral-200"}`} />
              <p className={`text-center text-sm ${muted}`}>Your work is being evaluated. This panel will update when scoring is complete.</p>
            </div>
          ) : submission.ai_status === "failed" ? (
            <div role="status" className={`rounded-3xl border p-5 ${theme ? "border-red-400/20 bg-red-500/10" : "border-red-200 bg-red-50"}`}>
              <h3 className="font-semibold text-red-500">Evaluation failed</h3>
              <p className={`mt-2 text-sm ${muted}`}>Your submission is saved, but the AI could not evaluate it. Your teacher can review your work.</p>
            </div>
          ) : submission.ai_status === "skipped" ? (
            <div role="status" className={`rounded-3xl border p-5 ${cardSurface}`}>
              <h3 className="font-semibold">AI evaluation skipped</h3>
              <p className={`mt-2 text-sm ${muted}`}>{submission.skip_reason || "This submission needs a teacher's review instead."}</p>
            </div>
          ) : (
            <>
              {submission.ai_result && (
                <>
                  <section className={`rounded-3xl border p-5 ${cardSurface}`}>
                    <h3 className="font-semibold">Criteria</h3>
                    <div className="mt-4 space-y-4">
                      {submission.ai_result.criteria.map((criterion) => (
                        <div key={criterion.key}>
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="font-medium">{criterion.key}</span>
                            <span className={`tabular-nums ${muted}`}>{criterion.score} / 100</span>
                          </div>
                          <div className={`mt-2 h-2 overflow-hidden rounded-full ${theme ? "bg-white/10" : "bg-neutral-200"}`}>
                            <motion.div
                              className={`h-full rounded-full ${theme ? "bg-blue-400" : "bg-red-500"}`}
                              initial={{ opacity: shouldReduceMotion ? 1 : 0, scaleX: shouldReduceMotion ? Math.max(0, Math.min(100, criterion.score)) / 100 : 0 }}
                              animate={{ opacity: 1, scaleX: Math.max(0, Math.min(100, criterion.score)) / 100 }}
                              transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
                              style={{ transformOrigin: "left" }}
                            />
                          </div>
                          <p className={`mt-1 text-xs ${muted}`}>{criterion.comment}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className={`space-y-4 rounded-3xl border p-5 ${cardSurface}`}>
                    <div>
                      <h3 className="font-semibold">Summary</h3>
                      <p className={`mt-1 text-sm ${muted}`}>{submission.ai_result.summary}</p>
                    </div>
                    {submission.ai_result.strengths.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold">Strengths</h4>
                        <ul className={`mt-2 list-inside list-disc space-y-1 text-sm ${muted}`}>{submission.ai_result.strengths.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul>
                      </div>
                    )}
                    {submission.ai_result.improvements.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold">Improvements</h4>
                        <ul className={`mt-2 list-inside list-disc space-y-1 text-sm ${muted}`}>{submission.ai_result.improvements.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul>
                      </div>
                    )}
                  </section>
                </>
              )}
            </>
          )}
          {submission.teacher_feedback && (
            <section className={`rounded-3xl border p-5 ${cardSurface}`}>
              <h3 className="font-semibold">Teacher feedback</h3>
              <p className={`mt-2 whitespace-pre-wrap text-sm ${muted}`}>{submission.teacher_feedback}</p>
            </section>
          )}
          {submission.needs_review && (
            <p className={`rounded-2xl px-4 py-3 text-center text-xs ${theme ? "bg-amber-400/10 text-amber-200" : "bg-amber-50 text-amber-800"}`}>
              A teacher will confirm the score for this submission.
            </p>
          )}
          {submission.ai_status === "done" && !teacherGraded && (
            <p className={`rounded-2xl px-4 py-3 text-center text-xs ${theme ? "bg-blue-500/10 text-blue-200" : "bg-red-50 text-red-700"}`}>
              AI suggested score. Your teacher may adjust it.
            </p>
          )}
        </div>
        </div>
      </Drawer>
  );
}

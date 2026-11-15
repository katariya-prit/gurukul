import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTheme } from "../theme/ThemeContext";
import { aiService, type SectionStudentPrediction } from "../../services/aiService";

interface AtRiskListProps {
  sectionId: number;
  maxItems?: number;
}

export default function AtRiskList({ sectionId, maxItems = 8 }: AtRiskListProps) {
  const { theme } = useTheme();
  const reduceMotion = useReducedMotion();
  const [students, setStudents] = useState<SectionStudentPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    aiService
      .getSectionSummary(sectionId)
      .then((data) => {
        const flagged = (data.students || []).filter((s) => s.at_risk);
        setStudents(flagged.slice(0, maxItems));
      })
      .catch(() => setError("Could not load at-risk data."))
      .finally(() => setLoading(false));
  }, [sectionId, maxItems]);

  const muted = theme ? "text-slate-300/80" : "text-slate-500";
  const strong = theme ? "text-white" : "text-slate-900";

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.14 }}
      className={`relative overflow-hidden rounded-[28px] border p-5 sm:p-6 backdrop-blur-2xl ${
        theme
          ? "border-white/15 bg-slate-900/65 shadow-[0_20px_50px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.15)]"
          : "border-white/90 bg-white/80 shadow-[0_20px_50px_rgba(59,130,246,0.12),inset_0_1px_2px_rgba(255,255,255,1)]"
      }`}
    >
      <div
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle, rgba(239,68,68,0.45) 0%, rgba(236,72,153,0.4) 60%, transparent 100%)",
          filter: "blur(55px)",
        }}
        className={`pointer-events-none absolute -bottom-10 left-4 h-48 w-48 rounded-full ${
          theme ? "opacity-55" : "opacity-30"
        }`}
      />

      <div className="relative z-10 mb-4 flex items-start justify-between">
        <div>
          <span className="inline-block bg-gradient-to-r from-rose-400 via-pink-400 to-amber-400 bg-clip-text text-[11px] font-extrabold uppercase tracking-[0.18em] text-transparent">
            At Risk
          </span>
          <h3 className={`mt-1 text-lg font-black ${strong}`}>Flagged Students</h3>
          <p className={`text-xs font-medium ${muted}`}>Section {sectionId} — needs attention</p>
        </div>
        <span className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
          theme ? "bg-rose-500/20 text-rose-300" : "bg-rose-50 text-[#9b001c]"
        }`}>
          {students.length}
        </span>
      </div>

      {loading && (
        <div className="relative z-10 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`h-10 rounded-xl animate-pulse ${theme ? "bg-slate-800/60" : "bg-slate-100"}`}
            />
          ))}
        </div>
      )}

      {error && !loading && (
        <p className="relative z-10 text-sm text-rose-400">{error}</p>
      )}

      {!loading && !error && students.length === 0 && (
        <div className="relative z-10 flex flex-col items-center justify-center py-6 text-center">
          <p className={`mt-2 text-sm font-semibold ${strong}`}>No at-risk students</p>
          <p className={`text-xs ${muted}`}>All students are progressing well</p>
        </div>
      )}

      {!loading && students.length > 0 && (
        <div className="relative z-10 space-y-2">
          {students.map((s, idx) => {
            const absentPct = Math.round((s.absent_week_ratio ?? 0) * 100);
            const reason = s.risk_reason ?? (absentPct > 40 ? "High absence" : "Low activity");

            return (
              <motion.div
                key={s.student_id}
                initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                  theme
                    ? "border-rose-500/20 bg-rose-950/20"
                    : "border-rose-100 bg-rose-50/50"
                }`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${
                  theme ? "bg-rose-500/20 text-rose-300" : "bg-rose-100 text-[#9b001c]"
                }`}>
                  !
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${strong}`}>Student #{s.student_id}</span>
                    {absentPct > 0 && (
                      <span className="text-[10px] font-semibold text-rose-400">{absentPct}% absent</span>
                    )}
                  </div>
                  <p className={`text-[10px] ${muted} truncate`}>{reason}</p>
                </div>

                {s.predicted_days_to_next_level != null && (
                  <span className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                    theme ? "bg-slate-700/60 text-slate-300" : "bg-slate-100 text-slate-500"
                  }`}>
                    {Math.round(s.predicted_days_to_next_level)}d
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

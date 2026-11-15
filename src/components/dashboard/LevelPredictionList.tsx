import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTheme } from "../theme/ThemeContext";
import { aiService } from "../../services/aiService";

interface StudentPredictionRow {
  student_id: number;
  predicted_days_to_next_level: number;
  confidence: number;
}

interface LevelPredictionListProps {
  sectionId: number;
  maxItems?: number;
}

export default function LevelPredictionList({ sectionId, maxItems = 10 }: LevelPredictionListProps) {
  const { theme } = useTheme();
  const reduceMotion = useReducedMotion();
  const [predictions, setPredictions] = useState<StudentPredictionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    aiService
      .getSectionSummary(sectionId)
      .then((data) => {
        const students: StudentPredictionRow[] = (data.students || []).map((s) => ({
          student_id: Number(s.student_id),
          predicted_days_to_next_level: Number(s.predicted_days_to_next_level ?? 0),
          confidence: Number(s.confidence ?? 0),
        }));
        const sorted = [...students].sort(
          (a, b) => a.predicted_days_to_next_level - b.predicted_days_to_next_level
        );
        setPredictions(sorted.slice(0, maxItems));
      })
      .catch(() => setError("Could not load predictions. Run the batch job first."))
      .finally(() => setLoading(false));
  }, [sectionId, maxItems]);

  const muted = theme ? "text-slate-300/80" : "text-slate-500";
  const strong = theme ? "text-white" : "text-slate-900";

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.08 }}
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
            "radial-gradient(circle, rgba(16,185,129,0.4) 0%, rgba(59,130,246,0.4) 60%, transparent 100%)",
          filter: "blur(55px)",
        }}
        className={`pointer-events-none absolute -top-10 right-6 h-48 w-48 rounded-full ${
          theme ? "opacity-60" : "opacity-35"
        }`}
      />

      <div className="relative z-10 mb-4">
        <span className={`inline-block bg-clip-text text-[11px] font-extrabold uppercase tracking-[0.18em] text-transparent ${
          theme ? "bg-gradient-to-r from-cyan-400 to-blue-400" : "bg-gradient-to-r from-[#9b001c] to-rose-500"
        }`}>
          Level Predictions
        </span>
        <h3 className={`mt-1 text-lg font-black ${strong}`}>Days to Next Level</h3>
        <p className={`text-xs font-medium ${muted}`}>Section {sectionId} — top {maxItems} upcoming</p>
      </div>

      {loading && (
        <div className="relative z-10 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
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

      {!loading && !error && predictions.length === 0 && (
        <p className={`relative z-10 text-sm ${muted}`}>No predictions available yet.</p>
      )}

      {!loading && predictions.length > 0 && (
        <div className="relative z-10 space-y-2">
          {predictions.map((p, idx) => {
            const days = Math.round(p.predicted_days_to_next_level);
            const pct = Math.round(p.confidence * 100);
            const soon = days <= 30;

            return (
              <motion.div
                key={p.student_id}
                initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                  theme ? "border-white/10 bg-slate-950/30" : "border-white bg-white/50"
                }`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${
                  soon
                    ? theme ? "bg-blue-500/20 text-blue-300" : "bg-rose-50 text-[#9b001c]"
                    : theme ? "bg-slate-700/60 text-slate-300" : "bg-slate-100 text-slate-500"
                }`}>
                  {idx + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${strong}`}>Student #{p.student_id}</span>
                    <span className={`text-[10px] font-semibold ${
                      soon ? (theme ? "text-blue-300" : "text-[#9b001c]") : muted
                    }`}>
                      {days}d
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className={`h-1 flex-1 overflow-hidden rounded-full ${
                      theme ? "bg-slate-700/60" : "bg-slate-100"
                    }`}>
                      <div
                        className={`h-full rounded-full ${
                          theme ? "bg-gradient-to-r from-cyan-400 to-blue-500" : "bg-gradient-to-r from-rose-500 to-pink-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`text-[10px] tabular-nums ${muted}`}>{pct}%</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTheme } from "../theme/ThemeContext";
import SparklineStatCard, { type SparklinePoint } from "./SparklineStatCard";
import { aiService, type SectionSummary } from "../../services/aiService";

interface AiInsightsPanelProps {
  sectionIds?: number[];
}

export default function AiInsightsPanel({ sectionIds = [] }: AiInsightsPanelProps) {
  const { theme } = useTheme();
  const reduceMotion = useReducedMotion();
  const [summaries, setSummaries] = useState<SectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sectionKey = sectionIds.join(",");

  useEffect(() => {
    if (sectionIds.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    Promise.all(
      sectionIds.map((id) => aiService.getSectionSummary(id).catch(() => null))
    )
      .then((results) => {
        setSummaries(results.filter((item): item is SectionSummary => item !== null));
      })
      .catch(() => setError("Failed to load AI insights"))
      .finally(() => setLoading(false));
  }, [sectionKey]);

  const muted = theme ? "text-slate-300/80" : "text-slate-500";
  const strong = theme ? "text-white" : "text-slate-900";

  const totalStudents = summaries.reduce((a, s) => a + s.total_students, 0);
  const totalAtRisk = summaries.reduce((a, s) => a + s.at_risk_count, 0);
  const totalLevelling = summaries.reduce((a, s) => a + s.levelling_soon_count, 0);

  const sparkData: SparklinePoint[] = summaries.map((s) => ({
    date: `Section ${s.section_id}`,
    value: s.avg_days_to_next_level != null ? Math.max(0, 100 - s.avg_days_to_next_level) : 50,
  }));

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
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
            "radial-gradient(circle, rgba(59,130,246,0.5) 0%, rgba(236,72,153,0.5) 60%, transparent 100%)",
          filter: "blur(55px)",
        }}
        className={`pointer-events-none absolute -bottom-12 right-6 h-56 w-56 rounded-full ${
          theme ? "opacity-60" : "opacity-35"
        }`}
      />

      <div className="relative z-10 mb-4 flex items-start justify-between">
        <div>
          <span className={`inline-block bg-clip-text text-[11px] font-extrabold uppercase tracking-[0.18em] text-transparent ${
            theme ? "bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400" : "bg-gradient-to-r from-[#9b001c] via-rose-500 to-pink-500"
          }`}>
            AI Insights
          </span>
          <h3 className={`mt-1 text-xl font-black ${strong}`}>Growth Forecast</h3>
          <p className={`mt-0.5 text-xs font-medium ${muted}`}>
            Section-level progress predictions
          </p>
        </div>
        <span className={`rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold backdrop-blur-md ${
          theme ? "text-blue-200" : "text-[#9b001c]"
        }`}>
          Offline AI
        </span>
      </div>

      {loading && (
        <div className="relative z-10 space-y-2">
          {[1, 2].map((i) => (
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

      {!loading && !error && summaries.length === 0 && (
        <p className={`relative z-10 text-sm ${muted}`}>
          No AI predictions loaded yet. Start the AI service and run a batch job.
        </p>
      )}

      {!loading && summaries.length > 0 && (
        <div className="relative z-10 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <StatBubble label="Students" value={totalStudents} strong={strong} muted={muted} theme={theme} />
            <StatBubble label="At Risk" value={totalAtRisk} strong={strong} muted={muted} theme={theme} danger />
            <StatBubble label="Levelling Soon" value={totalLevelling} strong={strong} muted={muted} theme={theme} />
          </div>

          {sparkData.length > 1 && (
            <div className="mt-2">
              <SparklineStatCard
                label="Predicted Growth Score"
                value={`${Math.round((totalLevelling / Math.max(totalStudents, 1)) * 100)}%`}
                subLabel="students levelling in 30 days"
                data={sparkData}
                colorScheme={theme ? "blue" : "red"}
                index={99}
              />
            </div>
          )}

          <div className="space-y-1.5">
            {summaries.map((s) => (
              <SectionRow key={s.section_id} summary={s} theme={theme} muted={muted} strong={strong} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function StatBubble({
  label,
  value,
  strong,
  muted,
  theme,
  danger = false,
}: {
  label: string;
  value: number;
  strong: string;
  muted: string;
  theme: boolean;
  danger?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-3 text-center backdrop-blur-xl ${
      theme ? "border-white/10 bg-slate-950/40" : "border-white bg-white/60"
    }`}>
      <p className={`text-2xl font-black tabular-nums ${danger ? "text-rose-400" : strong}`}>{value}</p>
      <p className={`text-[10px] font-bold uppercase tracking-wider ${muted}`}>{label}</p>
    </div>
  );
}

function SectionRow({
  summary,
  theme,
  muted,
  strong,
}: {
  summary: SectionSummary;
  theme: boolean;
  muted: string;
  strong: string;
}) {
  const avg = summary.avg_days_to_next_level;
  const pct = avg != null ? Math.round(Math.max(0, Math.min(100, (1 - avg / 90) * 100))) : 0;

  return (
    <div className={`flex items-center gap-3 rounded-xl border p-2.5 ${
      theme ? "border-white/10 bg-slate-950/30" : "border-white bg-white/50"
    }`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
        theme ? "bg-blue-500/20 text-blue-300" : "bg-rose-50 text-[#9b001c]"
      }`}>
        {summary.section_id}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold ${strong}`}>Section {summary.section_id}</span>
          <span className={`text-[10px] ${muted}`}>{avg != null ? `~${Math.round(avg)}d` : "n/a"}</span>
        </div>
        <div className={`mt-1 h-1.5 overflow-hidden rounded-full ${
          theme ? "bg-slate-700/60" : "bg-slate-100"
        }`}>
          <div
            className={`h-full rounded-full ${
              theme ? "bg-gradient-to-r from-cyan-400 to-blue-500" : "bg-gradient-to-r from-rose-500 to-pink-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {summary.at_risk_count > 0 && (
        <span className="shrink-0 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400">
          {summary.at_risk_count} risk
        </span>
      )}
    </div>
  );
}

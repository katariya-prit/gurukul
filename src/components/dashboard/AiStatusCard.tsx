import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTheme } from "../theme/ThemeContext";
import { aiService, type AiHealth } from "../../services/aiService";

export default function AiStatusCard() {
  const { theme } = useTheme();
  const reduceMotion = useReducedMotion();
  const [health, setHealth] = useState<AiHealth | null>(null);
  const [error, setError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = async () => {
    try {
      const data = await aiService.getHealth();
      setHealth(data);
      setError(false);
    } catch {
      setError(true);
    }
  };

  useEffect(() => {
    poll();
    intervalRef.current = setInterval(poll, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const muted = theme ? "text-slate-300/80" : "text-slate-500";
  const strong = theme ? "text-white" : "text-slate-900";

  const statusDot = error
    ? "bg-rose-500"
    : health?.status === "ok"
      ? "bg-emerald-400"
      : "bg-amber-400";

  const lastBatchAt = health?.last_batch_at
    ? new Date(health.last_batch_at).toLocaleString()
    : "—";

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
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
            "radial-gradient(circle, rgba(99,102,241,0.5) 0%, rgba(236,72,153,0.4) 60%, transparent 100%)",
          filter: "blur(55px)",
        }}
        className={`pointer-events-none absolute -bottom-10 right-4 h-48 w-48 rounded-full ${
          theme ? "opacity-60" : "opacity-35"
        }`}
      />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className={`text-[11px] font-extrabold uppercase tracking-[0.16em] ${muted}`}>
            AI Service
          </p>
          <h3 className={`mt-1 text-xl font-black ${strong}`}>
            Model {health?.version ?? "—"}
          </h3>
        </div>
        <span className={`mt-1 flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold backdrop-blur-md ${
          error ? "text-rose-300" : theme ? "text-emerald-300" : "text-rose-600"
        }`}>
          <span className={`h-2 w-2 rounded-full ${statusDot} animate-pulse`} />
          {error ? "Offline" : health?.status === "ok" ? "Online" : "Starting"}
        </span>
      </div>

      <div className={`relative z-10 mt-4 grid grid-cols-2 gap-3 rounded-2xl border p-3 backdrop-blur-xl ${
        theme ? "border-white/10 bg-slate-950/40" : "border-white bg-white/60"
      }`}>
        <Stat label="Backend" value={health?.backend ?? "—"} muted={muted} strong={strong} />
        <Stat label="Uptime" value={health ? `${Math.round(health.uptime_seconds / 60)}m` : "—"} muted={muted} strong={strong} />
        <Stat label="Trained on" value={health?.student_count != null ? `${health.student_count.toLocaleString()} students` : "—"} muted={muted} strong={strong} />
        <Stat
          label="Memory"
          value={health ? `${health.memory_used_mb.toFixed(0)} / ${health.memory_total_mb.toFixed(0)} MB` : "—"}
          muted={muted}
          strong={strong}
        />
      </div>

      <div className="relative z-10 mt-3">
        <p className={`text-[11px] ${muted}`}>
          Last batch run: <span className={`font-semibold ${strong}`}>{lastBatchAt}</span>
        </p>
      </div>
    </motion.div>
  );
}

function Stat({ label, value, muted, strong }: { label: string; value: string; muted: string; strong: string }) {
  return (
    <div>
      <p className={`text-[10px] font-bold uppercase tracking-wider ${muted}`}>{label}</p>
      <p className={`text-xs font-bold ${strong}`}>{value}</p>
    </div>
  );
}

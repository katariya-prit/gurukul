import { motion, useReducedMotion } from "motion/react";
import { useTheme } from "../theme/ThemeContext";
import LevelIcon from "./LevelIcon";
import { MAX_LEVEL, type LevelState } from "./levelSystem";

interface LevelCardProps {
    state: LevelState;
    heading: string;
}

function CheckIcon() {
    return (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
            <path
                d="M3.5 8.5l3 3 6-6.5"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export default function LevelCard({ state, heading }: LevelCardProps) {
    const { theme } = useTheme();
    const reduceMotion = useReducedMotion();

    const span = Math.max(1, state.xpNext - state.xpStart);
    const earned = Math.max(0, Math.min(span, state.xp - state.xpStart));
    const percent = Math.round((earned / span) * 100);
    const remaining = Math.max(0, state.xpNext - state.xp);
    const isMax = state.level >= MAX_LEVEL;

    const mainSize = 152;
    const mainStroke = 15;
    const mainRadius = (mainSize - mainStroke) / 2;
    const mainCircumference = 2 * Math.PI * mainRadius;
    const mainDashoffset = mainCircumference - (percent / 100) * mainCircumference;

    const subSize = 92;
    const subStroke = 10;
    const subRadius = (subSize - subStroke) / 2;
    const subCircumference = 2 * Math.PI * subRadius;

    const muted = theme ? "text-slate-300/80" : "text-slate-600";
    const strong = theme ? "text-white" : "text-slate-900";

    const bottomTasks = state.tasks.slice(0, 2);

    return (
        <div className="flex h-full flex-col gap-5">
            {/* TOP MAIN CARD: Only 1 Soft Blurred Blue-Pink Round Circle in Background */}
            <section
                className={`relative flex flex-1 flex-col justify-between overflow-hidden rounded-[28px] border p-5 sm:p-6 backdrop-blur-2xl ${
                    theme
                        ? "border-white/15 bg-slate-900/65 shadow-[0_20px_50px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.15)]"
                        : "border-white/90 bg-white/80 shadow-[0_20px_50px_rgba(59,130,246,0.12),inset_0_1px_2px_rgba(255,255,255,1)]"
                }`}
            >
                {/* Single Blurred Blue-Pink Round Circle */}
                <div
                    aria-hidden="true"
                    style={{
                        background:
                            "radial-gradient(circle, rgba(59, 130, 246, 0.55) 0%, rgba(236, 72, 153, 0.55) 65%, transparent 100%)",
                        filter: "blur(60px)",
                    }}
                    className={`pointer-events-none absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                        theme ? "opacity-60" : "opacity-40"
                    }`}
                />

                {/* Top-Left: Glowing Icon Box + Level Title */}
                <div className="relative z-10 flex items-center gap-4">
                    <motion.div
                        initial={reduceMotion ? false : { scale: 0.85, opacity: 0, rotate: -6 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border backdrop-blur-xl ${
                            theme
                                ? "border-white/20 bg-white/10"
                                : "border-white bg-white/80 shadow-sm"
                        }`}
                    >
                        <LevelIcon level={state.level} size={48} />
                    </motion.div>

                    <div className="min-w-0 flex-1">
                        <p className="bg-linear-to-r from-cyan-400 via-blue-400 to-pink-400 bg-clip-text text-[11px] font-extrabold uppercase tracking-[0.18em] text-transparent">
                            {heading}
                        </p>
                        <h3 className={`mt-0.5 text-2xl font-black tracking-tight ${strong}`}>
                            Level {state.level}
                        </h3>
                        <p className="text-sm font-bold text-pink-300">{state.name}</p>
                    </div>
                </div>

                {/* Inner Frosted Glass Box */}
                <div
                    className={`relative z-10 mt-4 flex flex-1 items-center justify-between gap-4 overflow-hidden rounded-2xl border px-5 py-4 backdrop-blur-xl ${
                        theme
                            ? "border-white/15 bg-slate-950/45"
                            : "border-white bg-white/65"
                    }`}
                >
                    <div className="relative z-10 space-y-1.5">
                        <p className={`text-[11px] font-bold uppercase tracking-wider ${muted}`}>
                            Current XP
                        </p>
                        <p className={`text-3xl font-black tabular-nums ${strong}`}>
                            {state.xp}
                            <span className={`ml-1 text-xs font-semibold ${muted}`}>
                                / {state.xpNext}
                            </span>
                        </p>
                        <span className="inline-block rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold text-pink-200 backdrop-blur-md">
                            {isMax ? "Max Level" : `${remaining} XP left`}
                        </span>
                    </div>

                    {/* Large Main iOS Gradient Ring */}
                    <div className="relative z-10 flex shrink-0 items-center justify-center">
                        <svg
                            width={mainSize}
                            height={mainSize}
                            className="-rotate-90 transform drop-shadow-[0_0_12px_rgba(236,72,153,0.35)]"
                        >
                            <defs>
                                <linearGradient id="iosMainSingleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#38bdf8" />
                                    <stop offset="50%" stopColor="#6366f1" />
                                    <stop offset="100%" stopColor="#ec4899" />
                                </linearGradient>
                            </defs>
                            <circle
                                cx={mainSize / 2}
                                cy={mainSize / 2}
                                r={mainRadius}
                                fill="transparent"
                                stroke={theme ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.08)"}
                                strokeWidth={mainStroke}
                            />
                            <motion.circle
                                cx={mainSize / 2}
                                cy={mainSize / 2}
                                r={mainRadius}
                                fill="transparent"
                                stroke="url(#iosMainSingleGrad)"
                                strokeWidth={mainStroke}
                                strokeLinecap="round"
                                strokeDasharray={mainCircumference}
                                initial={reduceMotion ? false : { strokeDashoffset: mainCircumference }}
                                animate={{ strokeDashoffset: mainDashoffset }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </svg>

                        {/* Center Frosted Glass Circle */}
                        <div
                            className={`absolute flex h-24 w-24 flex-col items-center justify-center rounded-full border text-center backdrop-blur-xl ${
                                theme
                                    ? "border-white/15 bg-slate-950/65"
                                    : "border-white bg-white/85"
                            }`}
                        >
                            <span className={`text-2xl font-black tabular-nums ${strong}`}>
                                {percent}%
                            </span>
                            <span className="bg-linear-to-r from-cyan-300 to-pink-400 bg-clip-text text-[9px] font-black uppercase tracking-widest text-transparent">
                                XP Goal
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* BOTTOM 2 BOXES: Each has ONLY 1 Soft Blurred Round Circle in Background */}
            <div className="grid grid-cols-2 gap-4">
                {bottomTasks.map((task, index) => {
                    const done = task.progress >= task.target;
                    const taskPercent = Math.round(
                        Math.max(0, Math.min(100, (task.progress / task.target) * 100))
                    );
                    const taskDashoffset =
                        subCircumference - (taskPercent / 100) * subCircumference;
                    const gradId = `iosSubSingleGrad-${task.id}-${index}`;

                    return (
                        <motion.div
                            key={task.id}
                            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.1 + index * 0.07 }}
                            className={`relative flex flex-col items-center justify-between overflow-hidden rounded-[26px] border p-4 backdrop-blur-2xl ${
                                theme
                                    ? "border-white/15 bg-slate-900/65 shadow-[0_15px_35px_rgba(0,0,0,0.4)]"
                                    : "border-white/90 bg-white/80 shadow-[0_15px_35px_rgba(59,130,246,0.1)]"
                            }`}
                        >
                            {/* Single Soft Blurred Blue-Pink Round Circle in Center */}
                            <div
                                aria-hidden="true"
                                style={{
                                    background:
                                        "radial-gradient(circle, rgba(236, 72, 153, 0.5) 0%, rgba(59, 130, 246, 0.5) 65%, transparent 100%)",
                                    filter: "blur(40px)",
                                }}
                                className={`pointer-events-none absolute top-1/2 left-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                                    theme ? "opacity-60" : "opacity-40"
                                }`}
                            />

                            {/* Top Header: Badge & +XP */}
                            <div className="relative z-10 flex w-full items-center justify-between">
                                <span
                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border backdrop-blur-md ${
                                        done
                                            ? "border-emerald-400/40 bg-emerald-500/25 text-emerald-300"
                                            : "border-white/20 bg-white/10 text-cyan-300"
                                    }`}
                                >
                                    {done ? (
                                        <CheckIcon />
                                    ) : (
                                        <span className="text-[11px] font-black">{index + 1}</span>
                                    )}
                                </span>
                                <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[11px] font-extrabold text-pink-200 backdrop-blur-md">
                                    +{task.reward} XP
                                </span>
                            </div>

                            {/* Center Big iOS Gradient Ring */}
                            <div className="relative z-10 my-2 flex items-center justify-center">
                                <svg
                                    width={subSize}
                                    height={subSize}
                                    className="-rotate-90 transform drop-shadow-[0_0_8px_rgba(236,72,153,0.3)]"
                                >
                                    <defs>
                                        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#38bdf8" />
                                            <stop offset="50%" stopColor="#6366f1" />
                                            <stop offset="100%" stopColor="#ec4899" />
                                        </linearGradient>
                                    </defs>
                                    <circle
                                        cx={subSize / 2}
                                        cy={subSize / 2}
                                        r={subRadius}
                                        fill="transparent"
                                        stroke={
                                            theme
                                                ? "rgba(255, 255, 255, 0.12)"
                                                : "rgba(15, 23, 42, 0.08)"
                                        }
                                        strokeWidth={subStroke}
                                    />
                                    <motion.circle
                                        cx={subSize / 2}
                                        cy={subSize / 2}
                                        r={subRadius}
                                        fill="transparent"
                                        stroke={`url(#${gradId})`}
                                        strokeWidth={subStroke}
                                        strokeLinecap="round"
                                        strokeDasharray={subCircumference}
                                        initial={
                                            reduceMotion
                                                ? false
                                                : { strokeDashoffset: subCircumference }
                                        }
                                        animate={{ strokeDashoffset: taskDashoffset }}
                                        transition={{
                                            duration: 0.85,
                                            delay: 0.15 + index * 0.08,
                                            ease: "easeOut",
                                        }}
                                    />
                                </svg>
                                <div
                                    className={`absolute flex h-16 w-16 flex-col items-center justify-center rounded-full border text-center backdrop-blur-xl ${
                                        theme
                                            ? "border-white/15 bg-slate-950/65"
                                            : "border-white bg-white/85"
                                    }`}
                                >
                                    <span className={`text-base font-black tabular-nums ${strong}`}>
                                        {taskPercent}%
                                    </span>
                                    <span className={`text-[9px] font-bold tabular-nums ${muted}`}>
                                        {Math.min(task.progress, task.target)}/{task.target}
                                    </span>
                                </div>
                            </div>

                            {/* Short 1-Line Label at Bottom */}
                            <p className={`relative z-10 w-full truncate text-center text-xs font-semibold ${strong}`}>
                                {task.title}
                            </p>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTheme } from "../theme/ThemeContext";

export interface SparklinePoint {
    date?: string;
    value: number;
}

interface SparklineStatCardProps {
    label: string;
    value: number | string;
    subLabel: string;
    data?: SparklinePoint[];
    icon?: ReactNode;
    colorScheme?: "red" | "blue" | "green" | "purple" | "amber";
    loading?: boolean;
    index?: number;
    animationKey?: string;
}

function normalizeWaveValues(data: SparklinePoint[]): number[] {
    const raw = data.map((d) => Number(d.value) || 0);

    if (raw.length === 0) {
        return [0, 0];
    }

    if (raw.length === 1) {
        const flat = raw[0] > 0 ? 0.5 : 0;
        return [flat, flat];
    }

    const min = Math.min(...raw);
    const max = Math.max(...raw);

    if (max === min) {
        const flat = max > 0 ? 0.5 : 0;
        return raw.map(() => flat);
    }

    const targetCount = Math.min(7, raw.length);
    const sampled: number[] = [];
    for (let i = 0; i < targetCount; i++) {
        const position = (i / (targetCount - 1)) * (raw.length - 1);
        const lowerIdx = Math.floor(position);
        const upperIdx = Math.ceil(position);
        const fraction = position - lowerIdx;
        const interpolated = raw[lowerIdx] + (raw[upperIdx] - raw[lowerIdx]) * fraction;
        const norm = (interpolated - min) / (max - min);
        sampled.push(0.05 + norm * 0.9);
    }
    return sampled;
}

// Smooth cubic bezier curve with wide horizontal tangents
function buildSmoothPath(coords: { x: number; y: number }[]): string {
    if (coords.length === 0) return "";
    if (coords.length === 1) return `M ${coords[0].x},${coords[0].y}`;

    let path = `M ${coords[0].x.toFixed(2)},${coords[0].y.toFixed(2)}`;
    for (let i = 0; i < coords.length - 1; i++) {
        const curr = coords[i];
        const next = coords[i + 1];
        const dx = next.x - curr.x;
        const cp1x = curr.x + dx * 0.5;
        const cp1y = curr.y;
        const cp2x = curr.x + dx * 0.5;
        const cp2y = next.y;
        path += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${next.x.toFixed(2)},${next.y.toFixed(2)}`;
    }
    return path;
}

export default function SparklineStatCard({
    label,
    value,
    subLabel,
    data = [],
    icon,
    colorScheme = "blue",
    index = 0,
    animationKey,
}: SparklineStatCardProps) {
    const { theme } = useTheme();
    const reduceMotion = useReducedMotion();

    const palette = {
        red: {
            start: "#fb7185",
            mid: "#f43f5e",
            end: "#ec4899",
            dot: "#f43f5e",
            badgeText: theme ? "text-emerald-400" : "text-rose-600",
        },
        blue: {
            start: "#38bdf8",
            mid: "#3b82f6",
            end: "#6366f1",
            dot: "#38bdf8",
            badgeText: theme ? "text-emerald-400" : "text-blue-600",
        },
        green: {
            start: "#34d399",
            mid: "#10b981",
            end: "#06b6d4",
            dot: "#10b981",
            badgeText: theme ? "text-emerald-400" : "text-emerald-600",
        },
        purple: {
            start: "#a855f7",
            mid: "#8b5cf6",
            end: "#ec4899",
            dot: "#ec4899",
            badgeText: theme ? "text-purple-300" : "text-purple-600",
        },
        amber: {
            start: "#fbbf24",
            mid: "#f59e0b",
            end: "#ec4899",
            dot: "#f59e0b",
            badgeText: theme ? "text-amber-300" : "text-amber-600",
        },
    }[colorScheme];

    const width = 400;
    const height = 72;
    const padLeft = 4;
    const padRight = 4;
    const padTop = 12;
    const padBottom = 10;

    const usableWidth = width - padLeft - padRight;
    const usableHeight = height - padTop - padBottom;

    const waveValues = normalizeWaveValues(data);
    const hasActivity = data.some((d) => Number(d.value) > 0);

    const coords = waveValues.map((normVal, i) => {
        const x = padLeft + (i / (waveValues.length - 1)) * usableWidth;
        const y = padTop + usableHeight * (1 - normVal);
        return { x, y };
    });

    const smoothLinePath = buildSmoothPath(coords);
    const firstX = coords[0].x;
    const lastPoint = coords[coords.length - 1];
    const areaPath = `${smoothLinePath} L ${lastPoint.x.toFixed(2)},${height} L ${firstX.toFixed(2)},${height} Z`;

    const lineGradId = `sparkLineGrad-${index}-${colorScheme}`;
    const areaGradId = `sparkAreaGrad-${index}-${colorScheme}`;

    const muted = theme ? "text-slate-300/80" : "text-slate-500";
    const strong = theme ? "text-white" : "text-slate-900";

    return (
        <motion.div
            key={animationKey}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.06 }}
            className={`relative flex h-full flex-col justify-between overflow-hidden rounded-[28px] border p-5 sm:p-6 backdrop-blur-2xl ${theme
                    ? "border-white/15 bg-slate-900/65 shadow-[0_20px_50px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.15)]"
                    : "border-white/90 bg-white/80 shadow-[0_20px_50px_rgba(59,130,246,0.12),inset_0_1px_2px_rgba(255,255,255,1)]"
                }`}
        >
            <div
                aria-hidden="true"
                style={{
                    background:
                        "radial-gradient(circle, rgba(59, 130, 246, 0.55) 0%, rgba(236, 72, 153, 0.55) 60%, transparent 100%)",
                    filter: "blur(55px)",
                }}
                className={`pointer-events-none absolute -bottom-10 right-6 h-52 w-52 rounded-full ${theme ? "opacity-60" : "opacity-40"
                    }`}
            />

            <div className="relative z-10 flex items-start justify-between gap-4">
                <div>
                    <p className={`text-[11px] font-extrabold uppercase tracking-[0.16em] ${muted}`}>
                        {label}
                    </p>
                    <h3 className={`mt-1.5 text-3xl font-black tabular-nums sm:text-4xl ${strong}`}>
                        {value}
                    </h3>
                    <p className={`mt-1 text-xs font-semibold ${palette.badgeText}`}>
                        {subLabel}
                    </p>
                </div>

                {icon && (
                    <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border backdrop-blur-xl ${theme
                                ? "border-white/15 bg-white/10 text-pink-300"
                                : "border-white bg-white/80 text-pink-600 shadow-sm"
                            }`}
                    >
                        {icon}
                    </div>
                )}
            </div>

            <div className="relative z-10 mt-4 w-full pt-2">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    preserveAspectRatio="xMidYMid meet"
                    className="w-full h-auto aspect-[400/72] overflow-visible block"
                >
                    <defs>
                        <linearGradient id={lineGradId} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={palette.start} />
                            <stop offset="50%" stopColor={palette.mid} />
                            <stop offset="100%" stopColor={palette.end} />
                        </linearGradient>

                        <linearGradient id={areaGradId} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={palette.mid} stopOpacity={theme ? "0.28" : "0.2"} />
                            <stop offset="100%" stopColor={palette.start} stopOpacity="0.0" />
                        </linearGradient>
                    </defs>

                    <motion.path
                        d={areaPath}
                        fill={`url(#${areaGradId})`}
                        initial={reduceMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.1 + index * 0.06 }}
                    />

                    <motion.path
                        d={smoothLinePath}
                        fill="none"
                        stroke={`url(#${lineGradId})`}
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                        style={{
                            filter: `drop-shadow(0 0 6px ${palette.dot}66)`,
                        }}
                        initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.9, delay: 0.08 + index * 0.06, ease: "easeOut" }}
                    />

                    {hasActivity && (
                        <motion.circle
                            cx={lastPoint.x}
                            cy={lastPoint.y}
                            r="7"
                            fill={palette.dot}
                            opacity="0.25"
                            initial={reduceMotion ? false : { scale: 0 }}
                            animate={{ scale: [1, 1.4, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                    )}
                    <motion.circle
                        cx={lastPoint.x}
                        cy={lastPoint.y}
                        r="3.5"
                        fill="#ffffff"
                        stroke={palette.dot}
                        strokeWidth="2.2"
                        initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.7 + index * 0.06 }}
                    />
                </svg>
            </div>
        </motion.div>
    );
}
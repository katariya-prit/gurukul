import { motion, useReducedMotion } from "motion/react";
import { useTheme } from "../theme/ThemeContext";

export interface GrowthItem {
    label: string;
    value: number;
    count?: number;
}

interface GrowthCardProps {
    title: string;
    subtitle: string;
    itemsTitle: string;
    value: number;
    change?: number | null;
    changeLabel: string;
    items: GrowthItem[];
    loading?: boolean;
    hasData?: boolean;
    animationKey?: string;
}

export default function GrowthCard({
    title,
    subtitle,
    value,
    change,
    changeLabel,
    items,
    animationKey,
}: GrowthCardProps) {
    const { theme } = useTheme();
    const reduceMotion = useReducedMotion();

    const safeValue = Math.max(0, Math.min(100, Math.round(value || 0)));
    const visualPercent = safeValue === 0 ? 5 : safeValue;

    const size = 160;
    const strokeWidth = 16;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (visualPercent / 100) * circumference;

    const muted = theme ? "text-slate-300/80" : "text-slate-600";
    const strong = theme ? "text-white" : "text-slate-900";

    return (
        <motion.div
            key={animationKey}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className={`relative flex h-full items-center justify-between gap-4 overflow-hidden rounded-[28px] border p-5 sm:p-6 backdrop-blur-2xl ${
                theme
                    ? "border-white/15 bg-slate-900/65 shadow-[0_20px_50px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.15)]"
                    : "border-white/90 bg-white/80 shadow-[0_20px_50px_rgba(59,130,246,0.12),inset_0_1px_2px_rgba(255,255,255,1)]"
            }`}
        >
            {/* ONLY 1 Soft Blurred Blue-to-Pink Round Circle in Background */}
            <div
                aria-hidden="true"
                style={{
                    background:
                        "radial-gradient(circle, rgba(236, 72, 153, 0.55) 0%, rgba(59, 130, 246, 0.55) 60%, transparent 100%)",
                    filter: "blur(55px)",
                }}
                className={`pointer-events-none absolute top-1/2 right-4 h-56 w-56 -translate-y-1/2 rounded-full ${
                    theme ? "opacity-65" : "opacity-45"
                }`}
            />

            {/* Left Side: Minimal Clean Info */}
            <div className="relative z-10 flex h-full min-w-0 flex-1 flex-col justify-between py-1">
                <div>
                    <span className="inline-block bg-gradient-to-r from-cyan-400 via-blue-400 to-pink-400 bg-clip-text text-xs font-extrabold uppercase tracking-[0.18em] text-transparent">
                        {title}
                    </span>
                    <p className={`mt-1 text-xs font-medium ${muted}`}>{subtitle}</p>
                </div>

                <div className="my-auto py-2">
                    <p className={`text-4xl font-black tracking-tight tabular-nums ${strong}`}>
                        {safeValue}%
                    </p>
                    {change != null ? (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-emerald-300 backdrop-blur-md">
                            <span>{change >= 0 ? `+${change}\%` : `${change}%`}</span>
                            <span className={`font-normal ${muted}`}>{changeLabel}</span> </div> ) : ( <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold text-pink-200 backdrop-blur-md"> <span className="h-2 w-2 rounded-full bg-pink-400" /> <span>Live Sync</span> </div> )} </div>  {items.length > 0 && ( <div className="space-y-1 border-t border-white/10 pt-2"> {items.slice(0, 2).map((item) => ( <div key={item.label} className="flex items-center justify-between text-xs" > <span className={`truncate ${muted}`}>{item.label}</span>
                                <span className={`font-bold tabular-nums ${strong}`}>
                                    {Math.round(item.value)}%
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Right Side: Large iOS Gradient Circular Ring */}
            <div className="relative z-10 flex shrink-0 items-center justify-center">
                <svg
                    width={size}
                    height={size}
                    className="-rotate-90 transform drop-shadow-[0_0_12px_rgba(236,72,153,0.35)]"
                >
                    <defs>
                        <linearGradient id="iosSingleGrowthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#38bdf8" />
                            <stop offset="50%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                    </defs>

                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="transparent"
                        stroke={theme ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.08)"}
                        strokeWidth={strokeWidth}
                    />

                    <motion.circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="transparent"
                        stroke="url(#iosSingleGrowthGrad)"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={reduceMotion ? false : { strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    />
                </svg>

                {/* Center Frosted Glass Circle */}
                <div
                    className={`absolute flex h-24 w-24 flex-col items-center justify-center rounded-full border text-center backdrop-blur-xl ${
                        theme
                            ? "border-white/15 bg-slate-950/65"
                            : "border-white bg-white/85 shadow-sm"
                    }`}
                >
                    <span className={`text-2xl font-black tabular-nums ${strong}`}>
                        {safeValue}%
                    </span>
                    <span className="bg-gradient-to-r from-cyan-300 to-pink-400 bg-clip-text text-[9px] font-black uppercase tracking-widest text-transparent">
                        Growth
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
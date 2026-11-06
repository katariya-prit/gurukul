import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "../theme/ThemeContext";

export interface SparklinePoint {
    label: string;
    value: number;
}

export type SparklineColorScheme = "red" | "blue" | "green" | "purple" | "amber";

interface SparklineStatCardProps {
    label: string;
    value: number;
    subLabel: string;
    icon: ReactNode;
    data?: SparklinePoint[];
    colorScheme: SparklineColorScheme;
    loading?: boolean;
    index?: number;
    animationKey?: string;
}

const COLOR_MAP: Record<SparklineColorScheme, { accent: string; iconDark: string; iconLight: string; subDark: string; subLight: string }> = {
    red: { accent: "#f87171", iconDark: "bg-red-500/10 text-red-400", iconLight: "bg-[#9b001c]/10 text-[#9b001c]", subDark: "text-emerald-400", subLight: "text-emerald-600" },
    blue: { accent: "#60a5fa", iconDark: "bg-blue-500/10 text-blue-300", iconLight: "bg-blue-500/10 text-blue-600", subDark: "text-emerald-400", subLight: "text-emerald-600" },
    green: { accent: "#34d399", iconDark: "bg-emerald-500/10 text-emerald-400", iconLight: "bg-emerald-500/10 text-emerald-600", subDark: "text-emerald-400", subLight: "text-emerald-600" },
    purple: { accent: "#c084fc", iconDark: "bg-purple-500/10 text-purple-400", iconLight: "bg-purple-500/10 text-purple-600", subDark: "text-emerald-400", subLight: "text-emerald-600" },
    amber: { accent: "#fbbf24", iconDark: "bg-amber-500/10 text-amber-400", iconLight: "bg-amber-500/10 text-amber-600", subDark: "text-emerald-400", subLight: "text-emerald-600" },
};

export function useCountUp(target: number, duration: number): number {
    const [count, setCount] = useState(target);
    const currentValue = useRef(target);

    useEffect(() => {
        const startValue = currentValue.current;
        const startTime = performance.now();
        let animationFrame = 0;

        const updateCount = (time: number) => {
            const progress = Math.min((time - startTime) / duration, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const nextValue = Math.round(startValue + (target - startValue) * easedProgress);
            currentValue.current = nextValue;
            setCount(nextValue);
            if (progress < 1) animationFrame = requestAnimationFrame(updateCount);
        };

        animationFrame = requestAnimationFrame(updateCount);
        return () => cancelAnimationFrame(animationFrame);
    }, [target, duration]);

    return count;
}

function TooltipContent({ active, payload, theme }: { active?: boolean; payload?: Array<{ payload: SparklinePoint }>; theme: boolean }) {
    if (!active || !payload?.[0]) return null;
    const point = payload[0].payload;
    return (
        <div className={`rounded-lg border px-2.5 py-1.5 text-xs shadow-lg ${theme ? "border-gray-700 bg-gray-800 text-gray-100" : "border-gray-200 bg-white text-gray-900"}`}>
            <p className={theme ? "text-gray-400" : "text-gray-500"}>{point.label}</p>
            <p className="font-bold">{point.value}</p>
        </div>
    );
}

export default function SparklineStatCard({ label, value, subLabel, icon, data, colorScheme, loading = false, index = 0, animationKey = "default" }: SparklineStatCardProps) {
    const { theme } = useTheme();
    const colors = COLOR_MAP[colorScheme];
    const displayValue = useCountUp(value, 800);
    const gradientId = `sparkline-${colorScheme}-${index}`;
    const chartData = useMemo(
        () =>
            data?.length
                ? data
                : Array.from({ length: animationKey === "week" ? 7 : 30 }, (_, pointIndex) => ({
                      label: `Day ${pointIndex + 1}`,
                      value: 0,
                  })),
        [animationKey, data]
    );

    return (
    <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: index * 0.08, ease: "easeOut" }}
        whileHover={{ y: -3 }}
        className={`rounded-2xl border p-5 shadow-sm transition-[background-color,border-color,box-shadow] duration-300 hover:shadow-lg ${theme ? "bg-gray-900 border-gray-800 hover:border-gray-700 hover:shadow-black/20" : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-gray-200/60"}`}
    >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className={`text-xs font-bold tracking-wide uppercase ${theme ? "text-gray-500" : "text-gray-400"}`}>{label}</p>
                    <p className={`mt-2 text-4xl font-black leading-none ${theme ? "text-white" : "text-gray-900"}`}>{displayValue}</p>
                    <p className={`mt-2 text-xs font-semibold ${theme ? colors.subDark : colors.subLight}`}>{subLabel}</p>
                </div>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${theme ? colors.iconDark : colors.iconLight}`}>{icon}</span>
            </div>

            <div className="mt-5 h-20 w-full" aria-label={`${label} trend chart`}>
                {loading ? (
                    <div className={`h-full w-full animate-pulse rounded-lg ${theme ? "bg-gray-800" : "bg-gray-100"}`} />
                ) : (
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div key={animationKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full w-full">
                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                                minWidth={0}
                                minHeight={80}
                                initialDimension={{ width: 320, height: 80 }}
                            >
                                <AreaChart data={chartData} margin={{ top: 6, right: 2, left: 2, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={colors.accent} stopOpacity={0.35} />
                                                <stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="label" hide />
                                        <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                                        <Tooltip content={<TooltipContent theme={theme} />} cursor={{ stroke: colors.accent, strokeOpacity: 0.2 }} />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke={colors.accent}
                                            strokeWidth={2.5}
                                            fill={`url(#${gradientId})`}
                                            dot={({ cx, cy, index: pointIndex }) =>
                                                pointIndex === chartData.length - 1 ? (
                                                    <circle cx={cx} cy={cy} r={3.5} fill={colors.accent} className="animate-pulse" />
                                                ) : null
                                            }
                                            activeDot={{ r: 3, fill: colors.accent }}
                                            isAnimationActive
                                            animationDuration={1000}
                                            animationEasing="ease-out"
                                        />
                                </AreaChart>
                            </ResponsiveContainer>
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </motion.div>
    );
}
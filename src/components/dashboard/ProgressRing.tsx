import { useEffect, useId, useState } from "react";
import { animate, motion, useReducedMotion } from "motion/react";
import { useTheme } from "../theme/ThemeContext";

interface ProgressRingProps {
    value: number;
    size?: number;
    strokeWidth?: number;
    loading?: boolean;
    caption?: string;
    animationKey?: string | number;
}

export default function ProgressRing({
    value,
    size = 220,
    strokeWidth = 16,
    loading = false,
    caption = "growth",
    animationKey,
}: ProgressRingProps) {
    const { theme } = useTheme();
    const reduceMotion = useReducedMotion();
    const gradientId = useId();
    const safeValue = Number.isFinite(value) ? value : 0;
    const target = loading ? 0 : Math.max(0, Math.min(100, safeValue));
    const [display, setDisplay] = useState(0);

    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;

    useEffect(() => {
        if (reduceMotion) {
            setDisplay(Math.round(target));
            return;
        }

        const controls = animate(0, target, {
            duration: 1.1,
            ease: "easeOut",
            onUpdate: (latest) => setDisplay(Math.round(latest)),
        });

        return () => controls.stop();
    }, [target, animationKey, reduceMotion]);

    const colorFrom = theme ? "#93c5fd" : "#e5425f";
    const colorTo = theme ? "#3b82f6" : "#9b001c";
    const trackColor = theme ? "rgba(148, 163, 184, 0.16)" : "rgba(155, 0, 28, 0.09)";
    const glowColor = theme ? "rgba(59, 130, 246, 0.45)" : "rgba(155, 0, 28, 0.32)";

    return (
        <div className="relative mx-auto aspect-square w-full" style={{ maxWidth: size }}>
            <svg
                viewBox={`0 0 ${size} ${size}`}
                className={`h-full w-full -rotate-90 ${loading ? "animate-pulse" : ""}`}
                role="img"
                aria-label={`${Math.round(target)} percent ${caption}`}
            >
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={colorFrom} />
                        <stop offset="100%" stopColor={colorTo} />
                    </linearGradient>
                </defs>
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={trackColor}
                    strokeWidth={strokeWidth}
                />
                <motion.circle
                    key={animationKey}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference * (1 - target / 100) }}
                    transition={{ duration: reduceMotion ? 0 : 1.1, ease: [0.22, 1, 0.36, 1] }}
                />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="flex items-start">
                    <span
                        className={`text-5xl font-semibold tabular-nums tracking-tight sm:text-6xl ${
                            theme ? "text-white" : "text-gray-900"
                        }`}
                    >
                        {display}
                    </span>
                    <span
                        className={`ml-0.5 mt-2 text-xl font-semibold sm:mt-3 sm:text-2xl ${
                            theme ? "text-blue-300" : "text-[#9b001c]"
                        }`}
                    >
                        %
                    </span>
                </div>
                <span
                    className={`mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                        theme ? "text-gray-400" : "text-gray-500"
                    }`}
                >
                    {caption}
                </span>
            </div>
        </div>
    );
}
import { useId } from "react";
import { LEVEL_NAMES, MAX_LEVEL } from "./levelSystem";

interface LevelIconProps {
    level: number;
    size?: number;
}

const PALETTES: [string, string][] = [
    ["#3b82f6", "#1d4ed8"], // Level 1 (Blue theme)
    ["#0ea5e9", "#0369a1"], // Level 2 (Blue theme)
    ["#2563eb", "#1e40af"], // Level 3 (Blue theme)
    ["#1d4ed8", "#1e3a8a"], // Level 4 (Blue theme)
    ["#38bdf8", "#0284c7"], // Level 5 (Blue theme)
    ["#0284c7", "#0f172a"], // Level 6+ (High Level Blue & Deep Navy)
];

const RED = "#E8333A";
const INK = "#333333";

const OUTER_TIPS: [number, number][] = [
    [48, 16],
    [70.63, 25.37],
    [80, 48],
    [70.63, 70.63],
    [48, 80],
    [25.37, 70.63],
    [16, 48],
    [25.37, 25.37],
];

const CREST_POINTS =
    "48,16 54.51,32.29 70.63,25.37 63.71,41.49 80,48 63.71,54.51 70.63,70.63 54.51,63.71 48,80 41.49,63.71 25.37,70.63 32.29,54.51 16,48 32.29,41.49 25.37,25.37 41.49,32.29";

function GlyphDefs() {
    return (
        <defs>
            <linearGradient id="gkSun" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F8E037" />
                <stop offset="55%" stopColor="#FBE9A0" />
                <stop offset="100%" stopColor="#F59A4A" />
            </linearGradient>
            <linearGradient id="gkGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F9E24A" />
                <stop offset="100%" stopColor="#F58634" />
            </linearGradient>
            <linearGradient id="gkBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00A3E0" />
                <stop offset="100%" stopColor="#3B4A9D" />
            </linearGradient>
            <radialGradient id="gkCrestRed" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#F9B4B4" />
                <stop offset="100%" stopColor={RED} />
            </radialGradient>
            <radialGradient id="gkMagenta" cx="30%" cy="30%" r="80%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="40%" stopColor="#F29BC6" />
                <stop offset="100%" stopColor="#D02A86" />
            </radialGradient>
            {/* Red Glow Filter for High-Level Theme */}
            <filter id="gkRedGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>
    );
}

function Crest() {
    return (
        <g filter="url(#gkRedGlow)">
            <polygon
                points={CREST_POINTS}
                fill="url(#gkCrestRed)"
                stroke={INK}
                strokeWidth="2"
                strokeLinejoin="round"
            />
            {OUTER_TIPS.map(([x, y]) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r="3.6" fill={RED} stroke={INK} strokeWidth="1.5" />
            ))}
            <circle cx="48" cy="48" r="14" fill="url(#gkGold)" stroke={INK} strokeWidth="2" />
            <circle cx="48" cy="48" r="8.5" fill="url(#gkBlue)" stroke={INK} strokeWidth="1.5" />
            <circle cx="48" cy="48" r="3" fill={RED} />
        </g>
    );
}

function Glyph({ level }: { level: number }) {
    // High Level / Second Image style (Blue background with Red Sun & Rays motif)
    if (level >= 4) {
        return (
            <g>
                <GlyphDefs />
                {/* Red Sun Rays matching second image style */}
                {[
                    [48, 22, 48, 12],
                    [60, 26, 68, 18],
                    [68, 36, 78, 32],
                    [72, 48, 82, 48],
                    [68, 60, 78, 66],
                    [60, 70, 68, 78],
                    [48, 74, 48, 84],
                    [36, 70, 28, 78],
                    [28, 60, 18, 66],
                    [24, 48, 14, 48],
                    [28, 36, 18, 32],
                    [36, 26, 28, 18],
                ].map(([x1, y1, x2, y2], idx) => (
                    <line
                        key={idx}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={RED}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        filter="url(#gkRedGlow)"
                    />
                ))}
                {/* Central Sun Circle with Gradient */}
                <circle cx="48" cy="48" r="20" fill="url(#gkSun)" stroke={RED} strokeWidth="3" filter="url(#gkRedGlow)" />
                <circle cx="48" cy="48" r="10" fill="none" stroke={RED} strokeWidth="2.5" />
                <circle cx="48" cy="48" r="4" fill={RED} />
            </g>
        );
    }

    switch (level) {
        case 1:
            return (
                <g>
                    <GlyphDefs />
                    {[
                        [21, 62, 14, 62],
                        [24.62, 48.5, 18.56, 45],
                        [34.5, 38.62, 31, 32.56],
                        [48, 35, 48, 28],
                        [61.5, 38.62, 65, 32.56],
                        [71.38, 48.5, 77.44, 45],
                        [75, 62, 82, 62],
                    ].map(([x1, y1, x2, y2]) => (
                        <line
                            key={`${x1}-${y1}`}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={RED}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                        />
                    ))}
                    <path d="M26 62A22 22 0 0 1 70 62Z" fill="url(#gkSun)" stroke={RED} strokeWidth="3" strokeLinejoin="round" />
                    <rect x="14" y="62" width="68" height="10" rx="5" fill="url(#gkBlue)" stroke={INK} strokeWidth="1.5" />
                </g>
            );
        case 2:
            return (
                <g>
                    <GlyphDefs />
                    <ellipse cx="48" cy="61" rx="24" ry="5" fill="url(#gkBlue)" stroke={INK} strokeWidth="1.5" />
                    {[-62, 62, -31, 31, 0].map((angle) => (
                        <ellipse
                            key={angle}
                            cx="48"
                            cy="38"
                            rx="8.5"
                            ry="17"
                            fill="url(#gkMagenta)"
                            stroke={INK}
                            strokeWidth="1.5"
                            transform={`rotate(${angle} 48 54)`}
                        />
                    ))}
                    <circle cx="48" cy="54" r="5" fill="url(#gkSun)" stroke={RED} strokeWidth="1.5" />
                </g>
            );
        case 3:
        default:
            return (
                <g>
                    <GlyphDefs />
                    <Crest />
                </g>
            );
    }
}

export default function LevelIcon({ level, size = 112 }: LevelIconProps) {
    const uid = useId();
    const safeLevel = Math.max(1, Math.min(MAX_LEVEL, Math.round(level) || 1));
    const paletteIndex = Math.min(safeLevel - 1, PALETTES.length - 1);
    const [from, to] = PALETTES[paletteIndex];
    
    const gradientId = `${uid}-bg`;
    const shineId = `${uid}-shine`;
    const levelName = LEVEL_NAMES && LEVEL_NAMES[safeLevel - 1] ? LEVEL_NAMES[safeLevel - 1] : `Level ${safeLevel}`;

    return (
        <svg
            viewBox="0 0 96 96"
            width={size}
            height={size}
            role="img"
            aria-label={`Level ${safeLevel} ${levelName}`}
            className="shrink-0 drop-shadow-lg"
        >
            <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={from} />
                    <stop offset="100%" stopColor={to} />
                </linearGradient>
                <linearGradient id={shineId} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
                    <stop offset="55%" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
            </defs>
            <rect width="96" height="96" rx="26" fill={`url(#${gradientId})`} />
            <rect width="96" height="96" rx="26" fill={`url(#${shineId})`} />
            <rect x="1.5" y="1.5" width="93" height="93" rx="24.5" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.5" />
            <Glyph level={safeLevel} />
        </svg>
    );
}
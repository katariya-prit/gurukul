import type { CSSProperties } from "react";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */
export interface ChatThemeVariant {
  wallpaper: Pick<
    CSSProperties,
    "backgroundColor" | "backgroundImage" | "backgroundSize" | "backgroundPosition" | "backgroundRepeat" | "backgroundBlendMode"
  >;
  mine: { background: string; color: string; shadow: string; timeColor: string };
  theirs: { background: string; color: string; border: string; shadow: string; timeColor: string };
  accent: string;
  accentGradient: string;
  chip: { background: string; color: string; border: string };
  headerTint: string;
}

export type ChatThemeCategory = "signature" | "nature" | "soft" | "vivid" | "pattern" | "night";

export interface ChatTheme {
  id: string;
  name: string;
  tagline: string;
  category: ChatThemeCategory;
  light: ChatThemeVariant;
  dark: ChatThemeVariant;
}

export const CHAT_THEME_CATEGORIES: { id: ChatThemeCategory; label: string }[] = [
  { id: "signature", label: "Signature" },
  { id: "nature", label: "Nature" },
  { id: "soft", label: "Soft" },
  { id: "vivid", label: "Vivid" },
  { id: "pattern", label: "Patterns" },
  { id: "night", label: "Night" },
];

/* -------------------------------------------------------------------------- */
/*  Colour helpers                                                             */
/* -------------------------------------------------------------------------- */
const toRgb = (hex: string): [number, number, number] => {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const rgba = (hex: string, a: number) => {
  const [r, g, b] = toRgb(hex);
  return `rgba(${r},${g},${b},${Number(a.toFixed(3))})`;
};

const mix = (a: string, b: string, t: number) => {
  const x = toRgb(a);
  const y = toRgb(b);
  return (
    "#" +
    x
      .map((v, i) =>
        Math.round(v + (y[i] - v) * t)
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
  );
};

const svgUrl = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/* -------------------------------------------------------------------------- */
/*  Wallpaper patterns                                                         */
/* -------------------------------------------------------------------------- */
type PatternKind =
  | "glow"
  | "aurora"
  | "dots"
  | "lines"
  | "rays"
  | "waves"
  | "grid"
  | "diagonal"
  | "hatch"
  | "sunset"
  | "stars"
  | "bokeh"
  | "hex"
  | "plus"
  | "diamonds"
  | "chevron"
  | "fade";

const makeWallpaper = (kind: PatternKind, g1: string, g2: string, dark: boolean): { image: string; size: string } => {
  const a = dark ? 0.2 : 0.17; // glow strength
  const l = dark ? 0.08 : 0.07; // line strength

  switch (kind) {
    case "glow":
      return {
        image: `radial-gradient(circle at 15% 10%, ${rgba(g1, a * 0.6)}, transparent 45%), radial-gradient(circle at 85% 90%, ${rgba(g2, a * 0.6)}, transparent 45%)`,
        size: "120% 120%",
      };

    case "aurora":
      return {
        image: `radial-gradient(ellipse at 15% 20%, ${rgba(g1, a)}, transparent 42%), radial-gradient(ellipse at 85% 25%, ${rgba(g2, a)}, transparent 42%), radial-gradient(ellipse at 60% 90%, ${rgba(g1, a * 0.7)}, transparent 42%)`,
        size: "180% 180%",
      };

    case "dots":
      return {
        image: `radial-gradient(circle, ${rgba(g1, l * 2)} 1px, transparent 1.4px), radial-gradient(ellipse at 70% 15%, ${rgba(g2, a * 0.8)}, transparent 48%)`,
        size: "18px 18px, 160% 160%",
      };

    case "lines":
      return {
        image: `repeating-linear-gradient(to bottom, ${rgba(g1, l)} 0, ${rgba(g1, l)} 1px, transparent 1px, transparent 8px), radial-gradient(ellipse at 80% 10%, ${rgba(g2, a)}, transparent 44%)`,
        size: "100% 8px, 160% 160%",
      };

    case "rays":
      return {
        image: `repeating-conic-gradient(from 7deg at 50% 50%, ${rgba(g1, l * 0.7)} 0deg 1deg, transparent 1deg 18deg), radial-gradient(ellipse at 50% 0%, ${rgba(g2, a * 0.7)}, transparent 48%)`,
        size: "220px 220px, 160% 160%",
      };

    case "waves": {
      const wave = svgUrl(
        `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='72' viewBox='0 0 180 72'><path d='M-10 20 C15 5 35 35 60 20 S105 5 130 20 155 35 190 20 M-10 48 C15 33 35 63 60 48 S105 33 130 48 155 63 190 48' fill='none' stroke='${g1}' stroke-opacity='${l}' stroke-width='1'/></svg>`
      );
      return {
        image: `${wave}, radial-gradient(ellipse at 16% 12%, ${rgba(g1, a)}, transparent 42%), radial-gradient(ellipse at 85% 88%, ${rgba(g2, a * 0.8)}, transparent 40%)`,
        size: "180px 72px, 160% 160%, 160% 160%",
      };
    }

    case "grid":
      return {
        image: `linear-gradient(${rgba(g1, l)} 1px, transparent 1px), linear-gradient(90deg, ${rgba(g1, l)} 1px, transparent 1px), radial-gradient(ellipse at 50% 0%, ${rgba(g2, a * 0.7)}, transparent 55%)`,
        size: "24px 24px, 24px 24px, 160% 160%",
      };

    case "diagonal":
      return {
        image: `repeating-linear-gradient(45deg, ${rgba(g1, l * 1.4)} 0, ${rgba(g1, l * 1.4)} 2px, transparent 2px, transparent 14px), radial-gradient(ellipse at 20% 15%, ${rgba(g2, a)}, transparent 45%)`,
        size: "100% 100%, 160% 160%",
      };

    case "hatch":
      return {
        image: `repeating-linear-gradient(45deg, ${rgba(g1, l)} 0, ${rgba(g1, l)} 1px, transparent 1px, transparent 10px), repeating-linear-gradient(-45deg, ${rgba(g1, l)} 0, ${rgba(g1, l)} 1px, transparent 1px, transparent 10px), radial-gradient(ellipse at 75% 10%, ${rgba(g2, a * 0.6)}, transparent 46%)`,
        size: "100% 100%, 100% 100%, 160% 160%",
      };

    case "sunset":
      return {
        image: `radial-gradient(ellipse at 50% 112%, ${rgba(g1, a * 1.4)}, transparent 45%), linear-gradient(to bottom, ${rgba(g1, a * 0.5)}, ${rgba(g2, a)})`,
        size: "160% 160%",
      };

    case "stars": {
      const s = dark ? 0.9 : 0.4;
      return {
        image: `radial-gradient(circle at 30% 40%, ${rgba(g1, s)} 0.8px, transparent 1.4px), radial-gradient(circle at 70% 65%, ${rgba(g2, s * 0.8)} 0.7px, transparent 1.2px), radial-gradient(circle at 15% 80%, ${rgba(g1, s * 0.7)} 1px, transparent 1.6px), radial-gradient(ellipse at 50% 0%, ${rgba(g2, a * 0.8)}, transparent 55%)`,
        size: "83px 83px, 131px 131px, 197px 197px, 180% 180%",
      };
    }

    case "bokeh":
      return {
        image: `radial-gradient(circle at 18% 22%, ${rgba(g1, a)} 0, transparent 16%), radial-gradient(circle at 78% 18%, ${rgba(g2, a)} 0, transparent 14%), radial-gradient(circle at 62% 70%, ${rgba(g1, a * 0.8)} 0, transparent 18%), radial-gradient(circle at 25% 82%, ${rgba(g2, a * 0.8)} 0, transparent 15%), radial-gradient(circle at 90% 88%, ${rgba(g1, a * 0.6)} 0, transparent 12%)`,
        size: "140% 140%",
      };

    case "hex": {
      const hex = svgUrl(
        `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'><g fill-rule='evenodd'><g fill='none' stroke='${g1}' stroke-opacity='${l * 1.2}'><path d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/></g></g></svg>`
      );
      return {
        image: `${hex}, radial-gradient(ellipse at 20% 10%, ${rgba(g2, a)}, transparent 46%)`,
        size: "28px 49px, 160% 160%",
      };
    }

    case "plus": {
      const plus = svgUrl(
        `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><path d='M20 16v8M16 20h8' stroke='${g1}' stroke-opacity='${l * 2}' stroke-width='1.4' stroke-linecap='round' fill='none'/></svg>`
      );
      return {
        image: `${plus}, radial-gradient(ellipse at 80% 12%, ${rgba(g2, a)}, transparent 46%)`,
        size: "40px 40px, 160% 160%",
      };
    }

    case "diamonds": {
      const dia = svgUrl(
        `<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'><path d='M18 4 L32 18 L18 32 L4 18 Z' fill='none' stroke='${g1}' stroke-opacity='${l * 1.4}' stroke-width='1'/></svg>`
      );
      return {
        image: `${dia}, radial-gradient(ellipse at 50% 100%, ${rgba(g2, a * 0.8)}, transparent 48%)`,
        size: "36px 36px, 160% 160%",
      };
    }

    case "chevron": {
      const chev = svgUrl(
        `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='20' viewBox='0 0 40 20'><path d='M0 12 L20 2 L40 12' fill='none' stroke='${g1}' stroke-opacity='${l * 1.4}' stroke-width='1'/></svg>`
      );
      return {
        image: `${chev}, radial-gradient(ellipse at 15% 90%, ${rgba(g2, a * 0.8)}, transparent 46%)`,
        size: "40px 20px, 160% 160%",
      };
    }

    case "fade":
    default:
      return {
        image: `linear-gradient(165deg, ${rgba(g1, a * 1.5)}, ${rgba(g2, a * 0.9)})`,
        size: "100% 100%",
      };
  }
};

/* -------------------------------------------------------------------------- */
/*  Theme builder (every theme gets a Light AND a Dark variant)                */
/* -------------------------------------------------------------------------- */
interface ThemeSpec {
  id: string;
  name: string;
  tagline: string;
  category: ChatThemeCategory;
  pattern: PatternKind;
  /** Deep colours for own bubbles / send button (white text stays readable) */
  bubble: [string, string];
  /** Colours used for wallpaper glow / pattern */
  glow: [string, string];
  /** Wallpaper base colour in light mode */
  light: string;
  /** Wallpaper base colour in dark mode */
  dark: string;
  darkBubble?: [string, string];
  darkGlow?: [string, string];
  accent?: string;
  accentDark?: string;
}

const buildVariant = (spec: ThemeSpec, isDark: boolean): ChatThemeVariant => {
  const base = isDark ? spec.dark : spec.light;
  const [g1, g2] = isDark ? spec.darkGlow ?? spec.glow : spec.glow;
  const bub = isDark ? spec.darkBubble ?? spec.bubble : spec.bubble;
  const accent = isDark ? spec.accentDark ?? mix(bub[0], "#ffffff", 0.45) : spec.accent ?? bub[0];
  const wall = makeWallpaper(spec.pattern, g1, g2, isDark);

  return {
    wallpaper: {
      backgroundColor: base,
      backgroundImage: wall.image,
      backgroundSize: wall.size,
    },
    mine: {
      background: `linear-gradient(135deg, ${bub[0]}, ${bub[1]})`,
      color: "#ffffff",
      shadow: `0 8px 24px ${rgba(accent, 0.18)}`,
      timeColor: "rgba(255,255,255,0.85)",
    },
    theirs: {
      background: rgba(mix(base, "#ffffff", isDark ? 0.08 : 0.72), 0.95),
      color: isDark ? "#f1f5f9" : "#1e293b",
      border: `1px solid ${rgba(accent, isDark ? 0.22 : 0.16)}`,
      shadow: `0 8px 24px ${rgba(accent, 0.1)}`,
      timeColor: isDark ? "#e2e8f0" : "#475569",
    },
    accent,
    accentGradient: `linear-gradient(120deg, ${bub[0]}, ${bub[1]})`,
    chip: {
      background: rgba(mix(base, "#ffffff", isDark ? 0.1 : 0.8), 0.95),
      color: isDark ? mix(accent, "#ffffff", 0.55) : bub[0],
      border: rgba(accent, isDark ? 0.33 : 0.22),
    },
    headerTint: isDark ? rgba(base, 0.28) : rgba(accent, 0.05),
  };
};

const defineTheme = (spec: ThemeSpec): ChatTheme => ({
  id: spec.id,
  name: spec.name,
  tagline: spec.tagline,
  category: spec.category,
  light: buildVariant(spec, false),
  dark: buildVariant(spec, true),
});

/* -------------------------------------------------------------------------- */
/*  Themes                                                                     */
/* -------------------------------------------------------------------------- */
export const CHAT_THEMES: ChatTheme[] = [
  /* ------------------------------- SIGNATURE ------------------------------ */
  defineTheme({
    id: "classic", name: "Classic", tagline: "The familiar calm", category: "signature", pattern: "glow",
    bubble: ["#dc2626", "#e11d48"], darkBubble: ["#2563eb", "#4f46e5"],
    glow: ["#dc2626", "#f43f5e"], darkGlow: ["#3b82f6", "#0ea5e9"],
    accent: "#dc2626", accentDark: "#3b82f6", light: "#F8FAFC", dark: "#070D1A",
  }),
  defineTheme({
    id: "lotus-dawn", name: "Lotus Dawn", tagline: "Blush, softly lit", category: "signature", pattern: "aurora",
    bubble: ["#be123c", "#e11d48"], darkBubble: ["#be123c", "#9f1239"],
    glow: ["#fb7185", "#fde4d3"], darkGlow: ["#e11d48", "#a855f7"],
    accentDark: "#fb7185", light: "#fff7f4", dark: "#170d1b",
  }),
  defineTheme({
    id: "ocean-calm", name: "Ocean Calm", tagline: "A quieter tide", category: "signature", pattern: "waves",
    bubble: ["#0e7490", "#0369a1"], glow: ["#22d3ee", "#14b8a6"],
    accent: "#0891b2", accentDark: "#22d3ee", light: "#effbfc", dark: "#06151c",
  }),
  defineTheme({
    id: "midnight-aurora", name: "Midnight Aurora", tagline: "A hush of color", category: "signature", pattern: "aurora",
    bubble: ["#5b21b6", "#047857"], glow: ["#34d399", "#8b5cf6"],
    accent: "#7c3aed", accentDark: "#34d399", light: "#f2f0fb", dark: "#080d1b",
  }),
  defineTheme({
    id: "sandalwood", name: "Sandalwood", tagline: "Warm, grounded ivory", category: "signature", pattern: "dots",
    bubble: ["#92400e", "#a16207"], glow: ["#b45309", "#f5deb3"],
    accent: "#b45309", accentDark: "#fbbf24", light: "#fbf5e9", dark: "#1c1410",
  }),
  defineTheme({
    id: "emerald-mist", name: "Emerald Mist", tagline: "Soft sage stillness", category: "signature", pattern: "aurora",
    bubble: ["#065f46", "#047857"], glow: ["#10b981", "#a7f3d0"],
    accent: "#059669", accentDark: "#34d399", light: "#eef8f1", dark: "#07140f",
  }),
  defineTheme({
    id: "royal-indigo", name: "Royal Indigo", tagline: "Quietly regal", category: "signature", pattern: "rays",
    bubble: ["#4338ca", "#4f46e5"], glow: ["#4f46e5", "#f59e0b"],
    accent: "#4f46e5", accentDark: "#a5b4fc", light: "#f2f1fc", dark: "#111126",
  }),
  defineTheme({
    id: "saffron-dusk", name: "Saffron Dusk", tagline: "Evening at the ashram", category: "signature", pattern: "sunset",
    bubble: ["#c2410c", "#d97706"], glow: ["#fb923c", "#c4b5fd"],
    accent: "#ea580c", accentDark: "#fb923c", light: "#fff6ee", dark: "#19121d",
  }),
  defineTheme({
    id: "zen-slate", name: "Zen Slate", tagline: "A clean, quiet space", category: "signature", pattern: "lines",
    bubble: ["#334155", "#475569"], glow: ["#475569", "#94a3b8"],
    accent: "#475569", accentDark: "#94a3b8", light: "#f2f5f7", dark: "#10151c",
  }),
  defineTheme({
    id: "ganga", name: "Ganga", tagline: "Flowing, pure water", category: "signature", pattern: "waves",
    bubble: ["#0369a1", "#0e7490"], glow: ["#38bdf8", "#2dd4bf"],
    accent: "#0284c7", accentDark: "#38bdf8", light: "#eef8fd", dark: "#061520",
  }),
  defineTheme({
    id: "diwali", name: "Diwali", tagline: "A festival of lights", category: "signature", pattern: "stars",
    bubble: ["#b45309", "#c2410c"], glow: ["#f59e0b", "#ef4444"],
    accent: "#d97706", accentDark: "#fbbf24", light: "#fff8e6", dark: "#150d08",
  }),
  defineTheme({
    id: "holi", name: "Holi", tagline: "Colours in the air", category: "signature", pattern: "bokeh",
    bubble: ["#c026d3", "#db2777"], glow: ["#f472b6", "#22d3ee"],
    accent: "#c026d3", accentDark: "#e879f9", light: "#fff5fb", dark: "#170c1c",
  }),
  defineTheme({
    id: "tulsi", name: "Tulsi", tagline: "Sacred green", category: "signature", pattern: "hex",
    bubble: ["#166534", "#15803d"], glow: ["#22c55e", "#bef264"],
    accent: "#16a34a", accentDark: "#4ade80", light: "#f1faf2", dark: "#07130b",
  }),

  /* --------------------------------- NATURE ------------------------------- */
  defineTheme({
    id: "sunrise", name: "Sunrise", tagline: "First light of day", category: "nature", pattern: "sunset",
    bubble: ["#be185d", "#ea580c"], glow: ["#fbbf24", "#fb7185"],
    accent: "#e11d48", accentDark: "#fb923c", light: "#fff7ed", dark: "#1a0f12",
  }),
  defineTheme({
    id: "desert-dunes", name: "Desert Dunes", tagline: "Warm, windswept sand", category: "nature", pattern: "lines",
    bubble: ["#a16207", "#b45309"], glow: ["#d97706", "#fde68a"],
    accent: "#b45309", accentDark: "#fbbf24", light: "#fdf6e3", dark: "#1a140b",
  }),
  defineTheme({
    id: "mountain-mist", name: "Mountain Mist", tagline: "Cool, quiet peaks", category: "nature", pattern: "aurora",
    bubble: ["#475569", "#0f766e"], glow: ["#94a3b8", "#5eead4"],
    accent: "#0f766e", accentDark: "#5eead4", light: "#f1f5f6", dark: "#0c1417",
  }),
  defineTheme({
    id: "rainy-day", name: "Rainy Day", tagline: "Soft rain on glass", category: "nature", pattern: "diagonal",
    bubble: ["#1d4ed8", "#0369a1"], glow: ["#60a5fa", "#93c5fd"],
    accent: "#2563eb", accentDark: "#60a5fa", light: "#eef4fb", dark: "#08121f",
  }),
  defineTheme({
    id: "cherry-blossom", name: "Cherry Blossom", tagline: "Spring in bloom", category: "nature", pattern: "bokeh",
    bubble: ["#be185d", "#db2777"], glow: ["#f9a8d4", "#fecdd3"],
    accent: "#db2777", accentDark: "#f9a8d4", light: "#fff5f8", dark: "#1c0c14",
  }),
  defineTheme({
    id: "meadow", name: "Meadow", tagline: "Green fields, bright air", category: "nature", pattern: "dots",
    bubble: ["#15803d", "#4d7c0f"], glow: ["#4ade80", "#fde047"],
    accent: "#16a34a", accentDark: "#86efac", light: "#f3faeb", dark: "#0b1407",
  }),
  defineTheme({
    id: "lavender-fields", name: "Lavender Fields", tagline: "Calm purple haze", category: "nature", pattern: "aurora",
    bubble: ["#6d28d9", "#7e22ce"], glow: ["#a78bfa", "#f0abfc"],
    accent: "#7c3aed", accentDark: "#c4b5fd", light: "#f6f2fd", dark: "#150e22",
  }),
  defineTheme({
    id: "forest-night", name: "Forest Night", tagline: "Deep, mossy quiet", category: "nature", pattern: "aurora",
    bubble: ["#14532d", "#166534"], glow: ["#22c55e", "#0d9488"],
    accent: "#15803d", accentDark: "#4ade80", light: "#eef6ef", dark: "#050f0a",
  }),

  /* ---------------------------------- SOFT -------------------------------- */
  defineTheme({
    id: "peach-cream", name: "Peach Cream", tagline: "Sweet and gentle", category: "soft", pattern: "aurora",
    bubble: ["#c2410c", "#be123c"], glow: ["#fdba74", "#fecdd3"],
    accent: "#ea580c", accentDark: "#fdba74", light: "#fff8f2", dark: "#1c120d",
  }),
  defineTheme({
    id: "mint-fresh", name: "Mint Fresh", tagline: "Cool and crisp", category: "soft", pattern: "dots",
    bubble: ["#0f766e", "#047857"], glow: ["#5eead4", "#bbf7d0"],
    accent: "#0d9488", accentDark: "#5eead4", light: "#effcf8", dark: "#06161a",
  }),
  defineTheme({
    id: "sky-blue", name: "Sky Blue", tagline: "Open, clear sky", category: "soft", pattern: "aurora",
    bubble: ["#0369a1", "#1d4ed8"], glow: ["#7dd3fc", "#bae6fd"],
    accent: "#0284c7", accentDark: "#7dd3fc", light: "#f0f9ff", dark: "#07131f",
  }),
  defineTheme({
    id: "lilac-haze", name: "Lilac Haze", tagline: "Dreamy and light", category: "soft", pattern: "aurora",
    bubble: ["#7e22ce", "#a21caf"], glow: ["#d8b4fe", "#f5d0fe"],
    accent: "#9333ea", accentDark: "#d8b4fe", light: "#faf5ff", dark: "#160d1f",
  }),
  defineTheme({
    id: "butter", name: "Butter", tagline: "Sunny and mellow", category: "soft", pattern: "dots",
    bubble: ["#a16207", "#b45309"], glow: ["#fde047", "#fed7aa"],
    accent: "#ca8a04", accentDark: "#fde047", light: "#fffbea", dark: "#1a1505",
  }),
  defineTheme({
    id: "rose-quartz", name: "Rose Quartz", tagline: "Gentle pink glow", category: "soft", pattern: "aurora",
    bubble: ["#be185d", "#e11d48"], glow: ["#fbcfe8", "#fecdd3"],
    accent: "#e11d48", accentDark: "#fda4af", light: "#fff1f5", dark: "#1a0d14",
  }),
  defineTheme({
    id: "cotton-candy", name: "Cotton Candy", tagline: "Pink meets sky", category: "soft", pattern: "bokeh",
    bubble: ["#c026d3", "#0284c7"], glow: ["#f9a8d4", "#a5f3fc"],
    accent: "#c026d3", accentDark: "#f0abfc", light: "#fdf4ff", dark: "#120f22",
  }),

  /* --------------------------------- VIVID -------------------------------- */
  defineTheme({
    id: "ruby", name: "Ruby", tagline: "Bold and confident", category: "vivid", pattern: "fade",
    bubble: ["#b91c1c", "#9f1239"], glow: ["#ef4444", "#e11d48"],
    accent: "#dc2626", accentDark: "#f87171", light: "#fff1f1", dark: "#1c0809",
  }),
  defineTheme({
    id: "electric-blue", name: "Electric Blue", tagline: "Sharp and energetic", category: "vivid", pattern: "fade",
    bubble: ["#1d4ed8", "#4338ca"], glow: ["#3b82f6", "#6366f1"],
    accent: "#2563eb", accentDark: "#60a5fa", light: "#eff4ff", dark: "#060c20",
  }),
  defineTheme({
    id: "neon-violet", name: "Neon Violet", tagline: "Electric purple", category: "vivid", pattern: "fade",
    bubble: ["#7c3aed", "#c026d3"], glow: ["#a855f7", "#e879f9"],
    accent: "#9333ea", accentDark: "#c084fc", light: "#f8f0ff", dark: "#10061c",
  }),
  defineTheme({
    id: "teal-pop", name: "Teal Pop", tagline: "Fresh and lively", category: "vivid", pattern: "fade",
    bubble: ["#0f766e", "#0e7490"], glow: ["#14b8a6", "#06b6d4"],
    accent: "#0d9488", accentDark: "#2dd4bf", light: "#ecfeff", dark: "#041618",
  }),
  defineTheme({
    id: "sunset-orange", name: "Sunset Orange", tagline: "Hot, glowing dusk", category: "vivid", pattern: "fade",
    bubble: ["#c2410c", "#be123c"], glow: ["#f97316", "#f43f5e"],
    accent: "#ea580c", accentDark: "#fb923c", light: "#fff4ec", dark: "#1c0c06",
  }),
  defineTheme({
    id: "lime-zest", name: "Lime Zest", tagline: "Bright and zesty", category: "vivid", pattern: "fade",
    bubble: ["#4d7c0f", "#15803d"], glow: ["#84cc16", "#22c55e"],
    accent: "#65a30d", accentDark: "#a3e635", light: "#f7fee7", dark: "#0b1204",
  }),

  /* -------------------------------- PATTERNS ------------------------------ */
  defineTheme({
    id: "doodle-plus", name: "Doodle Plus", tagline: "Tiny crosses, calm mind", category: "pattern", pattern: "plus",
    bubble: ["#0f766e", "#0369a1"], glow: ["#14b8a6", "#38bdf8"],
    accent: "#0d9488", accentDark: "#2dd4bf", light: "#f1faf9", dark: "#071315",
  }),
  defineTheme({
    id: "hex-grid", name: "Hex Grid", tagline: "Honeycomb structure", category: "pattern", pattern: "hex",
    bubble: ["#4338ca", "#6d28d9"], glow: ["#6366f1", "#a78bfa"],
    accent: "#4f46e5", accentDark: "#a5b4fc", light: "#f4f3fd", dark: "#0e0c22",
  }),
  defineTheme({
    id: "diamonds", name: "Diamonds", tagline: "Classic lattice", category: "pattern", pattern: "diamonds",
    bubble: ["#9f1239", "#be123c"], glow: ["#e11d48", "#f59e0b"],
    accent: "#be123c", accentDark: "#fb7185", light: "#fff5f5", dark: "#1a0b10",
  }),
  defineTheme({
    id: "chevron", name: "Chevron", tagline: "Rolling zig-zag", category: "pattern", pattern: "chevron",
    bubble: ["#0369a1", "#0f766e"], glow: ["#0ea5e9", "#14b8a6"],
    accent: "#0284c7", accentDark: "#38bdf8", light: "#eef8fb", dark: "#071622",
  }),
  defineTheme({
    id: "blueprint", name: "Blueprint", tagline: "Clean engineering grid", category: "pattern", pattern: "grid",
    bubble: ["#1d4ed8", "#1e40af"], glow: ["#3b82f6", "#60a5fa"],
    accent: "#2563eb", accentDark: "#60a5fa", light: "#eef3fb", dark: "#08122a",
  }),
  defineTheme({
    id: "candy-stripes", name: "Candy Stripes", tagline: "Playful diagonals", category: "pattern", pattern: "diagonal",
    bubble: ["#be185d", "#7e22ce"], glow: ["#ec4899", "#a855f7"],
    accent: "#db2777", accentDark: "#f472b6", light: "#fdf2f8", dark: "#190b1a",
  }),
  defineTheme({
    id: "hatch", name: "Crosshatch", tagline: "Sketched, textured paper", category: "pattern", pattern: "hatch",
    bubble: ["#44403c", "#57534e"], glow: ["#78716c", "#a8a29e"],
    accent: "#57534e", accentDark: "#d6d3d1", light: "#f6f4f1", dark: "#161412",
  }),
  defineTheme({
    id: "sun-rays", name: "Sun Rays", tagline: "Golden burst", category: "pattern", pattern: "rays",
    bubble: ["#b45309", "#c2410c"], glow: ["#f59e0b", "#ef4444"],
    accent: "#d97706", accentDark: "#fbbf24", light: "#fffaf0", dark: "#1a1208",
  }),

  /* ---------------------------------- NIGHT ------------------------------- */
  defineTheme({
    id: "starry-night", name: "Starry Night", tagline: "A sky full of stars", category: "night", pattern: "stars",
    bubble: ["#3730a3", "#5b21b6"], glow: ["#c7d2fe", "#e9d5ff"],
    accent: "#4f46e5", accentDark: "#c7d2fe", light: "#eef0fb", dark: "#05081a",
  }),
  defineTheme({
    id: "cosmos", name: "Cosmos", tagline: "Nebula glow", category: "night", pattern: "bokeh",
    bubble: ["#6d28d9", "#be185d"], glow: ["#8b5cf6", "#ec4899"],
    accent: "#7c3aed", accentDark: "#c4b5fd", light: "#f6f0fc", dark: "#0b0618",
  }),
  defineTheme({
    id: "obsidian", name: "Obsidian", tagline: "Pure, minimal dark", category: "night", pattern: "fade",
    bubble: ["#27272a", "#3f3f46"], glow: ["#71717a", "#a1a1aa"],
    accent: "#52525b", accentDark: "#a1a1aa", light: "#f4f4f5", dark: "#09090b",
  }),
  defineTheme({
    id: "midnight-ocean", name: "Midnight Ocean", tagline: "Deep, dark waters", category: "night", pattern: "waves",
    bubble: ["#1e40af", "#0e7490"], glow: ["#3b82f6", "#06b6d4"],
    accent: "#2563eb", accentDark: "#38bdf8", light: "#eef3fb", dark: "#050d1c",
  }),
  defineTheme({
    id: "ember", name: "Ember", tagline: "Glowing coals", category: "night", pattern: "sunset",
    bubble: ["#b91c1c", "#c2410c"], glow: ["#f97316", "#ef4444"],
    accent: "#dc2626", accentDark: "#fb923c", light: "#fff3ee", dark: "#150907",
  }),
];

export const DEFAULT_CHAT_THEME_ID = "classic";

export const getChatTheme = (id: string | null | undefined): ChatTheme =>
  CHAT_THEMES.find((chatTheme) => chatTheme.id === id) ??
  CHAT_THEMES.find((chatTheme) => chatTheme.id === DEFAULT_CHAT_THEME_ID)!;
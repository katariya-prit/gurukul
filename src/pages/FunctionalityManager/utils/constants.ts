import {
    LuActivity,
    LuAtom,
    LuBookOpen,
    LuCalculator,
    LuChartNoAxesCombined,
    LuCode,
    LuDrum,
    LuGraduationCap,
    LuLayers,
    LuMusic2,
    LuPalette,
    LuPiano,
    LuPuzzle,
    LuSparkles,
    LuTrophy,
    LuWandSparkles,
} from "react-icons/lu";
import type { ComponentType } from "react";
import type { EvaluatorType, WidgetType } from "../types";

export const FUNCTIONALITY_ROUTE = "/dashboard/functionality-manager";

export const ICON_OPTIONS: Array<{ key: string; label: string; icon: ComponentType<{ className?: string }> }> = [
    { key: "activity", label: "Activity", icon: LuActivity },
    { key: "atom", label: "Science", icon: LuAtom },
    { key: "book-open", label: "Book", icon: LuBookOpen },
    { key: "calculator", label: "Calculator", icon: LuCalculator },
    { key: "chart", label: "Chart", icon: LuChartNoAxesCombined },
    { key: "code", label: "Code", icon: LuCode },
    { key: "drum", label: "Drum", icon: LuDrum },
    { key: "graduation-cap", label: "Education", icon: LuGraduationCap },
    { key: "layers", label: "Layers", icon: LuLayers },
    { key: "music", label: "Music", icon: LuMusic2 },
    { key: "palette", label: "Art", icon: LuPalette },
    { key: "piano", label: "Piano", icon: LuPiano },
    { key: "puzzle", label: "Puzzle", icon: LuPuzzle },
    { key: "sparkles", label: "Sparkles", icon: LuSparkles },
    { key: "trophy", label: "Trophy", icon: LuTrophy },
    { key: "wand", label: "Creative", icon: LuWandSparkles },
];

export const WIDGET_TYPES: Array<{ value: WidgetType; label: string }> = [
    { value: "levelBadge", label: "Level Badge" },
    { value: "progressRing", label: "Progress Ring" },
    { value: "recentMarks", label: "Recent Marks" },
    { value: "growthChart", label: "Growth Chart" },
    { value: "itemStats", label: "Item Stats" },
];

export const EVALUATOR_OPTIONS: Array<{ value: EvaluatorType; label: string }> = [
    { value: "ai", label: "AI" },
    { value: "teacher", label: "Teacher" },
    { value: "both", label: "Both" },
];

export const FUNCTIONALITY_PATHS = {
    functionalities: `${FUNCTIONALITY_ROUTE}/functionalities`,
    items: `${FUNCTIONALITY_ROUTE}/items`,
    widgets: `${FUNCTIONALITY_ROUTE}/widgets`,
    enrollment: `${FUNCTIONALITY_ROUTE}/enrollment`,
} as const;

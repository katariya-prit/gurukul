import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTheme } from "../components/theme/ThemeContext";
import SparklineStatCard, { type SparklinePoint } from "../components/dashboard/SparklineStatCard";
import LevelBadge from "../components/dashboard/Levelbadge";
import GrowthCard, { type GrowthItem } from "../components/dashboard/GrowthCard";
import LevelCard from "../components/dashboard/LevelCard";
import { STATIC_LEVEL } from "../components/dashboard/levelSystem";
import {
    HiOutlineOfficeBuilding,
    HiOutlineUserGroup,
    HiOutlineShieldCheck,
    HiOutlineAcademicCap,
} from "react-icons/hi";
import type { AuthUser } from "../Types/Role-create";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

interface GrowthData {
    overall: number;
    change?: number | null;
    items: GrowthItem[];
}

interface DashboardStatsResponse {
    cards: { label: string; value: number; subLabel: string; trend?: SparklinePoint[] }[];
    growth?: GrowthData;
}

interface GrowthCopy {
    title: string;
    subtitle: string;
    itemsTitle: string;
    levelHeading: string;
}

function getGrowthCopy(roleCode: string | undefined): GrowthCopy {
    switch (roleCode) {
        case "SUPER_ADMIN":
            return {
                title: "Overall growth",
                subtitle: "All departments combined",
                itemsTitle: "Growth by role",
                levelHeading: "Gurukul level",
            };
        case "HEAD100":
            return {
                title: "Department growth",
                subtitle: "Your department",
                itemsTitle: "Growth by role",
                levelHeading: "Department level",
            };
        case "SECHEAD101":
            return {
                title: "Section growth",
                subtitle: "Your section",
                itemsTitle: "Growth by role",
                levelHeading: "Section level",
            };
        case "STUDENT":
            return {
                title: "My progress",
                subtitle: "Your overall progress",
                itemsTitle: "Progress by lesson type",
                levelHeading: "Your level",
            };
        default:
            return {
                title: "Overall growth",
                subtitle: "Your overall progress",
                itemsTitle: "Breakdown",
                levelHeading: "Your level",
            };
    }
}

function getStoredDashboardUser(): AuthUser | null {
    const data = localStorage.getItem("user");
    if (!data) return null;

    try {
        const parsedUser = JSON.parse(data) as AuthUser;
        if (typeof parsedUser.permissions === "string") {
            try {
                parsedUser.permissions = JSON.parse(parsedUser.permissions);
            } catch (error) {
                console.error("Failed to parse dashboard user permissions", error);
                parsedUser.permissions = {};
            }
        }
        return parsedUser;
    } catch (error) {
        console.error("Failed to parse dashboard user", error);
        return null;
    }
}

export default function Dashboard() {
    const { theme } = useTheme();
    const shouldReduceMotion = useReducedMotion();
    const [user] = useState<AuthUser | null>(getStoredDashboardUser);
    const [range, setRange] = useState<"week" | "month">("month");
    const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchStats = async () => {
            try {
                setLoading(true);

                const params = new URLSearchParams({
                    role: user.roleCode,
                    range,
                });
                if (user.departmentId != null) params.set("departmentId", String(user.departmentId));
                if (user.sectionId != null) params.set("sectionId", String(user.sectionId));
                const userId = user.id ?? user.suid;
                if (userId != null) params.set("suid", String(userId));

                const token = localStorage.getItem("token");
                const res = await fetch(`${API_URL}/dashboard/stats?${params.toString()}`, {
                    cache: "no-store",
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                const json = await res.json();

                if (json.success) {
                    setStats(json.data);
                } else {
                    console.error("Dashboard stats request failed", json.message);
                }
            } catch (err) {
                console.error("Failed to load dashboard stats", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user, range]);

    const cardIcons = [
        <HiOutlineOfficeBuilding size={18} />,
        <HiOutlineUserGroup size={18} />,
        <HiOutlineAcademicCap size={18} />,
        <HiOutlineShieldCheck size={18} />,
    ];
    const cardColors: ("red" | "blue" | "green" | "purple" | "amber")[] = ["red", "blue", "green", "purple"];

    const isStudent = user?.roleCode === "STUDENT";
    const userLabel = user?.username || user?.roleName || user?.roleCode?.toLowerCase() || "there";
    const growthCopy = getGrowthCopy(user?.roleCode);
    const growth = stats?.growth;

    const filteredCards = (stats?.cards || [])
        .filter(
            (card) =>
                !card.label.toLowerCase().includes("pending") &&
                !card.label.toLowerCase().includes("approval")
        )
        .slice(0, 3);

    const firstCard = filteredCards[0];
    const remainingCards = filteredCards.slice(1, 3);

    return (
        <div className={`dashboard-canvas space-y-6 ${theme ? "dashboard-canvas--dark" : "dashboard-canvas--light"}`}>
            {/* Header */}
            <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
            >
                <div>
                    <h1 className={`text-2xl font-semibold tracking-tight sm:text-3xl ${theme ? "text-white" : "text-gray-900"}`}>
                        Welcome back, <span className={theme ? "text-blue-300" : "text-[#9b001c]"}>{userLabel}</span>
                    </h1>
                    <p className={`mt-1.5 text-sm ${theme ? "text-gray-400" : "text-gray-500"}`}>
                        {isStudent ? "A little progress each day adds up." : "Here is what is happening across your Gurukul."}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {isStudent && <LevelBadge level={STATIC_LEVEL.level} />}
                    <div className={`flex rounded-xl border p-1 ${theme ? "border-gray-700/80 bg-gray-800/70" : "border-gray-200 bg-white/80"}`}>
                        {(["week", "month"] as const).map((period) => (
                            <button
                                key={period}
                                type="button"
                                onClick={() => setRange(period)}
                                aria-pressed={range === period}
                                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors duration-200 ${range === period
                                        ? theme
                                            ? "bg-gray-700 text-white shadow-sm"
                                            : "bg-white text-gray-900 shadow-sm"
                                        : theme
                                            ? "text-gray-400 hover:text-gray-200"
                                            : "text-gray-500 hover:text-gray-800"
                                    }`}
                            >
                                {period === "week" ? "1 Week" : "1 Month"}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Perfectly Aligned 12-Column Grid */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-12 items-stretch">
                {/* Left 2x2 Grid: auto-rows-fr forces all 4 cards to have identical height */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:auto-rows-fr xl:col-span-8">
                    {firstCard && (
                        <div className="h-full">
                            <SparklineStatCard
                                key={firstCard.label}
                                label={firstCard.label}
                                value={firstCard.value}
                                subLabel={firstCard.subLabel}
                                data={firstCard.trend}
                                icon={cardIcons[0]}
                                colorScheme={cardColors[0]}
                                loading={loading}
                                index={0}
                                animationKey={range}
                            />
                        </div>
                    )}

                    <div className="h-full">
                        <GrowthCard
                            title={growthCopy.title}
                            subtitle={growthCopy.subtitle}
                            itemsTitle={growthCopy.itemsTitle}
                            value={growth?.overall ?? 0}
                            change={growth?.change}
                            changeLabel={range === "week" ? "vs last week" : "vs last month"}
                            items={growth?.items ?? []}
                            loading={loading}
                            hasData={Boolean(growth)}
                            animationKey={range}
                        />
                    </div>

                    {remainingCards.map((card, idx) => {
                        const actualIndex = idx + 1;
                        return (
                            <div key={card.label} className="h-full">
                                <SparklineStatCard
                                    label={card.label}
                                    value={card.value}
                                    subLabel={card.subLabel}
                                    data={card.trend}
                                    icon={cardIcons[actualIndex % cardIcons.length]}
                                    colorScheme={cardColors[actualIndex % cardColors.length]}
                                    loading={loading}
                                    index={actualIndex}
                                    animationKey={range}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Right Column: Level System */}
                <div className="xl:col-span-4 h-full">
                    <LevelCard state={STATIC_LEVEL} heading={growthCopy.levelHeading} />
                </div>
            </div>
        </div>
    );
}